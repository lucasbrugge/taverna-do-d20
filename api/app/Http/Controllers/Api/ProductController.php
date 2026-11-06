<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\ProductResource;
use App\Services\ProductService;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use App\Http\Requests\ListProductsRequest;

class ProductController extends Controller
{
    public function __construct(
        private ProductService $productService
    ) {
    }

    public function index(
        ListProductsRequest $request
    ): AnonymousResourceCollection {
        $filters = $request->validated();

        $products = $this->productService->listAll($filters);

        return ProductResource::collection($products);
    }

    public function show(int $id): ProductResource
    {
        $product = $this->productService
            ->findActiveById($id);

        return new ProductResource($product);
    }
}
