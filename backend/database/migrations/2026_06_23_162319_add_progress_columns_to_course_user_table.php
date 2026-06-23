<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('course_user', function (Blueprint $blueprint) {
            // Add progress tracking columns if they don't exist
            $blueprint->integer('progress_percent')->default(0)->after('status');
        });
    }

    public function down(): void
    {
        Schema::table('course_user', function (Blueprint $blueprint) {
            $blueprint->dropColumn('progress_percent');
        });
    }
};
