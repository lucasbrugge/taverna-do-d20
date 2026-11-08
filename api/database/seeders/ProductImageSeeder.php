<?php

namespace Database\Seeders;

use App\Models\Product;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use RuntimeException;

/**
 * Ilustrações distintas para os trinta produtos do catálogo.
 * Substitui somente imagens antigas geradas pelo seeder anterior.
 * Preserva qualquer imagem cadastrada pelo administrador.
 */
class ProductImageSeeder extends Seeder
{
    private const ASSETS = [
            'conjunto-de-dados-classicos' => 'conjunto-de-dados-classicos.svg',
            'dado-d20-metalico' => 'dado-d20-metalico.svg',
            'conjunto-de-dados-elficos' => 'conjunto-de-dados-elficos.svg',
            'conjunto-de-dados-do-dragao' => 'conjunto-de-dados-do-dragao.svg',
            'bolsa-de-dados-de-couro' => 'bolsa-de-dados-de-couro.svg',
            'torre-de-dados-medieval' => 'torre-de-dados-medieval.svg',
            'bandeja-de-rolagem' => 'bandeja-de-rolagem.svg',
            'escudo-do-mestre' => 'escudo-do-mestre.svg',
            'marcadores-de-condicao' => 'marcadores-de-condicao.svg',
            'dados-runicos-especiais' => 'dados-runicos-especiais.svg',
            'manual-do-aventureiro' => 'manual-do-aventureiro.svg',
            'guia-do-mestre' => 'guia-do-mestre.svg',
            'bestiario-fantastico' => 'bestiario-fantastico.svg',
            'aventura-minas-perdidas' => 'aventura-minas-perdidas.svg',
            'aventura-castelo-sombrio' => 'aventura-castelo-sombrio.svg',
            'atlas-dos-reinos' => 'atlas-dos-reinos.svg',
            'livro-de-magias-arcanas' => 'livro-de-magias-arcanas.svg',
            'manual-de-criacao-de-personagens' => 'manual-de-criacao-de-personagens.svg',
            'diario-de-campanha' => 'diario-de-campanha.svg',
            'cronicas-do-reino-esquecido' => 'cronicas-do-reino-esquecido.svg',
            'miniatura-de-dragao' => 'miniatura-de-dragao.svg',
            'miniatura-de-guerreiro' => 'miniatura-de-guerreiro.svg',
            'miniatura-de-mago' => 'miniatura-de-mago.svg',
            'miniatura-de-arqueiro-elfico' => 'miniatura-de-arqueiro-elfico.svg',
            'miniatura-de-orc' => 'miniatura-de-orc.svg',
            'miniatura-de-goblin' => 'miniatura-de-goblin.svg',
            'conjunto-de-paredes-de-masmorra' => 'conjunto-de-paredes-de-masmorra.svg',
            'mapa-de-batalha-quadriculado' => 'mapa-de-batalha-quadriculado.svg',
            'cenario-de-taverna-medieval' => 'cenario-de-taverna-medieval.svg',
            'miniatura-de-esqueleto' => 'miniatura-de-esqueleto.svg'
    ];

    public function run(): void
    {
        $disk = Storage::disk('public');
        $applied = 0;
        $preserved = 0;
        $unmapped = 0;

        Product::query()->orderBy('id')->chunkById(100, function ($products) use ($disk, &$applied, &$preserved, &$unmapped): void {
            foreach ($products as $product) {
                $current = $product->image_path;

                // Somente substitui as antigas imagens da pasta seed/ ou catalog/v2/.
                // Uploads manuais em products/ ficam intactos.
                $generated = !$current
                    || str_starts_with($current, 'products/seed/')
                    || str_starts_with($current, 'products/catalog/v2/');

                if (!$generated && $disk->exists($current)) {
                    $preserved++;
                    continue;
                }

                $slug = Str::slug($product->name);
                $filename = self::ASSETS[$slug] ?? null;

                if ($filename === null) {
                    $unmapped++;
                    $this->command?->warn('Sem arte específica: ' . $product->name);
                    continue;
                }

                $source = __DIR__ . '/product-illustrations/' . $filename;
                $destination = 'products/catalog/v2/' . $filename;

                if (!is_file($source)) {
                    throw new RuntimeException('Arquivo de imagem ausente: ' . $source);
                }

                $contents = file_get_contents($source);
                if ($contents === false || !$disk->put($destination, $contents)) {
                    throw new RuntimeException('Falha ao salvar imagem: ' . $destination);
                }

                // Mudança apenas na imagem, sem alterar nome, preço ou estoque.
                $product->image_path = $destination;
                $product->save();
                $applied++;
            }
        });

        $this->command?->info("Imagens aplicadas: {$applied}; preservadas: {$preserved}; sem mapeamento: {$unmapped}.");
    }
}
