<?php

namespace App\Models;

use MongoDB\Laravel\Eloquent\Model;

class MongoAiInteraction extends Model
{
    protected $connection = 'mongodb';
    protected $collection = 'ai_interactions';

    protected $fillable = [
        'user_id',
        'lesson_id',
        'type',
        'prompt',
        'response',
        'model_used',
        'tokens_used',
        'status'
    ];

    public $timestamps = true;
}
