<?php

namespace App\Services;

use Illuminate\Support\Facades\Log;
use OpenAI\Laravel\Facades\OpenAI;

class AiService
{
    /**
     * Generate content using the official OpenAI Laravel integration.
     */
    public function generate(string $userPrompt, string $systemPrompt = 'You are a helpful teaching assistant.', int $maxTokens = 800)
    {
        try {
            $result = OpenAI::chat()->create([
                'model' => 'llama-3.3-70b-versatile', // Using Groq's open-source model
                'messages' => [
                    ['role' => 'system', 'content' => $systemPrompt],
                    ['role' => 'user', 'content' => $userPrompt],
                ],
                'max_tokens' => $maxTokens,
                'temperature' => 0.7,
            ]);

            $rawContent = $result->choices[0]->message->content ?? '';

            // 🛠️ FIX: Strip out markdown wrappers that crash the frontend parser.
            // Using \x60 (hex for backtick) to prevent UI parsing conflicts.
            $cleanContent = preg_replace('/^\x60{3}(?:json)?\s+|\s*\x60{3}$/i', '', trim($rawContent));

            return [
                'content' => $cleanContent,
                'model' => $result->model,
                'tokens' => $result->usage->totalTokens ?? 0,
            ];

        } catch (\Throwable $th) {
            Log::error('AiService Exception: '.$th->getMessage());
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
