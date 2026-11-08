<?php

namespace Database\Seeders;

use App\Models\Cart;
use App\Models\CartItem;
use App\Models\Product;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\File;
use RuntimeException;

class CartSeeder extends Seeder
{
    public function run(): void
    {
        if (!app()->environment('local', 'testing')) {
            throw new RuntimeException('Seeder de carrinhos de demonstração somente em local/testing.');
        }

        $products = Product::query()
            ->where('is_active', true)
            ->where('stock', '>=', 3)
            ->orderBy('id')
            ->limit(4)
            ->get();

        if ($products->count() < 4) {
            throw new RuntimeException('Precisamos de 4 produtos ativos com estoque >= 3 para os carrinhos demo.');
        }

        foreach (UserSeeder::CUSTOMER_EMAILS as $index => $email) {
            $user = User::where('email', $email)->firstOrFail();
            $cart = Cart::firstOrCreate(['user_id' => $user->id]);

            // Não apaga nem reduz itens que o usuário já tenha no carrinho.
            $product = $products[$index];
            CartItem::firstOrCreate(
                ['cart_id' => $cart->id, 'product_id' => $product->id],
                ['quantity' => 2]
            );
        }

        // O identificador secreto do visitante é salvo apenas no storage privado.
        // No banco armazenamos somente SHA-256(token).
        $tokenPath = storage_path('app/private/taverna_demo_guest_token.txt');
        File::ensureDirectoryExists(dirname($tokenPath));

        $token = is_file($tokenPath)
            ? trim((string) file_get_contents($tokenPath))
            : '';

        if (!preg_match('/\A[a-f0-9]{64}\z/D', $token)) {
            $token = bin2hex(random_bytes(32));
            if (file_put_contents($tokenPath, $token . PHP_EOL, LOCK_EX) === false) {
                throw new RuntimeException('Falha ao salvar token privado do carrinho visitante demo.');
            }
            @chmod($tokenPath, 0600);
        }

        $guestCart = Cart::firstOrCreate(
            ['guest_token_hash' => hash('sha256', $token)],
            ['user_id' => null]
        );

        foreach ([$products[0], $products[3]] as $product) {
            CartItem::firstOrCreate(
                ['cart_id' => $guestCart->id, 'product_id' => $product->id],
                ['quantity' => 1]
            );
        }

        $this->command?->info('3 carrinhos de clientes e 1 carrinho visitante preparados.');
        $this->command?->info('Token demo do visitante guardado somente em storage/app/private/.');
    }
}
