<?php

namespace App\Services;

use App\Models\Address;
use App\Models\Cart;
use App\Models\CartItem;
use App\Models\Order;
use App\Models\Product;
use App\Models\User;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class OrderService
{
    // Regra de frete da versão acadêmica: grátis.
    private const SHIPPING_CENTS = 0;

    // Limite do decimal(10,2) utilizado no banco.
    private const MAX_CENTS = 9_999_999_999;

    public function checkout(User $user, int $addressId): Order
    {
        return DB::transaction(function () use ($user, $addressId) {

            // O endereço precisa pertencer ao cliente.
            $address = Address::query()
                ->where('user_id', $user->id)
                ->whereKey($addressId)
                ->lockForUpdate()
                ->first();

            if (!$address) {
                throw ValidationException::withMessages([
                    'address_id' => ['Endereço inválido para esta conta.'],
                ]);
            }

            // Bloqueia o carrinho para evitar alterações concorrentes.
            $cart = Cart::query()
                ->where('user_id', $user->id)
                ->lockForUpdate()
                ->first();

            if (!$cart) {
                throw ValidationException::withMessages([
                    'cart' => ['O carrinho está vazio.'],
                ]);
            }

            $cartItems = CartItem::query()
                ->where('cart_id', $cart->id)
                ->orderBy('product_id')
                ->get();

            if ($cartItems->isEmpty()) {
                throw ValidationException::withMessages([
                    'cart' => ['O carrinho está vazio.'],
                ]);
            }

            $lines = [];
            $subtotalCents = 0;

            foreach ($cartItems as $cartItem) {
                // Consulta o produto real e bloqueia a linha.
                $product = Product::query()
                    ->whereKey($cartItem->product_id)
                    ->lockForUpdate()
                    ->first();

                $quantity = (int) $cartItem->quantity;

                if (
                    !$product ||
                    !$product->is_active ||
                    $quantity < 1 ||
                    $product->stock < $quantity
                ) {
                    throw ValidationException::withMessages([
                        'cart' => [
                            "Produto {$cartItem->product_id} indisponível ou sem estoque suficiente."
                        ],
                    ]);
                }

                $unitCents = $this->toCents(
                    (string) $product->price
                );

                // Evita ultrapassar decimal(10,2).
                if (
                    $unitCents < 1 ||
                    $quantity > intdiv(self::MAX_CENTS, $unitCents)
                ) {
                    throw ValidationException::withMessages([
                        'cart' => ['Valor do item excede o limite permitido.'],
                    ]);
                }

                $lineCents = $unitCents * $quantity;

                if (
                    $subtotalCents >
                    self::MAX_CENTS - $lineCents - self::SHIPPING_CENTS
                ) {
                    throw ValidationException::withMessages([
                        'cart' => ['Valor total excede o limite permitido.'],
                    ]);
                }

                $subtotalCents += $lineCents;

                $lines[] = [
                    'product' => $product,
                    'quantity' => $quantity,
                    'unit_cents' => $unitCents,
                    'line_cents' => $lineCents,
                ];
            }

            $totalCents = $subtotalCents + self::SHIPPING_CENTS;

            // Congela o endereço de entrega.
            $addressSnapshot = $address->only([
                'recipient_name',
                'postal_code',
                'street',
                'number',
                'complement',
                'district',
                'city',
                'state',
            ]);

            // Cria o pedido aguardando pagamento.
            $order = Order::create([
                'user_id' => $user->id,
                'address_id' => $address->id,
                'shipping_address' => $addressSnapshot,
                'status' => Order::PENDING,
                'subtotal' => $this->money($subtotalCents),
                'shipping' => $this->money(self::SHIPPING_CENTS),
                'total' => $this->money($totalCents),
            ]);

            foreach ($lines as $line) {
                $product = $line['product'];

                // Desconta o estoque dentro da transação.
                $product->decrement(
                    'stock',
                    $line['quantity']
                );

                // Congela nome, quantidade e preço.
                $order->items()->create([
                    'product_id' => $product->id,
                    'product_name' => $product->name,
                    'quantity' => $line['quantity'],
                    'unit_price' => $this->money(
                        $line['unit_cents']
                    ),
                    'subtotal' => $this->money(
                        $line['line_cents']
                    ),
                ]);
            }

            // O pedido foi criado: esvazia o carrinho.
            $cart->items()->delete();

            return $order->load('items');
        }, 3);
    }

    public function listForUser(User $user): LengthAwarePaginator
    {
        return $user->orders()
            ->orderByDesc('id')
            ->paginate(10);
    }

    public function show(User $user, Order $order): Order
    {
        $this->authorizeOwnerOrAdmin($user, $order);

        return $order->load('items');
    }

    public function pay(User $user, Order $order): Order
    {
        return DB::transaction(function () use ($user, $order) {
            $order = Order::query()
                ->whereKey($order->id)
                ->lockForUpdate()
                ->firstOrFail();

            // Somente o comprador confirma o pagamento.
            abort_unless(
                (int) $order->user_id === (int) $user->id,
                403,
                'Este pedido não pertence a você.'
            );

            if ($order->status !== Order::PENDING) {
                abort(409, 'Pedido não está aguardando pagamento.');
            }

            $order->update([
                'status' => Order::PAID,
                'paid_at' => now(),
            ]);

            return $order->load('items');
        }, 3);
    }

    public function cancel(User $user, Order $order): Order
    {
        return DB::transaction(function () use ($user, $order) {
            $order = Order::query()
                ->whereKey($order->id)
                ->lockForUpdate()
                ->firstOrFail();

            $this->authorizeOwnerOrAdmin($user, $order);

            if ($order->status !== Order::PENDING) {
                abort(409, 'Somente pedidos pendentes podem ser cancelados.');
            }

            // Ordenação consistente para reduzir conflitos.
            $items = $order->items()
                ->orderBy('product_id')
                ->get();

            foreach ($items as $item) {
                // Inclusive produtos excluídos logicamente.
                $product = Product::withTrashed()
                    ->whereKey($item->product_id)
                    ->lockForUpdate()
                    ->firstOrFail();

                $product->increment('stock', $item->quantity);
            }

            $order->update([
                'status' => Order::CANCELED,
                'canceled_at' => now(),
            ]);

            return $order->load('items');
        }, 3);
    }

    public function listForAdmin(
        ?string $status
    ): LengthAwarePaginator {
        return Order::query()
            ->with('user')
            ->when(
                $status,
                fn ($query) => $query->where('status', $status)
            )
            ->orderByDesc('id')
            ->paginate(10);
    }

    public function advanceStatus(
        Order $order,
        string $newStatus
    ): Order {
        return DB::transaction(function () use ($order, $newStatus) {
            $order = Order::query()
                ->whereKey($order->id)
                ->lockForUpdate()
                ->firstOrFail();

            $valid = (
                $order->status === Order::PAID &&
                $newStatus === Order::SHIPPED
            ) || (
                $order->status === Order::SHIPPED &&
                $newStatus === Order::DELIVERED
            );

            if (!$valid) {
                abort(409, 'Transição de status inválida.');
            }

            $data = ['status' => $newStatus];

            if ($newStatus === Order::SHIPPED) {
                $data['shipped_at'] = now();
            }

            if ($newStatus === Order::DELIVERED) {
                $data['delivered_at'] = now();
            }

            $order->update($data);

            return $order->load('items', 'user');
        }, 3);
    }

    private function authorizeOwnerOrAdmin(
        User $user,
        Order $order
    ): void {
        abort_unless(
            (int) $order->user_id === (int) $user->id
                || $user->isAdmin(),
            403,
            'Você não pode acessar este pedido.'
        );
    }

    private function toCents(string $price): int
    {
        [$whole, $fraction] = array_pad(
            explode('.', $price, 2),
            2,
            '0'
        );

        return ((int) $whole * 100)
            + (int) str_pad($fraction, 2, '0');
    }

    private function money(int $cents): string
    {
        return sprintf(
            '%d.%02d',
            intdiv($cents, 100),
            $cents % 100
        );
    }
}
