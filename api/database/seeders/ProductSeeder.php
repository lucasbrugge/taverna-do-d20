<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Category;
use App\Models\Product;

class ProductSeeder extends Seeder
{
    public function run(): void
    {
        $catalog = [
            'dados-acessorios' => [
                [
                    'name' => 'Conjunto de Dados Clássicos',
                    'description' => 'Conjunto com 7 dados para RPG de mesa.',
                    'price' => '39.90',
                    'stock' => 20,
                    'is_active' => true,
                ],
                [
                    'name' => 'Dado D20 Metálico',
                    'description' => 'Dado de vinte faces feito em metal.',
                    'price' => '49.90',
                    'stock' => 15,
                    'is_active' => true,
                ],
                [
                    'name' => 'Conjunto de Dados Élficos',
                    'description' => 'Set de 7 dados com acabamento élfico.',
                    'price' => '54.90',
                    'stock' => 12,
                    'is_active' => true,
                ],
                [
                    'name' => 'Conjunto de Dados do Dragão',
                    'description' => 'Set de dados com temática de dragões.',
                    'price' => '59.90',
                    'stock' => 10,
                    'is_active' => true,
                ],
                [
                    'name' => 'Bolsa de Dados de Couro',
                    'description' => 'Bolsa para guardar dados de RPG.',
                    'price' => '29.90',
                    'stock' => 25,
                    'is_active' => true,
                ],
                [
                    'name' => 'Torre de Dados Medieval',
                    'description' => 'Torre para rolagem de dados.',
                    'price' => '119.90',
                    'stock' => 5,
                    'is_active' => true,
                ],
                [
                    'name' => 'Bandeja de Rolagem',
                    'description' => 'Bandeja revestida para rolar dados.',
                    'price' => '64.90',
                    'stock' => 8,
                    'is_active' => true,
                ],
                [
                    'name' => 'Escudo do Mestre',
                    'description' => 'Escudo para ocultar anotações do mestre.',
                    'price' => '79.90',
                    'stock' => 7,
                    'is_active' => true,
                ],
                [
                    'name' => 'Marcadores de Condição',
                    'description' => 'Marcadores para efeitos e condições.',
                    'price' => '24.90',
                    'stock' => 30,
                    'is_active' => true,
                ],
                [
                    'name' => 'Dados Rúnicos Especiais',
                    'description' => 'Conjunto de dados com símbolos rúnicos.',
                    'price' => '89.90',
                    'stock' => 0,
                    'is_active' => true,
                ],
            ],

            'livros-aventuras' => [
                [
                    'name' => 'Manual do Aventureiro',
                    'description' => 'Livro básico para jogadores de RPG.',
                    'price' => '89.90',
                    'stock' => 10,
                    'is_active' => true,
                ],
                [
                    'name' => 'Guia do Mestre',
                    'description' => 'Manual para criação de campanhas.',
                    'price' => '109.90',
                    'stock' => 8,
                    'is_active' => true,
                ],
                [
                    'name' => 'Bestiário Fantástico',
                    'description' => 'Livro com monstros e criaturas.',
                    'price' => '119.90',
                    'stock' => 12,
                    'is_active' => true,
                ],
                [
                    'name' => 'Aventura: Minas Perdidas',
                    'description' => 'Campanha em minas abandonadas.',
                    'price' => '69.90',
                    'stock' => 14,
                    'is_active' => true,
                ],
                [
                    'name' => 'Aventura: Castelo Sombrio',
                    'description' => 'Aventura em um castelo amaldiçoado.',
                    'price' => '74.90',
                    'stock' => 9,
                    'is_active' => true,
                ],
                [
                    'name' => 'Atlas dos Reinos',
                    'description' => 'Livro com mapas de reinos fantásticos.',
                    'price' => '99.90',
                    'stock' => 6,
                    'is_active' => true,
                ],
                [
                    'name' => 'Livro de Magias Arcanas',
                    'description' => 'Suplemento com magias e rituais.',
                    'price' => '84.90',
                    'stock' => 11,
                    'is_active' => true,
                ],
                [
                    'name' => 'Manual de Criação de Personagens',
                    'description' => 'Guia de personagens para RPG.',
                    'price' => '59.90',
                    'stock' => 18,
                    'is_active' => true,
                ],
                [
                    'name' => 'Diário de Campanha',
                    'description' => 'Caderno para registrar aventuras.',
                    'price' => '34.90',
                    'stock' => 22,
                    'is_active' => true,
                ],
                [
                    'name' => 'Crônicas do Reino Esquecido',
                    'description' => 'Campanha especial de fantasia.',
                    'price' => '129.90',
                    'stock' => 4,
                    'is_active' => false,
                ],
            ],

            'miniaturas-cenarios' => [
                [
                    'name' => 'Miniatura de Dragão',
                    'description' => 'Miniatura de dragão para RPG.',
                    'price' => '59.90',
                    'stock' => 10,
                    'is_active' => true,
                ],
                [
                    'name' => 'Miniatura de Guerreiro',
                    'description' => 'Miniatura de guerreiro com espada.',
                    'price' => '29.90',
                    'stock' => 20,
                    'is_active' => true,
                ],
                [
                    'name' => 'Miniatura de Mago',
                    'description' => 'Miniatura de mago com cajado.',
                    'price' => '29.90',
                    'stock' => 15,
                    'is_active' => true,
                ],
                [
                    'name' => 'Miniatura de Arqueiro Élfico',
                    'description' => 'Miniatura de arqueiro élfico.',
                    'price' => '34.90',
                    'stock' => 13,
                    'is_active' => true,
                ],
                [
                    'name' => 'Miniatura de Orc',
                    'description' => 'Miniatura de orc para combate.',
                    'price' => '24.90',
                    'stock' => 18,
                    'is_active' => true,
                ],
                [
                    'name' => 'Miniatura de Goblin',
                    'description' => 'Miniatura de goblin para encontros.',
                    'price' => '19.90',
                    'stock' => 25,
                    'is_active' => true,
                ],
                [
                    'name' => 'Conjunto de Paredes de Masmorra',
                    'description' => 'Paredes modulares para cenários.',
                    'price' => '149.90',
                    'stock' => 6,
                    'is_active' => true,
                ],
                [
                    'name' => 'Mapa de Batalha Quadriculado',
                    'description' => 'Mapa reutilizável para combates.',
                    'price' => '79.90',
                    'stock' => 12,
                    'is_active' => true,
                ],
                [
                    'name' => 'Cenário de Taverna Medieval',
                    'description' => 'Cenário para encontros na taverna.',
                    'price' => '199.90',
                    'stock' => 3,
                    'is_active' => true,
                ],
                [
                    'name' => 'Miniatura de Esqueleto',
                    'description' => 'Miniatura de esqueleto guerreiro.',
                    'price' => '22.90',
                    'stock' => 20,
                    'is_active' => true,
                ],
            ],
        ];

        foreach ($catalog as $slug => $products) {
            $category = Category::where('slug', $slug)
                ->firstOrFail();

            foreach ($products as $product) {
                Product::updateOrCreate(
                    [
                        'category_id' => $category->id,
                        'name' => $product['name'],
                    ],
                    [
                        'description' => $product['description'],
                        'price' => $product['price'],
                        'stock' => $product['stock'],
                        'is_active' => $product['is_active'],
                    ]
                );
            }
        }
    }
}
