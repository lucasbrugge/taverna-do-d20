<?php

namespace App\Services;

use App\Models\Product;
use Illuminate\Pagination\LengthAwarePaginator;

class ProductService
{
    public function listAll(): LengthAwarePaginator
    {
        return Product::query()
            ->with('category')
            ->where('is_active', true)
            ->orderByDesc('id')
            ->paginate(12);
    }
}
