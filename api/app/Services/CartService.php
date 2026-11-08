<?php

namespace App\Services;

use App\Models\Cart;
use App\Models\CartItem;
use App\Models\Product;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cookie;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class CartService
{
    private const GUEST_COOKIE = 'taverna_guest_cart';

    public function current(Request $request): Cart
    {
        $user = Auth::guard('web')->user();

        if ($user) {
            return Cart::firstOrCreate([
                'user_id' => $user->id,
            ]);
        }

        $token = $request->cookie(self::GUEST_COOKIE);

        if (is_string($token)) {
            $cart = Cart::where(
                'guest_token_hash',
                hash('sha256', $token)
            )->first();

            if ($cart) {
                return $cart;
            }
        }

        // Cria uma identificação aleatória para o visitante.
        $token = bin2hex(random_bytes(32));

        $cart = Cart::create([
            'guest_token_hash' => hash('sha256', $token),
        ]);

        Cookie::queue(Cookie::make(
            self::GUEST_COOKIE,
            $token,
            43200, // 30 dias, em minutos
            '/',
            null,
            $request->isSecure(),
            true,
            false,
            'lax'
        ));

        return $cart;
    }

    public function summary(Cart $cart): array
    {
        $cart->load('items.product');

        $totalCents = 0;

        $items = $cart->items->map(function ($item) use (&$totalCents) {
            $product = $item->product;

            $unitPrice = $product
                ? (string) $product->price
                : '0.00';

            $unitCents = $this->toCents($unitPrice);
            $subtotalCents = $unitCents * $item->quantity;

            $totalCents += $subtotalCents;

            return [
                'id' => $item->id,
                'product_id' => $item->product_id,
                'name' => $product?->name,
                'quantity' => $item->quantity,
                'stock' => $product?->stock ?? 0,
                'unit_price' => $unitPrice,
                'subtotal' => $this->money($subtotalCents),
                'available' => $product
                    && !$product->trashed()
                    && $product->is_active
                    && $item->quantity <= $product->stock,
            ];
        });

        return [
            'items' => $items,
            'total' => $this->money($totalCents),
            'items_count' => $cart->items->sum('quantity'),
        ];
    }

    public function add(
        Request $request,
        int $productId,
        int $quantity
    ): array {
        $cart = $this->current($request);

        return DB::transaction(function () use (
            $cart,
            $productId,
            $quantity
        ) {
            $cart = Cart::whereKey($cart->id)
                ->lockForUpdate()
                ->firstOrFail();

            $product = Product::whereKey($productId)
                ->lockForUpdate()
                ->firstOrFail();

            if (!$product->is_active || $product->stock < 1) {
                throw ValidationException::withMessages([
                    'product_id' => ['Produto indisponível.'],
                ]);
            }

            $item = CartItem::where('cart_id', $cart->id)
                ->where('product_id', $productId)
                ->first();

            $newQuantity = ($item?->quantity ?? 0) + $quantity;

            if ($newQuantity > $product->stock) {
                throw ValidationException::withMessages([
                    'quantity' => ['Quantidade acima do estoque.'],
                ]);
            }

            if ($item) {
                $item->update(['quantity' => $newQuantity]);
            } else {
                CartItem::create([
                    'cart_id' => $cart->id,
                    'product_id' => $productId,
                    'quantity' => $newQuantity,
                ]);
            }

            return $this->summary($cart);
        });
    }

    public function update(
        Request $request,
        int $itemId,
        int $quantity
    ): array {
        $cart = $this->current($request);

        return DB::transaction(function () use (
            $cart,
            $itemId,
            $quantity
        ) {
            $cart = Cart::whereKey($cart->id)
                ->lockForUpdate()
                ->firstOrFail();

            // Só permite alterar itens do próprio carrinho.
            $item = CartItem::where('cart_id', $cart->id)
                ->findOrFail($itemId);

            if ($quantity === 0) {
                $item->delete();

                return $this->summary($cart);
            }

            $product = Product::whereKey($item->product_id)
                ->lockForUpdate()
                ->first();

            if (
                !$product ||
                !$product->is_active ||
                $quantity > $product->stock
            ) {
                throw ValidationException::withMessages([
                    'quantity' => ['Produto ou quantidade indisponível.'],
                ]);
            }

            $item->update(['quantity' => $quantity]);

            return $this->summary($cart);
        });
    }

    public function remove(
        Request $request,
        int $itemId
    ): array {
        $cart = $this->current($request);

        return DB::transaction(function () use ($cart, $itemId) {
            $cart = Cart::whereKey($cart->id)
                ->lockForUpdate()
                ->firstOrFail();

            $item = CartItem::where('cart_id', $cart->id)
                ->findOrFail($itemId);

            $item->delete();

            return $this->summary($cart);
        });
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
        return intdiv($cents, 100)
            . '.'
            . str_pad((string) ($cents % 100), 2, '0', STR_PAD_LEFT);
    }
}
