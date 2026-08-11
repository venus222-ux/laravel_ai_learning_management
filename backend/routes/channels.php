<?php

use Illuminate\Support\Facades\Broadcast;
use Illuminate\Support\Facades\Log; // Add this

Broadcast::channel('user.{id}', function ($user, $id) {
    Log::info('Broadcasting Auth Attempt', [
        'user_id' => $user?->id,
        'requested_channel_id' => $id,
    ]);

    return (int) $user?->id === (int) $id;
});
