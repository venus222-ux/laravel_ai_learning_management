<?php

use App\Http\Controllers\AdminCategoryController;
use App\Http\Controllers\AuthController;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AdminController;
use App\Http\Controllers\AdminCourseController;
use App\Http\Controllers\AdminLessonController;
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

   Route::get('/dashboard', [LmsController::class, 'getDashboardData']);

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
    Route::get('/suggestions', [LmsController::class, 'getRecommendations']);
    Route::post('/courses/{course}/lessons/{lesson}/complete', [LmsController::class, 'completeLesson']);
    Route::get(
       '/courses/{course}/completed-lessons',
       [LmsController::class, 'getCompletedLessons']
    );
    Route::get('/courses/{course}/progress', [LmsController::class, 'getProgress']);

    Route::get(
    '/certificates/{course}',
    [LmsController::class, 'getCertificate']
);
});



// routes/api.php

Route::prefix('admin')
    ->middleware(['auth.jwt', 'role:admin'])
    ->group(function () {
        Route::get('/dashboard', [AdminController::class, 'dashboard']);
        Route::get('/users', [AdminController::class, 'users']); // READ
        Route::delete('/users/{id}', [AdminController::class, 'deleteUser']); // DELETE
        Route::get('/metrics/global', [AdminCourseController::class, 'globalStats']);
        Route::apiResource('courses', AdminCourseController::class);
        Route::apiResource('categories', AdminCategoryController::class);

        Route::get('/courses/{course}/lessons', [AdminLessonController::class, 'index']);
        Route::post('/courses/{course}/lessons', [AdminLessonController::class, 'store']);
        Route::put('/courses/{course}/lessons/{lesson}', [AdminLessonController::class, 'update']);
        Route::delete('/courses/{course}/lessons/{lesson}', [AdminLessonController::class, 'destroy']);
});


Route::get('/admin/traffic', [AdminController::class, 'traffic']);
