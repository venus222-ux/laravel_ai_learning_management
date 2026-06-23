<?php

namespace App\Policies;

use App\Models\Lesson;
use App\Models\User;

class LessonPolicy
{
    public function view(User $user, Lesson $lesson): bool
    {
        // Must be enrolled in the course
        return $user->courses()->where('course_id', $lesson->course_id)->exists();
    }
}
