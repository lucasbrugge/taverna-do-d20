<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use RuntimeException;

class UserSeeder extends Seeder
{
    public const ADMIN_EMAIL = 'demo.admin@taverna.test';
    public const CUSTOMER_EMAILS = [
        'demo.cliente1@taverna.test',
        'demo.cliente2@taverna.test',
        'demo.cliente3@taverna.test',
    ];

    public function run(): void
    {
        if (!app()->environment('local', 'testing')) {
            throw new RuntimeException('Seeders de demonstração são permitidos somente em local/testing.');
        }

        // Senha somente de demonstração. Pode ser substituída no .env local.
        $password = env('DEMO_SEED_PASSWORD', 'TavernaDemo@2026!');

        $accounts = [
            [self::ADMIN_EMAIL, '[DEMO] Administrador', 'admin'],
            [self::CUSTOMER_EMAILS[0], '[DEMO] Cliente 1', 'client'],
            [self::CUSTOMER_EMAILS[1], '[DEMO] Cliente 2', 'client'],
            [self::CUSTOMER_EMAILS[2], '[DEMO] Cliente 3', 'client'],
        ];

        foreach ($accounts as [$email, $name, $role]) {
            $user = User::query()->firstOrNew(['email' => $email]);

            // Evita sobrescrever uma conta real que por acaso utilize o mesmo e-mail.
            if ($user->exists && $user->name !== $name) {
                throw new RuntimeException("Colisão com conta existente: {$email}. Não foi alterada.");
            }

            // role não é fillable na API pública (corretamente!).
            // forceFill é usado apenas neste seeder, em ambiente de desenvolvimento.
            $user->forceFill([
                'name' => $name,
                'email' => $email,
                'role' => $role,
                'password' => Hash::make($password),
            ])->save();

            if ($role === 'client') {
                $user->addresses()->firstOrCreate(
                    ['recipient_name' => $name, 'postal_code' => '85010000'],
                    [
                        'street' => 'Rua das Aventuras',
                        'number' => '123',
                        'complement' => 'Endereco demonstrativo',
                        'district' => 'Centro',
                        'city' => 'Guarapuava',
                        'state' => 'PR',
                    ]
                );
            }
        }

        $this->command?->info('4 contas de demonstração e 3 endereços preparados.');
    }
}
