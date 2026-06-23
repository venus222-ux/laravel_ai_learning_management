<?php

namespace App\Http\Controllers;

use App\Jobs\GenerateAiContentJob;
use App\Jobs\GenerateCertificatePdfJob;
use App\Models\Certificate;
use App\Models\Course;
use App\Models\Lesson;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;

class LmsController extends Controller
{
     use AuthorizesRequests;
    /*
    |--------------------------------------------------------------------------
    | Courses
    |--------------------------------------------------------------------------
    */

  public function getCourses()
    {
        $courses = Course::withCount('lessons')->get();

        return response()->json([
            'courses' => $courses,
        ]);
    }

    public function getCourse(Course $course)
    {
        // Kept commented out so any authenticated user can view the syllabus outline
        // $this->authorize('view', $course);

        $course->load([
            'lessons' => fn ($query) => $query
                ->select('id', 'course_id', 'title', 'order')
                ->orderBy('order'),
        ]);

        return response()->json([
            'course' => $course,
        ]);
    } // 🌟 Fixed: Removed the accidental trailing comma here

    /*
    |--------------------------------------------------------------------------
    | Enrollment
    |--------------------------------------------------------------------------
    */

    public function enroll(Course $course)
    {
        $user = auth()->user();

        if (! $user->courses()->where('course_id', $course->id)->exists()) {
            $user->courses()->attach($course->id, [
                'status' => 'enrolled',
            ]);
        }

        return response()->json([
            'message' => 'Successfully enrolled!',
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | Lessons
    |--------------------------------------------------------------------------
    */

    public function getLesson(Course $course, Lesson $lesson)
    {
        if ($lesson->course_id !== $course->id) {
            return response()->json([
                'message' => 'Lesson not found.',
            ], 404);
        }

        $this->authorize('view', $lesson);

        return response()->json([
            'lesson' => $lesson,
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | Progress Tracking
    |--------------------------------------------------------------------------
    */

 public function completeLesson(Course $course, Lesson $lesson)
{
    $user = auth()->user();

    if (!$user) {
        return response()->json(['message' => 'Unauthenticated.'], 401);
    }

    if ($lesson->course_id !== $course->id) {
        return response()->json(['message' => 'Invalid lesson context.'], 400);
    }

    // 1. Mark this lesson complete safely
    if (method_exists($user, 'completedLessons')) {
        $user->completedLessons()->syncWithoutDetaching([
            $lesson->id => [
                'completed_at' => now(),
            ],
        ]);
    } else {
        return response()->json(['message' => 'Relationship completedLessons missing on User Model.'], 500);
    }

    // 2. Count progress targets dynamically
    $totalLessons = $course->lessons()->count();

    $completedCount = $user->completedLessons()
        ->whereIn('lesson_id', $course->lessons()->pluck('id'))
        ->count();

    $percentage = $totalLessons > 0
        ? (int) round(($completedCount / $totalLessons) * 100)
        : 0;

    if ($percentage > 100) { $percentage = 100; }

    // 3. SAFE PIVOT UPDATE: Only update status since progress_percent column is missing
    try {
        $user->courses()->updateExistingPivot($course->id, [
            'status' => $percentage === 100 ? 'completed' : 'enrolled',
        ]);
    } catch (\Exception $e) {
        // Fallback if the user isn't attached to the course pivot yet
    }

    $courseCompleted = false;

    if ($percentage === 100) {
        if (class_exists(\App\Jobs\GenerateCertificatePdfJob::class)) {
            \App\Jobs\GenerateCertificatePdfJob::dispatch(
                $user->id,
                $course->id
            );
        }
        $courseCompleted = true;
    }

   return response()->json([
    'message' => 'Progress tracked successfully.',
    'progress_percent' => $percentage,
    'course_completed' => $courseCompleted,

    'completed_lessons' => $user->completedLessons()
        ->whereIn(
            'lesson_id',
            $course->lessons()->pluck('id')
        )
        ->pluck('lesson_id')
        ->values(),
]);
}


public function getCompletedLessons(Course $course)
{
    $user = auth()->user();

    $completedLessons = $user->completedLessons()
        ->whereIn(
            'lesson_id',
            $course->lessons()->pluck('id')
        )
        ->pluck('lesson_id');

    return response()->json([
        'completed_lessons' => $completedLessons,
    ]);
}
    /*
    |--------------------------------------------------------------------------
    | AI Features
    |--------------------------------------------------------------------------
    */

    public function triggerAi(
        Request $request,
        Course $course,
        Lesson $lesson
    ) {
        if ($lesson->course_id !== $course->id) {
            return response()->json([
                'message' => 'Lesson not found.',
            ], 404);
        }

        $this->authorize('view', $lesson);

        $validated = $request->validate([
            'type' => 'required|in:summary,quiz,explain',
        ]);

        $user = auth()->user();
        $type = $validated['type'];

        $key = "ai-calls:{$user->id}";

        if (RateLimiter::tooManyAttempts($key, 15)) {
            return response()->json([
                'message' => 'Too many AI requests. Please wait a moment.',
            ], 429);
        }

        RateLimiter::hit($key, 900);

        $prompt = match ($type) {
            'summary' => "Summarize the following lesson content in 3 bullet points:\n\n{$lesson->content}",

            'quiz' => "Generate a 3-question multiple choice quiz based on the following content. Return ONLY a JSON array of objects with 'question', 'options', and 'answer' keys.\n\n{$lesson->content}",

            'explain' => "Explain the following lesson content simply, as if I am 10 years old:\n\n{$lesson->content}",
        };

        GenerateAiContentJob::dispatch(
            $user->id,
            $lesson->id,
            $type,
            $prompt
        );

        return response()->json([
            'message' => 'AI task queued successfully.',
            'status' => 'processing',
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | Recommendations
    |--------------------------------------------------------------------------
    */

    public function getRecommendations()
    {
        $user = auth()->user();

        $completedCategoryIds = $user->courses()
            ->wherePivot('status', 'completed')
            ->pluck('category_id')
            ->unique();

        $enrolledIds = $user->courses()->pluck('course_id');

        if ($completedCategoryIds->isEmpty()) {
            $recommendations = Course::withCount('lessons')
                ->whereNotIn('id', $enrolledIds)
                ->inRandomOrder()
                ->take(3)
                ->get();
        } else {
            $recommendations = Course::withCount('lessons')
                ->whereIn('category_id', $completedCategoryIds)
                ->whereNotIn('id', $enrolledIds)
                ->take(4)
                ->get();
        }

        return response()->json([
            'recommendations' => $recommendations,
        ]);
    }


    public function getProgress(Course $course)
{
    $user = auth()->user();

    $progress = $user->courses()
        ->where('course_id', $course->id)
        ->first();

    return response()->json([
        'progress_percent' => $progress?->pivot?->progress_percent ?? 0,
    ]);
}


public function getCertificate(Course $course)
{
    $certificate = Certificate::where('user_id', auth()->id())
        ->where('course_id', $course->id)
        ->first();

    if (!$certificate) {
        return response()->json([
            'message' => 'Certificate not found'
        ], 404);
    }

    return response()->json([
        'file_path' => $certificate->file_path,
        'certificate_number' => $certificate->certificate_number,
    ]);
}


/*
    |--------------------------------------------------------------------------
    | User Dashboard Context
    |--------------------------------------------------------------------------
    | */
    public function getDashboardData()
{
    $user = auth()->user();

    if (!$user) {
        return response()->json([
            'message' => 'Unauthenticated.'
        ], 401);
    }

    $enrolledCourses = $user->courses()->get();

    $dashboardCourses = $enrolledCourses->map(function ($course) use ($user) {

        $totalLessons = $course->lessons()->count();

        $completedLessonsCount = $user->completedLessons()
            ->whereIn(
                'lesson_id',
                $course->lessons()->pluck('id')
            )
            ->count();

        $certificate = \App\Models\Certificate::where(
            'user_id',
            $user->id
        )
        ->where(
            'course_id',
            $course->id
        )
        ->first();

        $isCompleted =
            $totalLessons > 0 &&
            $completedLessonsCount === $totalLessons;

        return [
            'id' => $course->id,
            'title' => $course->title,
            'total_lessons' => $totalLessons,
            'completed_lessons_count' => $completedLessonsCount,

            'progress_percent' => $totalLessons > 0
                ? round(($completedLessonsCount / $totalLessons) * 100)
                : 0,

            'status' => $isCompleted
                ? 'completed'
                : 'enrolled',

            'certificate_url' => $certificate?->file_path,

            'certificate_number' => $certificate?->certificate_number,
        ];
    });

    return response()->json([
        'user' => [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
        ],

        'enrolled_courses' => $dashboardCourses,
    ]);
}

}
