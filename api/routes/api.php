<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\CategoryController;
use App\Http\Controllers\Api\ProductController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\Admin\CategoryController as AdminCategoryController;
use App\Http\Controllers\Api\Admin\ProductController as AdminProductController;
use App\Http\Controllers\Api\CartController;
use App\Http\Controllers\Api\AddressController;
use App\Http\Controllers\Api\OrderController;
use App\Http\Controllers\Api\Admin\OrderController as AdminOrderController;

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

        Route::patch('/me', [
            AuthController::class,
            'updateProfile'
        ]);

        Route::post('/logout', [
            AuthController::class,
            'logout'
        ]);
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

        Route::apiResource(
            'products',
            AdminProductController::class
        );

        Route::get('/orders', [
            AdminOrderController::class,
            'index'
        ]);

        Route::patch('/orders/{order}/status', [
            AdminOrderController::class,
            'updateStatus'
        ])->whereNumber('order');
    });

Route::get('/cart', [CartController::class, 'index']);

Route::post('/cart/items', [
    CartController::class,
    'store'
]);

Route::patch('/cart/items/{item}', [
    CartController::class,
    'update'
])->whereNumber('item');

Route::delete('/cart/items/{item}', [
    CartController::class,
    'destroy'
])->whereNumber('item');

Route::middleware('auth:sanctum')->group(function () {

    Route::get('/addresses', [
        AddressController::class,
        'index'
    ]);

    Route::post('/addresses', [
        AddressController::class,
        'store'
    ]);

    Route::put('/addresses/{address}', [
        AddressController::class,
        'update'
    ])->whereNumber('address');

    Route::delete('/addresses/{address}', [
        AddressController::class,
        'destroy'
    ])->whereNumber('address');

    Route::get('/orders', [
        OrderController::class,
        'index'
    ]);

    Route::post('/orders', [
        OrderController::class,
        'store'
    ]);

    Route::get('/orders/{order}', [
        OrderController::class,
        'show'
    ])->whereNumber('order');

    Route::post('/orders/{order}/pay', [
        OrderController::class,
        'pay'
    ])->whereNumber('order');

    Route::post('/orders/{order}/cancel', [
        OrderController::class,
        'cancel'
    ])->whereNumber('order');
});
