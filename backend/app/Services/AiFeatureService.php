<?php

namespace App\Services;

use App\Jobs\GenerateAiContentJob;
use App\Models\Lesson;
use App\Models\User;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\RateLimiter; // 💡 Don't forget to import Http

class AiFeatureService  // Acest serviciu face legătura cu un model local de inteligență artificială (Ollama).
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

    /**
     * Converts a string of text into a vector array for Elasticsearch.
     * Uses Groq's nomic-embed-text-v1.5 model which creates 768-dimension vectors.
     */
    public function generateEmbedding(string $text): array
    {
        // Clean whitespace
        $cleanText = str_replace("\n", ' ', $text);

        // Truncate to 28,000 characters to ensure we stay under the 8k token limit
        // (This prevents the "input length exceeds context length" error)
        if (mb_strlen($cleanText) > 28000) {
            $cleanText = mb_substr($cleanText, 0, 28000);
        }

        $response = \Illuminate\Support\Facades\Http::post('http://127.0.0.1:11434/api/embed', [
            'model' => 'nomic-embed-text',
            'input' => $cleanText, // Use 'input' here
            'truncate' => true,     // Tell Ollama to explicitly truncate if it's still too long
        ]);

        if ($response->failed()) {
            throw new \Exception('Ollama Embedding failed: '.$response->body());
        }

        // Ollama returns { "embeddings": [[...]] }
        return $response->json('embeddings.0');
    }
}

/**generateEmbedding: Aceasta este cea mai importantă funcție.
 * Ea ia un text (o lecție sau o întrebare) și îl trimite către
 * un model de AI (nomic-embed-text) care îl transformă într-un
 * vector de 768 de dimensiuni. */
