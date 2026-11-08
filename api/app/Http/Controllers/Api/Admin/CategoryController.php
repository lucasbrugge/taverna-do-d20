<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreCategoryRequest;
use App\Http\Requests\UpdateCategoryRequest;
use App\Http\Resources\CategoryResource;
use App\Models\Category;
use App\Services\CategoryService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Response;

class CategoryController extends Controller
{
    public function __construct(
        private CategoryService $categoryService
    ) {
    }

    public function store(
        StoreCategoryRequest $request
    ): JsonResponse {
        $category = $this->categoryService->create(
            $request->validated()
        );

        return (new CategoryResource($category))
            ->response()
            ->setStatusCode(201);
    }

    public function update(
        UpdateCategoryRequest $request,
        Category $category
    ): CategoryResource {
        $category = $this->categoryService->update(
            $category,
            $request->validated()
        );

        return new CategoryResource($category);
    }

    public function destroy(Category $category): Response
    {
        $this->categoryService->delete($category);

        return response()->noContent();
    }
}
