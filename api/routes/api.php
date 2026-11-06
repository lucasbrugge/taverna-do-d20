<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\CategoryController;
use App\Http\Controllers\Api\ProductController;

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
