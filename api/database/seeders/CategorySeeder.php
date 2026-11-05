<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Category;

class CategorySeeder extends Seeder
{
    public function run(): void
    {
        $categories = [
            ['name' => 'Dados e acessórios',    'slug' => 'dados-acessorios'],
            ['name' => 'Livros e aventuras',    'slug' => 'livros-aventuras'],
            ['name' => 'Miniaturas e cenários', 'slug' => 'miniaturas-cenarios']
        ];

        foreach ($categories as $category) {

            Category::firstOrCreate(['slug' => $category['slug']], $category);
        }
    }
}
