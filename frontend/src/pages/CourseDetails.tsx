import { useEffect, useState } from "react";
import { useParams, Link, useLocation } from "react-router-dom";
import { useLmsStore } from "../store/useLmsStore";
import API, { enrollCourse } from "../api";
import type { Course } from "../types";
import styles from "../styles/CourseDetails.module.css";
import catalogStyles from "../styles/CourseCatalog.module.css";

export default function CourseDetails() {
  const { courseId } = useParams();
  const location = useLocation();
  const { activeCourse, isLoadingLms, fetchSingleCourse } = useLmsStore();
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [completedLessons, setCompletedLessons] = useState<number[]>([]);

  const routerStateCourse = location.state?.course as Course | undefined;
  const courseData = activeCourse || routerStateCourse;

  useEffect(() => {
    if (!courseId) return;
    fetchSingleCourse(courseId);
    API.get(`/courses/${courseId}/completed-lessons`)
      .then((res) => setCompletedLessons(res.data.completed_lessons || []))
      .catch((err) => console.error(err));
  }, [courseId, fetchSingleCourse]);

  const handleEnroll = async () => {
    if (!courseId) return;
    setIsEnrolling(true);
    try {
      await enrollCourse(Number(courseId));
      await fetchSingleCourse(courseId);
      const res = await API.get(`/courses/${courseId}/completed-lessons`);
      setCompletedLessons(res.data.completed_lessons || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsEnrolling(false);
    }
  };

  const progress = courseData ? Math.round((completedLessons.length / (courseData.lessons?.length || 1)) * 100) : 0;
  const isCourseCompleted = progress === 100;

  if (!courseData && isLoadingLms) return <div className={styles.loader}>Syncing Course Data...</div>;
  if (!courseData) return <div className={styles.loader}>Course not found.</div>;

  return (
    <div className={styles.detailsWrapper}>
      <Link to="/courses" className={styles.backLink}>← Back to Catalog</Link>

      <header className={styles.heroSection}>
        <div className={styles.headerContent}>
          <h1>{courseData.title}</h1>
          <p>{courseData.description}</p>
          <button onClick={handleEnroll} disabled={isEnrolling} className={styles.enrollBtn}>
            {isEnrolling ? "Processing..." : "Enroll in Track"}
          </button>
        </div>
      </header>

      <section className={styles.progressSection}>
        <div className={styles.metaTop}>
          <span>Course Completion</span>
          <span className={styles.progressText}>{progress}%</span>
        </div>
        <div className={catalogStyles.progressBarBg}>
          <div className={`${catalogStyles.progressBarFill} ${isCourseCompleted ? catalogStyles.completedFill : ""}`} style={{ width: `${progress}%` }} />
        </div>
      </section>

      <section className={styles.lessonsSection}>
        <h3>Modules</h3>
        {courseData.lessons?.map((section) => {
          const completed = completedLessons.includes(section.id);
          return (
            <div key={section.id} className={`${styles.lessonCard} ${completed ? styles.completed : ""}`}>
              <div>
                <span className={styles.sectionOrder}>Module {section.order}</span>
                <h4>{section.title}</h4>
              </div>
              <Link to={`/courses/${courseData.id}/lessons/${section.id}`} className={styles.startBtn}>
                {completed ? "Review" : "Start Module"} →
              </Link>
            </div>
          );
        })}
      </section>
    </div>
  );
}