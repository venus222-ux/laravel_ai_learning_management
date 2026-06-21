<?php

namespace App\Http\Controllers;

use App\Models\Course;
use App\Models\Lesson;
use Illuminate\Http\Request;
use App\Jobs\GenerateAiContentJob;

class LmsController extends Controller
{
    // ================= COURSES =================

    public function getCourses()
    {
        // Fetch courses, optionally checking if the user is enrolled
        $courses = Course::withCount('lessons')->get();
        return response()->json(['courses' => $courses]);
    }

    public function getCourse(Course $course)
    {
        // Load the course with its lessons ordered correctly
        $course->load(['lessons' => function ($query) {
            $query->orderBy('order', 'asc')->select('id', 'course_id', 'title', 'order');
            // We omit 'content' here to keep the payload light until they click a specific lesson
        }]);

        return response()->json(['course' => $course]);
    }

    public function enroll(Course $course)
    {
        $user = auth()->user();
        if (!$user->courses()->where('course_id', $course->id)->exists()) {
            $user->courses()->attach($course->id, ['status' => 'enrolled']);
        }
        return response()->json(['message' => 'Successfully enrolled!']);
    }

    // ================= LESSONS & AI =================

    public function getLesson(Course $course, Lesson $lesson)
    {
        // Ensure the lesson belongs to the requested course
        if ($lesson->course_id !== $course->id) {
            return response()->json(['message' => 'Lesson not found in this course.'], 404);
        }

        return response()->json(['lesson' => $lesson]);
    }

    public function triggerAi(Request $request, Course $course, Lesson $lesson)
    {
        $request->validate([
            'type' => 'required|in:summary,quiz,explain',
        ]);

        $user = auth()->user();
        $type = $request->type;

        // Construct the prompt based on the requested tool
        $prompt = match ($type) {
            'summary' => "Summarize the following lesson content in 3 bullet points:\n\n" . $lesson->content,
            'quiz'    => "Generate a 3-question multiple choice quiz based on the following content. Return ONLY a JSON array of objects with 'question', 'options' (array), and 'answer' keys.\n\n" . $lesson->content,
            'explain' => "Explain the following lesson content simply, as if I am 10 years old:\n\n" . $lesson->content,
            default   => "Analyze this content:\n\n" . $lesson->content,
        };

        // Dispatch the job to the queue
        GenerateAiContentJob::dispatch($user->id, $lesson->id, $type, $prompt);

        return response()->json([
            'message' => 'AI task queued successfully. Waiting for broadcast...',
            'status'  => 'processing'
        ]);
    }
}
