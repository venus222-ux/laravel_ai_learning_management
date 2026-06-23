import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useLmsStore } from "../store/useLmsStore";
import API, { enrollCourse } from "../api";
import type { Course } from "../types";
import CourseCard from "../components/CourseCard";
import styles from "../styles/CourseCatalog.module.css";

export default function CourseCatalog() {
  const { courses, isLoadingLms, fetchCoursesList } = useLmsStore();
  const [suggestions, setSuggestions] = useState<Course[]>([]);
  const [completedMap, setCompletedMap] = useState<Record<number, number[]>>({});

  useEffect(() => {
    fetchCoursesList();
  }, [fetchCoursesList]);

  useEffect(() => {
    API.get("/suggestions")
      .then((res) => setSuggestions(res.data.recommendations))
      .catch((err) =>
        console.error("Could not load dynamic recommendations.", err)
      );
  }, []);

  useEffect(() => {
    if (!courses.length) return;

    const fetchAll = async () => {
      try {
        const results = await Promise.all(
          courses.map((course) =>
            API.get(`/courses/${course.id}/completed-lessons`)
              .then((res) => ({
                courseId: course.id,
                lessons: res.data.completed_lessons || [],
              }))
              .catch(() => ({
                courseId: course.id,
                lessons: [],
              }))
          )
        );

        const map: Record<number, number[]> = {};
        results.forEach((r) => {
          map[r.courseId] = r.lessons;
        });

        setCompletedMap(map);
      } catch (err) {
        console.error(err);
      }
    };

    fetchAll();
  }, [courses]);

  const handleEnroll = async (id: number) => {
    try {
      await enrollCourse(id);
      alert("Enrolled successfully!");
    } catch (err) {
      console.error(err);
      alert("Failed to enroll.");
    }
  };

  const getProgress = (course: Course) => {
    const completed = completedMap[course.id] || [];
    const total = course.lessons_count || 1;
    return Math.round((completed.length / total) * 100);
  };

  if (isLoadingLms && courses.length === 0) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
        <p>Syncing Workspace...</p>
      </div>
    );
  }

  return (
    <div className={styles.catalogWrapper}>
      <header className={styles.catalogHeader}>
        <div className={styles.headerTag}>LMS PLATFORM</div>
        <h2>Course Catalog</h2>
        <p>Select an engineered track below to begin context-driven learning modules.</p>
      </header>

      {/* ================= RECOMMENDATIONS ================= */}
      {suggestions.length > 0 && (
        <section className={styles.recommendationPanel}>
          <div className={styles.panelTitleRow}>
            <span className={styles.pulseDot}></span>
            <h3>Dynamic Recommendations</h3>
          </div>
          <div className={styles.recommendationGrid}>
            {suggestions.map((course) => (
              <div key={course.id} className={styles.recCard}>
                <div>
                  <h4>{course.title}</h4>
                  {course.description && <p>{course.description}</p>}
                </div>
                <Link to={`/courses/${course.id}`} state={{ course }} className={styles.exploreLink}>
                  Explore Track <span>→</span>
                </Link>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ================= COURSES ================= */}
      <main className={styles.courseGrid}>
        {courses.map((course) => (
          <CourseCard
            key={course.id}
            course={course}
            progress={getProgress(course)}
            onEnroll={handleEnroll}
          />
        ))}
      </main>
    </div>
  );
}