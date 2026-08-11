<?php

namespace App\Http\Controllers;

use App\Models\Course;
use App\Models\Lesson;
use App\Services\AiFeatureService;
use App\Services\CourseService;
use App\Services\ProgressService;
use App\Services\SearchService;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\Request;

class LmsController extends Controller
{
    use AuthorizesRequests;

    public function __construct(
        protected CourseService $courseService,
        protected ProgressService $progressService,
        protected AiFeatureService $aiFeatureService,
        protected SearchService $searchService
    ) {}

    public function getCourses()
    {
        return response()->json([
            'courses' => $this->courseService->getAllCourses(),
        ]);
    }

    public function getCourse(Course $course)
    {
        return response()->json([
            'course' => $this->courseService->getCourseDetails($course),
        ]);
    }

    public function enroll(Course $course)
    {
        $this->courseService->enrollUser(auth()->user(), $course);

        return response()->json([
            'message' => 'Successfully enrolled!',
        ]);
    }

    public function getLesson(Course $course, Lesson $lesson)
    {
        if ($lesson->course_id !== $course->id) {
            return response()->json(['message' => 'Lesson not found.'], 404);
        }

        $this->authorize('view', $lesson);

        return response()->json([
            'lesson' => $lesson,
        ]);
    }

    public function completeLesson(Course $course, Lesson $lesson)
    {
        $user = auth()->user();

        if (! $user) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        if ($lesson->course_id !== $course->id) {
            return response()->json(['message' => 'Invalid lesson context.'], 400);
        }

        try {
            $progressData = $this->progressService->markLessonComplete($user, $course, $lesson);

            return response()->json(array_merge(['message' => 'Progress tracked successfully.'], $progressData));
        } catch (\Exception $e) {
            return response()->json(['message' => $e->getMessage()], 500);
        }
    }

    public function getCompletedLessons(Course $course)
    {
        return response()->json([
            'completed_lessons' => $this->progressService->getCompletedLessonIds(auth()->user(), $course),
        ]);
    }

    public function triggerAi(Request $request, Course $course, Lesson $lesson)
    {
        if ($lesson->course_id !== $course->id) {
            return response()->json(['message' => 'Lesson not found.'], 404);
        }

        $this->authorize('view', $lesson);

        $validated = $request->validate([
            'type' => 'required|in:summary,quiz,explain',
        ]);

        $response = $this->aiFeatureService->dispatchAiJob(auth()->user(), $lesson, $validated['type']);

        if (isset($response['error'])) {
            return response()->json(['message' => $response['error']], $response['status_code']);
        }

        return response()->json($response);
    }

    public function getRecommendations()
    {
        return response()->json([
            'recommendations' => $this->courseService->getRecommendations(auth()->user()),
        ]);
    }

    public function getProgress(Course $course)
    {
        return response()->json([
            'progress_percent' => $this->progressService->getCourseProgress(auth()->user(), $course),
        ]);
    }

    public function getCertificate(Course $course)
    {
        $certificate = $this->progressService->getCertificate(auth()->user(), $course);

        if (! $certificate) {
            return response()->json(['message' => 'Certificate not found'], 404);
        }

        return response()->json([
            'file_path' => $certificate->file_path,
            'certificate_number' => $certificate->certificate_number,
        ]);
    }

    public function getDashboardData()
    {
        $user = auth()->user();

        if (! $user) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        return response()->json($this->courseService->getDashboardData($user));
    }

    public function search(Request $request)
    {
        $validated = $request->validate([
            'q' => 'required|string|min:2',
            'type' => 'sometimes|in:standard,semantic',
        ]);

        $searchType = $validated['type'] ?? 'standard';
        $results = $this->searchService->search($validated['q'], $searchType);

        return response()->json([
            'query' => $validated['q'],
            'type' => $searchType,
            'results' => $results,
        ]);
    }
}
