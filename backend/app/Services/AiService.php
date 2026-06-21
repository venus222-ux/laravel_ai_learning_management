<?php

namespace App\Services;

use OpenAI\Laravel\Facades\OpenAI;
use Illuminate\Support\Facades\Log;

class AiService
{
    /**
     * Generate content using the official OpenAI Laravel integration.
     */
    public function generate(string $userPrompt, string $systemPrompt = "You are a helpful teaching assistant.", int $maxTokens = 800)
    {
        try {
            $result = OpenAI::chat()->create([
                'model' => 'gpt-4o-mini', // Fast, cost-effective model for LMS tasks
                'messages' => [
                    ['role' => 'system', 'content' => $systemPrompt],
                    ['role' => 'user', 'content' => $userPrompt],
                ],
                'max_tokens' => $maxTokens,
                'temperature' => 0.7,
            ]);

            return [
                'content' => $result->choices[0]->message->content ?? '',
                'model'   => $result->model,
                'tokens'  => $result->usage->totalTokens ?? 0,
            ];

        } catch (\Throwable $th) {
            Log::error("AiService Exception: " . $th->getMessage());
            throw $th;
        }
    }
}

/**The AI Service Class
This service handles
the actual HTTP request to your AI provider (e.g., OpenAI).
It acts as a wrapper so your controllers and jobs
don't need to know the specific API details.
*/
