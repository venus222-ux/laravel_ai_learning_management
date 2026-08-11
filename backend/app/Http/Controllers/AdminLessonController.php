<?php

namespace App\Http\Controllers;

use App\Models\Course;
use App\Models\Lesson;
use Illuminate\Http\Request;

class AdminLessonController extends Controller
{
    public function index(Course $course)
    {
        return response()->json($course->lessons);
    }

    public function store(Request $request, Course $course)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'content' => 'required|string',
            'order' => 'nullable|integer',
        ]);

        // Auto-increment relative order context if omitted
        if (! isset($validated['order'])) {
            $validated['order'] = $course->lessons()->max('order') + 1;
        }

        $lesson = $course->lessons()->create($validated);

        return response()->json([
            'message' => 'Lesson created successfully',
            'lesson' => $lesson,
        ], 201);
    }

    public function update(Request $request, Course $course, Lesson $lesson)
    {
        // Guard against mismatched target hierarchies
        if ($lesson->course_id !== $course->id) {
            return response()->json(['message' => 'Mismatched lesson routing'], 400);
        }

        $validated = $request->validate([
            'title' => 'sometimes|required|string|max:255',
            'content' => 'sometimes|required|string',
            'order' => 'sometimes|required|integer',
        ]);

        $lesson->update($validated);

        return response()->json([
            'message' => 'Lesson updated successfully',
            'lesson' => $lesson,
        ]);
    }

    public function destroy(Course $course, Lesson $lesson)
    {
        if ($lesson->course_id !== $course->id) {
            return response()->json(['message' => 'Mismatched lesson routing'], 400);
        }

        $lesson->delete();

        return response()->json(['message' => 'Lesson deleted successfully']);
    }
}
