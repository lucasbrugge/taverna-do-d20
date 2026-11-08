<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\CategoryController;
use App\Http\Controllers\Api\ProductController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\Admin\CategoryController as AdminCategoryController;

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

Route::get('/status', function () {
    return response()->json([
        'application' => 'Taverna do D20',
        'status' => 'ok'
    ]);
});

Route::get('/categories', [
    CategoryController::class,
    'index'
]);

Route::get('/products', [
    ProductController::class,
    'index'
]);

Route::get('/products', [
    ProductController::class,
    'index'
]);

Route::get('/products/{id}', [
    ProductController::class,
    'show'
])->whereNumber('id');

Route::prefix('auth')->group(function () {
    Route::post('/register', [AuthController::class, 'register'])
        ->middleware('throttle:5,1');

    Route::post('/login', [AuthController::class, 'login'])
        ->middleware('throttle:5,1');

    Route::middleware('auth:sanctum')->group(function () {
        Route::get('/me', [AuthController::class, 'me']);
        Route::post('/logout', [AuthController::class, 'logout']);
    });
});

Route::prefix('admin')
    ->middleware(['auth:sanctum', 'admin'])
    ->group(function () {

        Route::post('/categories', [
            AdminCategoryController::class,
            'store'
        ]);

        Route::put('/categories/{category}', [
            AdminCategoryController::class,
            'update'
        ])->whereNumber('category');

        Route::patch('/categories/{category}', [
            AdminCategoryController::class,
            'update'
        ])->whereNumber('category');

        Route::delete('/categories/{category}', [
            AdminCategoryController::class,
            'destroy'
        ])->whereNumber('category');
    });
