<?php

namespace App\Events;

use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class AiContentGenerated implements ShouldBroadcastNow
{
    public $userId;
    public $interactionId;
    public $type;
    public $content;

    public function __construct($userId, $interactionId, $type, $content)
    {
        $this->userId = $userId;
        $this->interactionId = $interactionId;
        $this->type = $type;
        $this->content = $content;
    }

    public function broadcastOn(): array
    {
        return [
            new PrivateChannel('user.' . $this->userId),
        ];
    }

    public function broadcastAs(): string
    {
        return 'ai.completed';
    }
}
