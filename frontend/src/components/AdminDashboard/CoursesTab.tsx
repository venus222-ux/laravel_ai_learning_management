import { useEffect, useState, lazy, Suspense } from "react";
import { getAdminCourses, getAdminCategories } from "../../api";
import styles from "../../styles/AdminDashboard.module.css";
import type { Course, Category } from "@/types";

// Lazy Load the heavy components
const CourseForm = lazy(() => import("./CourseForm"));
const CoursesList = lazy(() => import("./CoursesList"));
const LessonsPanel = lazy(() => import("./LessonsPanel"));

export default function CoursesTab() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [courseToEdit, setCourseToEdit] = useState<Course | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [coursesRes, categoriesRes] = await Promise.all([
        getAdminCourses(),
        getAdminCategories(),
      ]);
      setCourses(coursesRes.data);
      setCategories(categoriesRes.data);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.tabFadeIn}>
      <header className={styles.header}>
        <h2>LMS Curriculum Workspace</h2>
        <p className={styles.subtitle}>Configure learning modules structure, course paths, and engine variables</p>
      </header>

      <div style={{ display: "grid", gridTemplateColumns: selectedCourse ? "1fr 1fr" : "1fr", gap: "24px" }}>
        
        {/* LEFT COLUMN */}
        <div>
          <Suspense fallback={<div className={styles.loadingContainer}>Loading editor...</div>}>
            <CourseForm 
              categories={categories} 
              courseToEdit={courseToEdit} 
              onSuccess={() => { setCourseToEdit(null); fetchData(); }}
              onCancel={() => setCourseToEdit(null)}
            />
          </Suspense>

          <Suspense fallback={<div className={styles.loadingContainer}>Streaming pipeline analytics...</div>}>
            <CoursesList 
              courses={courses}
              isLoading={isLoading}
              selectedCourseId={selectedCourse?.id}
              onEditCourse={setCourseToEdit}
              onManageLessons={setSelectedCourse}
              onCourseDeleted={(deletedId) => {
                if (selectedCourse?.id === deletedId) setSelectedCourse(null);
                setCourses(prev => prev.filter(c => c.id !== deletedId));
              }}
            />
          </Suspense>
        </div>

        {/* RIGHT COLUMN */}
        {selectedCourse && (
          <div style={{ borderLeft: "1px dashed #e5e7eb", paddingLeft: "24px" }}>
            <Suspense fallback={<div className={styles.loadingContainer}>Initializing modules...</div>}>
              <LessonsPanel 
                course={selectedCourse} 
                onClose={() => setSelectedCourse(null)} 
                onLessonsChanged={fetchData} // Sync parent course module count
              />
            </Suspense>
          </div>
        )}

      </div>
    </div>
  );
}