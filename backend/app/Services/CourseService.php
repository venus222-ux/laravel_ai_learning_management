<?php

namespace App\Services;

use App\Models\Certificate;
use App\Models\Course;
use App\Models\User;

class CourseService
{
    public function getAllCourses()
    {
        return Course::withCount('lessons')->get();
    }

    public function getCourseDetails(Course $course)
    {
        $course->load([
            'lessons' => fn ($query) => $query
                ->select('id', 'course_id', 'title', 'order')
                ->orderBy('order'),
        ]);

        return $course;
    }

    public function enrollUser(User $user, Course $course): void
    {
        if (! $user->courses()->where('course_id', $course->id)->exists()) {
            $user->courses()->attach($course->id, [
                'status' => 'enrolled',
            ]);
        }
    }

    /**This checks what categories the user has completed.
     * If they have completed courses,
     * it recommends new courses from those same categories.
     * If not, it just grabs 3 random courses they aren't enrolled in yet.
     * */
    public function getRecommendations(User $user)
    {
        $completedCategoryIds = $user->courses()
            ->wherePivot('status', 'completed')
            ->pluck('category_id')
            ->unique();

        $enrolledIds = $user->courses()->pluck('course_id');

        if ($completedCategoryIds->isEmpty()) {
            return Course::withCount('lessons')
                ->whereNotIn('id', $enrolledIds)
                ->inRandomOrder()
                ->take(3)
                ->get();
        }

        return Course::withCount('lessons')
            ->whereIn('category_id', $completedCategoryIds)
            ->whereNotIn('id', $enrolledIds)
            ->take(4)
            ->get();
    }

    /**This does the heavy mapping.
     * It takes all the user's enrolled courses and calculates
     * how many lessons they've finished, figures out their
     * percentage, and attaches their certificate URL if they've
     * graduated. */
    public function getDashboardData(User $user): array
    {
        $enrolledCourses = $user->courses()->get();

        $dashboardCourses = $enrolledCourses->map(function ($course) use ($user) {
            $totalLessons = $course->lessons()->count();

            $completedLessonsCount = $user->completedLessons()
                ->whereIn('lesson_id', $course->lessons()->pluck('id'))
                ->count();

            $certificate = Certificate::where('user_id', $user->id)
                ->where('course_id', $course->id)
                ->first();

            $isCompleted = $totalLessons > 0 && $completedLessonsCount === $totalLessons;

            return [
                'id' => $course->id,
                'title' => $course->title,
                'total_lessons' => $totalLessons,
                'completed_lessons_count' => $completedLessonsCount,
                'progress_percent' => $totalLessons > 0
                    ? round(($completedLessonsCount / $totalLessons) * 100)
                    : 0,
                'status' => $isCompleted ? 'completed' : 'enrolled',
                'certificate_url' => $certificate?->file_path,
                'certificate_number' => $certificate?->certificate_number,
            ];
        });

        return [
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
            ],
            'enrolled_courses' => $dashboardCourses,
        ];
    }
}
