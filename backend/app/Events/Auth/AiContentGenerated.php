<?php

namespace App\Events;

use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class AiContentGenerated implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $userId;
    public $interactionId;
    public $type;
    public $data;

    public function __construct($userId, $interactionId, $type, $data)
    {
        $this->userId = $userId;
        $this->interactionId = $interactionId;
        $this->type = $type;
        $this->data = $data;
    }

    public function broadcastOn(): array
    {
        // Broadcast strictly to this specific user's private channel
        return [
            new PrivateChannel('user.' . $this->userId),
        ];
    }

    public function broadcastAs(): string
    {
        return 'ai.completed';
    }
}
