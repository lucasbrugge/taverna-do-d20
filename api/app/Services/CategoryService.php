<?php

namespace App\Services;

use App\Models\Category;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;

class CategoryService
{
    public function listAll(): Collection
    {
        return Category::query()
            ->orderBy('name')
            ->get();
    }

    public function create(array $data): Category
    {
        return Category::create($data);
    }

    public function update(
        Category $category,
        array $data
    ): Category {
        $category->update($data);

        return $category->refresh();
    }

    public function delete(Category $category): void
    {
        $hasProducts = DB::table('products')
            ->where('category_id', $category->id)
            ->exists();

        if ($hasProducts) {
            abort(
                409,
                'Não é possível excluir uma categoria com produtos vinculados.'
            );
        }

        $category->delete();
    }
}
