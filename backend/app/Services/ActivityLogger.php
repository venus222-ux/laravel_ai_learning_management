<?php

namespace App\Services;

use App\Models\MongoLog;
use App\Models\MongoAiInteraction;

class ActivityLogger
{
    public static function log(array $data): void
    {
        MongoLog::create([
            'user_id'       => $data['user_id'] ?? null,
            'email'         => $data['email'] ?? null,
            'action'        => $data['action'],
            'status'        => $data['status'],
            'ip_address'    => request()->ip(),
            'user_agent'    => request()->userAgent(),
            'device'        => self::getDevice(),
            'browser'       => self::getBrowser(),
            'failure_reason'=> $data['failure_reason'] ?? null,
            'created_at'    => now(),
        ]);
    }

    protected static function getDevice()
    {
        $agent = request()->userAgent();

        if (str_contains($agent, 'Mobile')) return 'mobile';
        if (str_contains($agent, 'Tablet')) return 'tablet';
        return 'desktop';
    }

    protected static function getBrowser()
    {
        $agent = request()->userAgent();

        if (str_contains($agent, 'Chrome')) return 'Chrome';
        if (str_contains($agent, 'Firefox')) return 'Firefox';
        if (str_contains($agent, 'Safari')) return 'Safari';

        return 'Unknown';
    }

    public static function logAiInteraction(array $data)
    {
        return MongoAiInteraction::create([
            'user_id'     => $data['user_id'] ?? auth()->id(),
            'lesson_id'   => $data['lesson_id'] ?? null,
            'type'        => $data['type'] ?? 'general',
            'prompt'      => $data['prompt'] ?? '',
            'response'    => $data['response'] ?? null,
            'model_used'  => $data['model_used'] ?? 'unknown',
            'tokens_used' => $data['tokens_used'] ?? 0,
            'status'      => $data['status'] ?? 'pending',
        ]);
    }
}
