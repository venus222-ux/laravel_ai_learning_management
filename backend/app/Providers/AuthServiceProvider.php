<?php

namespace App\Providers;

use App\Models\Course;
use App\Models\Lesson;
use App\Policies\LessonPolicy;
use App\Policies\CoursePolicy;
use Illuminate\Foundation\Support\Providers\AuthServiceProvider as ServiceProvider;

class AuthServiceProvider extends ServiceProvider
{
    protected $policies = [
        Lesson::class => LessonPolicy::class,
        Course::class => CoursePolicy::class,
    ];

    public function boot(): void
    {
        $this->registerPolicies();
    }
}
