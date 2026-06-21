<?php

namespace App\Jobs;

use App\Models\MongoAiInteraction;
use App\Events\AiContentGenerated;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use App\Services\AiService;
use App\Services\ActivityLogger;
use App\Events\AiContentGenerated;

class GenerateAiContentJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    protected $userId;
    protected $lessonId;
    protected $type;
    protected $prompt;

    public function __construct($userId, $lessonId, $type, $prompt)
    {
        $this->userId = $userId;
        $this->lessonId = $lessonId;
        $this->type = $type;
        $this->prompt = $prompt;
    }

    public function handle(AiService $aiService): void
    {
        // 1. Log pending interaction
        $interaction = ActivityLogger::logAiInteraction([
            'user_id'   => $this->userId,
            'lesson_id' => $this->lessonId,
            'type'      => $this->type,
            'prompt'    => $this->prompt,
            'status'    => 'pending'
        ]);

        try {
            $systemPrompt = "You are an expert tutor. Provide responses in clean Markdown formatting.";

            // 2. Call the AI Service
            $result = $aiService->generate($this->prompt, $systemPrompt);

            // 3. Update MongoDB interaction with success and usage stats
            $interaction->update([
                'response'    => $result['content'],
                'model_used'  => $result['model'],
                'tokens_used' => $result['tokens'],
                'status'      => 'completed',
            ]);

            // 4. Broadcast to frontend via Pusher
            event(new AiContentGenerated($this->userId, $interaction->_id, $this->type, $result['content']));

        } catch (\Exception $e) {
            // Log failure
            $interaction->update(['status' => 'failed', 'response' => $e->getMessage()]);

            // Optionally broadcast a failure event so the frontend stops loading
            event(new AiContentGenerated($this->userId, $interaction->_id, 'error', 'Failed to generate content. Please try again.'));
        }
}
