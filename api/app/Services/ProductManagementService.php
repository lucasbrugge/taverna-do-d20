<?php

namespace App\Services;

use App\Models\Product;
use Illuminate\Http\UploadedFile;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use RuntimeException;
use Throwable;

class ProductManagementService
{
    public function listAll(): LengthAwarePaginator
    {
        return Product::query()
            ->with('category')
            ->orderByDesc('id')
            ->paginate(12);
    }

    public function create(array $data): Product
    {
        $image = $data['image'] ?? null;
        unset($data['image']);

        $newPath = null;

        if ($image instanceof UploadedFile) {
            $newPath = $this->storeImage($image);
            $data['image_path'] = $newPath;
        }

        try {
            $product = DB::transaction(
                fn () => Product::create($data)
            );
        } catch (Throwable $exception) {
            if ($newPath !== null) {
                Storage::disk('public')->delete($newPath);
            }

            throw $exception;
        }

        return $product->load('category');
    }

    public function update(
        Product $product,
        array $data
    ): Product {
        $image = $data['image'] ?? null;
        unset($data['image']);

        $oldPath = $product->image_path;
        $newPath = null;

        if ($image instanceof UploadedFile) {
            $newPath = $this->storeImage($image);
            $data['image_path'] = $newPath;
        }

        try {
            DB::transaction(function () use ($product, $data) {
                $product->update($data);
            });
        } catch (Throwable $exception) {
            if ($newPath !== null) {
                Storage::disk('public')->delete($newPath);
            }

            throw $exception;
        }

        if ($newPath !== null && $oldPath !== null) {
            Storage::disk('public')->delete($oldPath);
        }

        return $product->refresh()->load('category');
    }

    public function delete(Product $product): void
    {
        DB::transaction(function () use ($product) {
            $product->delete();
        });
    }

    private function storeImage(UploadedFile $image): string
    {
        $path = $image->store('products', 'public');

        if ($path === false) {
            throw new RuntimeException(
                'Não foi possível armazenar a imagem.'
            );
        }

        return $path;
    }
}
