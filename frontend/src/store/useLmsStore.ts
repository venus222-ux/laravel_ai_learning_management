import { create } from "zustand";
import { getCourses, getCourse, getLesson } from "../api";
import type { LmsState } from "@/types";


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

 fetchSingleCourse: async (id: string | number) => {
  set({ isLoadingLms: true });

  try {
    const res = await getCourse(String(id));
    set({ activeCourse: res.data.course });
  } catch (err) {
    console.error("Failed to fetch course:", err);
  } finally {
    set({ isLoadingLms: false });
  }
},

fetchSingleLesson: async (
  courseId: string | number,
  lessonId: string | number
) => {
  set({ isLoadingLms: true, activeLesson: null });

  try {
    const res = await getLesson(
      String(courseId),
      String(lessonId)
    );

    set({ activeLesson: res.data.lesson });
  } catch (err) {
    console.error("Failed to fetch lesson:", err);
  } finally {
    set({ isLoadingLms: false });
  }
},
}));