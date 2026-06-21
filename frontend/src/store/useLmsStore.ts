import { create } from "zustand";
import { getCourses, getCourse, getLesson } from "../api";
import type { Course, Lesson } from "@/types";

interface LmsState {
  courses: Course[];
  activeCourse: Course | null;
  activeLesson: Lesson | null;
  isLoadingLms: boolean;

  fetchCoursesList: () => Promise<void>;
  fetchSingleCourse: (id: string) => Promise<void>;
  fetchSingleLesson: (courseId: string, lessonId: string) => Promise<void>;
}

export const useLmsStore = create<LmsState>((set) => ({
  courses: [],
  activeCourse: null,
  activeLesson: null,
  isLoadingLms: false,

  fetchCoursesList: async () => {
    set({ isLoadingLms: true });
    try {
      const res = await getCourses();
      set({ courses: res.data.courses });
    } catch (err) {
      console.error("Failed to fetch courses:", err);
    } finally {
      set({ isLoadingLms: false });
    }
  },

  fetchSingleCourse: async (id: string) => {
    set({ isLoadingLms: true });
    try {
      const res = await getCourse(id);
      set({ activeCourse: res.data.course });
    } catch (err) {
      console.error("Failed to fetch course:", err);
    } finally {
      set({ isLoadingLms: false });
    }
  },

  fetchSingleLesson: async (courseId: string, lessonId: string) => {
    set({ isLoadingLms: true, activeLesson: null });
    try {
      const res = await getLesson(courseId, lessonId);
      set({ activeLesson: res.data.lesson });
    } catch (err) {
      console.error("Failed to fetch lesson:", err);
    } finally {
      set({ isLoadingLms: false });
    }
  },
}));