<?php

namespace Database\Seeders;

use App\Models\Order;
use App\Models\Product;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use RuntimeException;

/**
 * Pedidos demonstrativos sem limpar dados reais nem tocar nos carrinhos existentes.
 * Cada pedido tem uma referência estável dentro do snapshot de endereço.
 */
class OrderSeeder extends Seeder
{
    public function run(): void
    {
        if (!app()->environment('local', 'testing')) {
            throw new RuntimeException('Seeder de pedidos de demonstração somente em local/testing.');
        }

        $examples = [
            ['demo-pending-v1', UserSeeder::CUSTOMER_EMAILS[0], Order::PENDING],
            ['demo-paid-v1', UserSeeder::CUSTOMER_EMAILS[1], Order::PAID],
            ['demo-shipped-v1', UserSeeder::CUSTOMER_EMAILS[2], Order::SHIPPED],
            ['demo-delivered-v1', UserSeeder::CUSTOMER_EMAILS[0], Order::DELIVERED],
            ['demo-canceled-v1', UserSeeder::CUSTOMER_EMAILS[1], Order::CANCELED],
        ];

        $created = 0;
        $skipped = 0;

        foreach ($examples as $index => [$reference, $email, $status]) {
            $didCreate = DB::transaction(function () use ($reference, $email, $status, $index): bool {
                // A linha de usuário serializa execuções simultâneas deste seeder.
                $user = User::query()
                    ->where('email', $email)
                    ->lockForUpdate()
                    ->firstOrFail();

                $exists = Order::query()
                    ->where('user_id', $user->id)
                    ->where('shipping_address->demo_reference', $reference)
                    ->exists();

                if ($exists) {
                    return false;
                }

                $address = $user->addresses()->orderBy('id')->firstOrFail();

                // Produtos distintos para cada exemplo quando houver estoque.
                $available = Product::query()
                    ->where('is_active', true)
                    ->where('stock', '>=', 2)
                    ->orderBy('id')
                    ->lockForUpdate()
                    ->get();

                if ($available->count() < 2) {
                    throw new RuntimeException('Precisamos de ao menos 2 produtos ativos com estoque >= 2 para criar pedidos de demonstração.');
                }

                $first = $available[$index * 2 % $available->count()];
                $second = $available[($index * 2 + 1) % $available->count()];
                $products = [$first, $second];

                $subtotalCents = 0;
                $lines = [];

                foreach ($products as $product) {
                    $cents = $this->toCents((string) $product->price);
                    if ($cents < 1) {
                        throw new RuntimeException("Preço inválido no produto {$product->id}.");
                    }
                    $subtotalCents += $cents;
                    $lines[] = ['product' => $product, 'unit_cents' => $cents];
                }

                $snapshot = $address->only([
                    'recipient_name',
                    'postal_code',
                    'street',
                    'number',
                    'complement',
                    'district',
                    'city',
                    'state',
                ]);
                $snapshot['demo_reference'] = $reference;

                // Valores monetários calculados em centavos, sem float.
                $order = Order::create([
                    'user_id' => $user->id,
                    'address_id' => $address->id,
                    'shipping_address' => $snapshot,
                    'status' => Order::PENDING,
                    'subtotal' => $this->money($subtotalCents),
                    'shipping' => '0.00',
                    'total' => $this->money($subtotalCents),
                ]);

                foreach ($lines as $line) {
                    $product = $line['product'];
                    $product->decrement('stock', 1);

                    $order->items()->create([
                        'product_id' => $product->id,
                        'product_name' => $product->name,
                        'quantity' => 1,
                        'unit_price' => $this->money($line['unit_cents']),
                        'subtotal' => $this->money($line['unit_cents']),
                    ]);
                }

                // Demonstra os estados finais com horários coerentes.
                $changes = match ($status) {
                    Order::PENDING => [],
                    Order::PAID => [
                        'status' => Order::PAID,
                        'paid_at' => now()->subDays(2),
                    ],
                    Order::SHIPPED => [
                        'status' => Order::SHIPPED,
                        'paid_at' => now()->subDays(4),
                        'shipped_at' => now()->subDays(3),
                    ],
                    Order::DELIVERED => [
                        'status' => Order::DELIVERED,
                        'paid_at' => now()->subDays(7),
                        'shipped_at' => now()->subDays(5),
                        'delivered_at' => now()->subDays(1),
                    ],
                    Order::CANCELED => [
                        'status' => Order::CANCELED,
                        'canceled_at' => now()->subDay(),
                    ],
                    default => throw new RuntimeException('Status de demonstração inválido.'),
                };

                if ($status === Order::CANCELED) {
                    // Simula o cancelamento: devolve exatamente o estoque debitado acima.
                    foreach ($lines as $line) {
                        $line['product']->increment('stock', 1);
                    }
                }

                if ($changes) {
                    $order->update($changes);
                }

                return true;
            }, 3);

            $didCreate ? $created++ : $skipped++;
        }

        $this->command?->info("Pedidos demo criados: {$created}; já existentes: {$skipped}.");
    }

    private function toCents(string $price): int
    {
        [$whole, $fraction] = array_pad(explode('.', $price, 2), 2, '0');
        return ((int) $whole * 100) + (int) str_pad($fraction, 2, '0');
    }

    private function money(int $cents): string
    {
        return sprintf('%d.%02d', intdiv($cents, 100), $cents % 100);
    }
}
