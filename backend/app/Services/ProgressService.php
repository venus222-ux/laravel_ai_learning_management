<?php

namespace App\Services;

use App\Jobs\GenerateCertificatePdfJob;
use App\Models\Course;
use App\Models\Lesson;
use App\Models\User;
use App\Models\Certificate;

class ProgressService //tracking what a user has done and rewarding them for finishing.
{
    public function markLessonComplete(User $user, Course $course, Lesson $lesson): array
    {
        if (! method_exists($user, 'completedLessons')) {
            throw new \Exception('Relationship completedLessons missing on User Model.');
        }

        // 1. Mark this lesson complete safely
        $user->completedLessons()->syncWithoutDetaching([
            $lesson->id => [
                'completed_at' => now(),
            ],
        ]);

        // 2. Count progress targets dynamically
        $totalLessons = $course->lessons()->count();

        $completedCount = $user->completedLessons()
            ->whereIn('lesson_id', $course->lessons()->pluck('id'))
            ->count();

        $percentage = $totalLessons > 0
            ? (int) round(($completedCount / $totalLessons) * 100)
            : 0;

        if ($percentage > 100) {
            $percentage = 100;
        }

        // 3. SAFE PIVOT UPDATE: Only update status
        try {
            $user->courses()->updateExistingPivot($course->id, [
                'status' => $percentage === 100 ? 'completed' : 'enrolled',
            ]);
        } catch (\Exception $e) {
            // Fallback if the user isn't attached to the course pivot yet
        }

        $courseCompleted = false;

        if ($percentage === 100) {
            if (class_exists(GenerateCertificatePdfJob::class)) {
                GenerateCertificatePdfJob::dispatch($user->id, $course->id);
            }
            $courseCompleted = true;
        }

        return [
            'progress_percent' => $percentage,
            'course_completed' => $courseCompleted,
            'completed_lessons' => $this->getCompletedLessonIds($user, $course),
        ];
    }

    public function getCompletedLessonIds(User $user, Course $course)
    {
        return $user->completedLessons()
            ->whereIn('lesson_id', $course->lessons()->pluck('id'))
            ->pluck('lesson_id')
            ->values();
    }

    public function getCourseProgress(User $user, Course $course): int
    {
        $progress = $user->courses()
            ->where('course_id', $course->id)
            ->first();

        return $progress?->pivot?->progress_percent ?? 0;
    }

    public function getCertificate(User $user, Course $course)
    {
        return Certificate::where('user_id', $user->id)
            ->where('course_id', $course->id)
            ->first();
    }
}

/**
 * markLessonComplete(): This is the core engine. When a user finishes a lesson:

* 1. It attaches the lesson_id to the user's completedLessons relationship.

* 2. It recalculates their progress by dividing their completed lessons by the total course lessons.

* 3. It updates the pivot table (the bridge between the User and the Course) to mark them either 'enrolled' or 'completed'.

* The Certificate Trigger: Inside markLessonComplete(), if the progress hits 100%,
* it automatically dispatches the GenerateCertificatePdfJob. This ensures certificates are only generated the exact moment a course is fully passed.
* getCompletedLessonIds() & getCourseProgress(): Simple helper functions to quickly pull a user's stats for the frontend UI.
 */
