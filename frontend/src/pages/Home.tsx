import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useLmsStore } from "../store/useLmsStore";
import API, { enrollCourse } from "../api";
import type { Course } from "../types";
import CourseCard from "../components/CourseCard";
import styles from "../styles/CourseCatalog.module.css"; // Reuse your established styles

export default function Home() {
  const { courses, isLoadingLms, fetchCoursesList } = useLmsStore();
  const [recommendations, setRecommendations] = useState<Course[]>([]);

  useEffect(() => {
    fetchCoursesList();
    API.get("/suggestions")
      .then((res) => setRecommendations(res.data.recommendations))
      .catch((err) => console.error("Could not load recommendations.", err));
  }, [fetchCoursesList]);

  const handleQuickEnroll = async (courseId: number) => {
    try {
      await enrollCourse(courseId);
      alert("Enrolled successfully! Head to your Dashboard to start.");
    } catch (err) {
      console.error(err);
      alert("Failed to enroll.");
    }
  };

  if (isLoadingLms && courses.length === 0) {
    return <div className={styles.loadingContainer}>Syncing Workspace...</div>;
  }

  const newCourses = [...courses].reverse().slice(0, 4);
  const mostViewed = courses.slice(0, 4);

  return (
    <div className={styles.catalogWrapper}>
      <header className={styles.catalogHeader} style={{ textAlign: "center" }}>
        <div className={styles.headerTag}>AI-POWERED EDUCATION</div>
        <h2>Welcome to the Learning Platform</h2>
        <p>Your personalized path: Browse, Enroll, Learn, and Master.</p>
      </header>

      {/* RECOMMENDED COURSES */}
      {recommendations.length > 0 && (
        <section style={{ marginBottom: "4rem" }}>
          <h3 style={{ marginBottom: "1.5rem" }}>🎯 Recommended For You</h3>
          <div className={styles.courseGrid}>
            {recommendations.map((course) => (
              <CourseCard key={`rec-${course.id}`} course={course} onEnroll={handleQuickEnroll} />
            ))}
          </div>
        </section>
      )}

      {/* NEW COURSES */}
      <section style={{ marginBottom: "4rem" }}>
        <h3 style={{ marginBottom: "1.5rem" }}>🚀 New Arrivals</h3>
        <div className={styles.courseGrid}>
          {newCourses.map((course) => (
            <CourseCard key={`new-${course.id}`} course={course} onEnroll={handleQuickEnroll} />
          ))}
        </div>
      </section>

      {/* MOST VIEWED */}
      <section style={{ marginBottom: "4rem" }}>
        <h3 style={{ marginBottom: "1.5rem" }}>🔥 Popular Tracks</h3>
        <div className={styles.courseGrid}>
          {mostViewed.map((course) => (
            <CourseCard key={`view-${course.id}`} course={course} onEnroll={handleQuickEnroll} />
          ))}
        </div>
      </section>

      <div style={{ textAlign: "center", marginTop: "2rem" }}>
        <Link to="/courses" className={styles.viewButton} style={{ display: "inline-block", width: "auto" }}>
          View All Courses
        </Link>
      </div>
    </div>
  );
}