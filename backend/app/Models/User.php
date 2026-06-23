<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Tymon\JWTAuth\Contracts\JWTSubject;
use Spatie\Permission\Traits\HasRoles;

class User extends Authenticatable implements JWTSubject
{
    use HasFactory, Notifiable, HasRoles;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var array<int, string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * The attributes that should be cast.
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    /*
    |--------------------------------------------------------------------------
    | JWT Authentication
    |--------------------------------------------------------------------------
    */

    public function getJWTIdentifier(): mixed
    {
        return $this->getKey();
    }

    public function getJWTCustomClaims(): array
    {
        return [
            'role' => $this->getRoleNames()->first(),
        ];
    }

    /*
    |--------------------------------------------------------------------------
    | LMS Relationships
    |--------------------------------------------------------------------------
    */

    /**
     * Courses enrolled by the user.
     */
    public function courses(): BelongsToMany
    {
        return $this->belongsToMany(Course::class)
            ->withPivot('status')
            ->withTimestamps();
    }

    /**
     * Lessons completed by the user.
     */
    public function completedLessons(): BelongsToMany
    {
        return $this->belongsToMany(Lesson::class, 'lesson_user')
            ->withPivot('completed_at')
            ->withTimestamps();
    }

    /**
     * Certificates earned by the user.
     */
    public function certificates(): HasMany
    {
        return $this->hasMany(Certificate::class);
    }

    /*
    |--------------------------------------------------------------------------
    | Helper Methods
    |--------------------------------------------------------------------------
    */

    /**
     * Check if user completed a lesson.
     */
    public function hasCompletedLesson(int $lessonId): bool
    {
        return $this->completedLessons()
            ->where('lesson_id', $lessonId)
            ->exists();
    }

    /**
     * Mark lesson as completed.
     */
    public function completeLesson(int $lessonId): void
    {
        $this->completedLessons()->syncWithoutDetaching([
            $lessonId => [
                'completed_at' => now(),
            ],
        ]);
    }

    /**
     * Check if user owns a certificate for a course.
     */
    public function hasCertificate(int $courseId): bool
    {
        return $this->certificates()
            ->where('course_id', $courseId)
            ->exists();
    }

    /**
     * Get course progress percentage.
     */
    public function getCourseProgress(Course $course): float
    {
        $totalLessons = $course->lessons()->count();

        if ($totalLessons === 0) {
            return 0;
        }

        $completedLessons = $this->completedLessons()
            ->whereIn(
                'lesson_id',
                $course->lessons()->pluck('id')
            )
            ->count();

        return round(
            ($completedLessons / $totalLessons) * 100,
            2
        );
    }

    /**
     * Check if user completed an entire course.
     */
    public function hasCompletedCourse(Course $course): bool
    {
        return $this->getCourseProgress($course) >= 100;
    }
}
