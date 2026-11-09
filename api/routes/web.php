<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return response()->json([
        'application' => 'Taverna do D20 API',
        'status' => 'online',
    ]);
});