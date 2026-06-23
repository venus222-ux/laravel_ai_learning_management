<?php

namespace App\Http\Controllers;

use App\Models\Course;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AdminCourseController extends Controller
{
    public function index()
    {
        return response()->json(Course::with('category')->withCount('lessons')->get());
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'required|string',
            'category_id' => 'nullable|exists:categories,id',
        ]);

        $course = Course::create($validated);
        return response()->json(['message' => 'Course created', 'course' => $course], 201);
    }

    public function update(Request $request, Course $course)
    {
        $validated = $request->validate([
            'title' => 'sometimes|required|string|max:255',
            'description' => 'sometimes|required|string',
            'category_id' => 'nullable|exists:categories,id',
        ]);

        $course->update($validated);
        return response()->json(['message' => 'Course updated', 'course' => $course]);
    }

    public function destroy(Course $course)
    {
        $course->delete();
        return response()->json(['message' => 'Course purged successfully']);
    }

    // Unified operational monitoring stats aggregation endpoint
    public function globalStats()
    {
        $totalCompletedRows = DB::table('course_user')->where('status', 'completed')->count();
        $uniqueGraduatedUsers = DB::table('course_user')->where('status', 'completed')->distinct('user_id')->count('user_id');

        return response()->json([
            'total_course_completions' => $totalCompletedRows,
            'unique_graduated_users' => $uniqueGraduatedUsers,
            'total_courses_hosted' => Course::count()
        ]);
    }
}
