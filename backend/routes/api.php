<?php

use App\Http\Controllers\AuthController;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AdminController;
use App\Http\Controllers\LmsController;

// Public routes
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);
Route::post('/forgot-password', [AuthController::class, 'forgotPassword']);
Route::post('/reset-password', [AuthController::class, 'resetPassword'])
    ->name('password.reset');
Route::post('/refresh', [AuthController::class, 'refresh']);

// Protected routes with auth + throttle
Route::middleware(['jwt.auth'])->group(function () {
    Route::get('/me', [AuthController::class, 'me']);

    Route::get('/dashboard', function () {
        return response()->json(['message' => 'User Dashboard']);
    });

    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/profile', [AuthController::class, 'profile']);
    Route::put('/profile', [AuthController::class, 'updateProfile']);
    Route::delete('/profile', [AuthController::class, 'destroyProfile']);

    // LMS Core Routes
    Route::get('/courses', [LmsController::class, 'getCourses']);
    Route::get('/courses/{course}', [LmsController::class, 'getCourse']);
    Route::post('/courses/{course}/enroll', [LmsController::class, 'enroll']);

    // Lesson & AI Routes
    Route::get('/courses/{course}/lessons/{lesson}', [LmsController::class, 'getLesson']);
    Route::post('/courses/{course}/lessons/{lesson}/ai', [LmsController::class, 'triggerAi']);
});



// routes/api.php

Route::prefix('admin')
    ->middleware(['auth.jwt', 'role:admin'])
    ->group(function () {
        Route::get('/dashboard', [AdminController::class, 'dashboard']);
        Route::get('/users', [AdminController::class, 'users']); // READ
        Route::delete('/users/{id}', [AdminController::class, 'deleteUser']); // DELETE
});


Route::get('/admin/traffic', [AdminController::class, 'traffic']);
