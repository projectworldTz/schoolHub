<?php

use Illuminate\Support\Facades\Route;

// This backend is API-only (Sanctum SPA auth via routes/api.php); the
// React frontend lives in ../frontend, served separately by Vite.
Route::get('/', fn () => response()->json([
    'name' => config('app.name'),
    'status' => 'ok',
]));

