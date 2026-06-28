<?php

namespace App\Services;

use App\Jobs\GenerateAiContentJob;
use App\Models\Lesson;
use App\Models\User;
use Illuminate\Support\Facades\RateLimiter;

class AiFeatureService //Handles the LMS-specific rules for using AI
{
    public function dispatchAiJob(User $user, Lesson $lesson, string $type): array
    {
        $key = "ai-calls:{$user->id}";

        if (RateLimiter::tooManyAttempts($key, 15)) {
            return [
                'error' => 'Too many AI requests. Please wait a moment.',
                'status_code' => 429,
            ];
        }

        RateLimiter::hit($key, 900);

        $prompt = match ($type) {
            'summary' => "Summarize the following lesson content in 3 bullet points:\n\n{$lesson->content}",
            'quiz' => "Generate a 3-question multiple choice quiz based on the following content. Return ONLY a JSON array of objects with 'question', 'options', and 'answer' keys.\n\n{$lesson->content}",
            'explain' => "Explain the following lesson content simply, as if I am 10 years old:\n\n{$lesson->content}",
        };

        GenerateAiContentJob::dispatch($user->id, $lesson->id, $type, $prompt);

        return [
            'message' => 'AI task queued successfully.',
            'status' => 'processing',
        ];
    }
}

/***
 * if (RateLimiter::tooManyAttempts($key, 15)) { ... }
 * AI API calls cost money. This code ensures a single user can
 * only request 15 AI actions per 15 minutes (900 seconds).
 * If they spam the button, it blocks them and returns a
 * 429 Too Many Requests error.
 */

/**
 * Prompt Generation: It uses PHP 8's match expression to
 * figure out what the user clicked (summary, quiz, or explain)
 * and builds the exact text prompt using the actual lesson
 * content.
 */

/**
 * Queueing the Job: Finally, instead of making the user wait for
 * the AI to type out an answer (which could take 5-10 seconds and
 * freeze their browser), it dispatches the GenerateAiContentJob
 * to run in the background and immediately tells the frontend:
 * "AI task queued successfully."
 */
