<?php

namespace App\Jobs;

use App\Models\User;
use App\Models\Course;
use App\Models\Certificate;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Str;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Support\Facades\Storage;
use Exception;

class GenerateCertificatePdfJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    protected $userId;
    protected $courseId;

    /**
     * Number of times the job may be attempted.
     */
    public $tries = 3;

    public function __construct(int $userId, int $courseId)
    {
        $this->userId = $userId;
        $this->courseId = $courseId;
        $this->onQueue('emails');
    }

    public function handle(): void
    {
        try {
            $user = User::findOrFail($this->userId);
            $course = Course::findOrFail($this->courseId);

            // Avoid duplicate documents
            $existing = Certificate::where('user_id', $user->id)
                ->where('course_id', $course->id)
                ->first();

            if ($existing) {
                return;
            }

            $certificateNumber = 'CERT-' . strtoupper(Str::random(4)) . '-' . rand(1000, 9999);

            $html = "
                <div style='text-align:center; border:10px double #6366f1; padding:50px; font-family:sans-serif; margin:20px;'>
                    <h1 style='color:#6366f1; font-size:42px;'>Certificate of Completion</h1>
                    <p style='font-size:18px;'>This is proudly presented to</p>
                    <h2 style='font-size:32px; border-bottom:1px solid #ccc; display:inline-block; padding-bottom:5px;'>{$user->name}</h2>
                    <p style='font-size:18px;'>for successfully mastering all curriculum tracks within the course:</p>
                    <h3>{$course->title}</h3>
                    <p style='margin-top:50px; font-size:14px; color:#555;'>Verification ID: {$certificateNumber} | Date: " . now()->format('M d, Y') . "</p>
                </div>
            ";

            $pdf = Pdf::loadHTML($html);
            $fileName = 'certificates/' . $certificateNumber . '.pdf';

            // Ensure public disk directory target exists safely
            Storage::disk('public')->put($fileName, $pdf->output());

            Certificate::create([
                'user_id' => $user->id,
                'course_id' => $course->id,
                'certificate_number' => $certificateNumber,
                'file_path' => Storage::url($fileName),
            ]);

            logger()->info("Certificate {$certificateNumber} successfully generated on channel [emails].");

        } catch (Exception $e) {
            logger()->error("Failed generating PDF inside queue context: " . $e->getMessage());
            throw $e; // Throwing allows standard retry configurations to catch
        }
    }
}
