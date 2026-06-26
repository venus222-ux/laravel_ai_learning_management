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

class GenerateAiContentJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    protected int $userId;
    protected int $lessonId;
    protected string $type;
    protected string $prompt;

    public int $tries = 3;
    public int $timeout = 120;

    public function __construct(
        int $userId,
        int $lessonId,
        string $type,
        string $prompt
    ) {
        $this->userId = $userId;
        $this->lessonId = $lessonId;
        $this->type = $type;
        $this->prompt = $prompt;
    }

    public function handle(AiService $aiService): void
    {
        $interaction = ActivityLogger::logAiInteraction([
            'user_id' => $this->userId,
            'lesson_id' => $this->lessonId,
            'type' => $this->type,
            'prompt' => $this->prompt,
            'status' => 'pending',
        ]);

        try {
            $systemPrompt = 'You are an expert tutor. Provide responses in clean Markdown formatting.';

            $result = $aiService->generate(
                $this->prompt,
                $systemPrompt
            );

            $interaction->update([
                'response' => $result['content'],
                'model_used' => $result['model'],
                'tokens_used' => $result['tokens'],
                'status' => 'completed',
            ]);

           event(new AiContentGenerated(
             $this->userId,
             (string) $interaction->_id,
             $this->type,
             $result['content']
            ));

        } catch (\Throwable $e) {

            $interaction->update([
                'status' => 'failed',
                'response' => $e->getMessage(),
            ]);

            event(new AiContentGenerated(
                $this->userId,
                (string) $interaction->_id,
                'error',
                'Failed to generate content. Please try again.'
            ));

            throw $e;
        }
    }

    public function backoff(): array
    {
        return [10, 30, 60];
    }

    public function failed(\Throwable $exception): void
    {
        logger()->error('AI generation job failed', [
            'user_id' => $this->userId,
            'lesson_id' => $this->lessonId,
            'type' => $this->type,
            'error' => $exception->getMessage(),
        ]);
    }
}
