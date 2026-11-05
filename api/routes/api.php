<?php

use Illuminate\Http\Request;
use App\Http\Controllers\Api\CategoryController;
use Illuminate\Support\Facades\Route;

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
