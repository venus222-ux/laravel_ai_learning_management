<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class AiService
{
    protected string $apiKey;
    protected string $baseUrl;
    protected string $defaultModel;

    public function __construct()
    {
        // Assuming you add OPENAI_API_KEY to your .env
        $this->apiKey = config('services.openai.key', env('OPENAI_API_KEY'));
        $this->baseUrl = 'https://api.openai.com/v1';
        $this->defaultModel = 'gpt-4o-mini';
    }

    public function generate(string $userPrompt, string $systemPrompt = "You are a helpful teaching assistant.", int $maxTokens = 500)
    {
        try {
            $response = Http::withToken($this->apiKey)
                ->timeout(30)
                ->post("{$this->baseUrl}/chat/completions", [
                    'model' => $this->defaultModel,
                    'messages' => [
                        ['role' => 'system', 'content' => $systemPrompt],
                        ['role' => 'user', 'content' => $userPrompt],
                    ],
                    'max_tokens' => $maxTokens,
                    'temperature' => 0.7,
                ]);

            if ($response->failed()) {
                Log::error('AI API Error: ' . $response->body());
                throw new \Exception('Failed to generate AI content.');
            }

            $data = $response->json();

            return [
                'content' => $data['choices'][0]['message']['content'] ?? '',
                'model'   => $data['model'] ?? $this->defaultModel,
                'tokens'  => $data['usage']['total_tokens'] ?? 0,
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
