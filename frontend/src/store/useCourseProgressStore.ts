import { create } from "zustand";
import { persist } from "zustand/middleware";

interface CourseProgressState {
  // last lesson user opened per course
  lastLessonByCourse: Record<string, number>;

  // completed lessons per course
  completedLessonsByCourse: Record<string, number[]>;

  setLastLesson: (courseId: number, lessonId: number) => void;

  markLessonCompleted: (courseId: number, lessonId: number) => void;

  isLessonCompleted: (courseId: number, lessonId: number) => boolean;

  getLastLesson: (courseId: number) => number | null;
}

export const useCourseProgressStore = create<CourseProgressState>()(
  persist(
    (set, get) => ({
      lastLessonByCourse: {},
      completedLessonsByCourse: {},

      setLastLesson: (courseId, lessonId) =>
        set((state) => ({
          lastLessonByCourse: {
            ...state.lastLessonByCourse,
            [courseId]: lessonId,
          },
        })),

      markLessonCompleted: (courseId, lessonId) =>
        set((state) => {
          const existing = state.completedLessonsByCourse[courseId] || [];

          if (existing.includes(lessonId)) return state;

          return {
            completedLessonsByCourse: {
              ...state.completedLessonsByCourse,
              [courseId]: [...existing, lessonId],
            },
          };
        }),

      isLessonCompleted: (courseId, lessonId) => {
        return (
          get().completedLessonsByCourse[courseId]?.includes(lessonId) ||
          false
        );
      },

      getLastLesson: (courseId) => {
        return get().lastLessonByCourse[courseId] ?? null;
      },
    }),
    {
      name: "lms-progress-storage",
    }
  )
);