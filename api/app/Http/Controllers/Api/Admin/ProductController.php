<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreProductRequest;
use App\Http\Requests\UpdateProductRequest;
use App\Http\Resources\ProductResource;
use App\Models\Product;
use App\Services\ProductManagementService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Response;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class ProductController extends Controller
{
    public function __construct(
        private ProductManagementService $productService
    ) {
    }

    public function index(): AnonymousResourceCollection
    {
        $products = $this->productService->listAll();

        return ProductResource::collection($products);
    }

    public function show(Product $product): ProductResource
    {
        return new ProductResource(
            $product->load('category')
        );
    }

    public function store(
        StoreProductRequest $request
    ): JsonResponse {
        $product = $this->productService->create(
            $request->validated()
        );

        return (new ProductResource($product))
            ->response()
            ->setStatusCode(201);
    }

    public function update(
        UpdateProductRequest $request,
        Product $product
    ): ProductResource {
        $product = $this->productService->update(
            $product,
            $request->validated()
        );

        return new ProductResource($product);
    }

    public function destroy(Product $product): Response
    {
        $this->productService->delete($product);

        return response()->noContent();
    }
}
