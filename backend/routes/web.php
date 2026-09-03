<?php

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Route;

// This backend is API-only (Sanctum SPA auth via routes/api.php); the
// React frontend lives in ../frontend, served separately by Vite.
Route::get('/', fn () => response()->json([
    'name' => config('app.name'),
    'status' => 'ok',
]));

Route::get('/health', function () {
    try {
        DB::select('select 1');
    } catch (Throwable) {
        return response()->json(['status' => 'unhealthy'], 503);
    }

    return response()->json([
        'status' => 'healthy',
        'time' => now()->toIso8601String(),
    ]);
})->middleware('throttle:60,1');
