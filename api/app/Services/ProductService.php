<?php

namespace App\Services;

use App\Models\Product;
use Illuminate\Pagination\LengthAwarePaginator;

class ProductService
{
    public function listAll(array $filters): LengthAwarePaginator
    {
        $query = Product::query()
            ->with('category')
            ->where('is_active', true);

        // Pesquisa pelo nome.
        if (!empty($filters['search'])) {
            $query->where(
                'name',
                'like',
                '%' . $filters['search'] . '%'
            );
        }

        // Filtro por categoria.
        if (!empty($filters['category'])) {
            $query->whereHas('category', function ($categoryQuery) use ($filters) {
                $categoryQuery->where('slug', $filters['category']);
            });
        }

        // Ordenação.
        $sort = $filters['sort'] ?? 'recent';

        switch ($sort) {
            case 'price_asc':
                $query->orderBy('price', 'asc')
                    ->orderBy('id');
                break;

            case 'price_desc':
                $query->orderBy('price', 'desc')
                    ->orderBy('id');
                break;

            default:
                $query->orderByDesc('created_at')
                    ->orderByDesc('id');
                break;
        }

        return $query->paginate(12)->withQueryString();
    }
}
