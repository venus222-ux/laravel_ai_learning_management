import { Link } from "react-router-dom";
import type { Course } from "../types";
// Corrected import path: Ensure this file exists in your project
import styles from "../styles/CourseCard.module.css"; 

interface CourseCardProps {
  course: Course;
  onEnroll: (id: number) => void;
  progress?: number;
}

export default function CourseCard({ course, onEnroll, progress = 0 }: CourseCardProps) {
  const isCompleted = progress === 100;

  return (
    <div className={styles.courseCard}>
      <div className={styles.cardHeader}>
        <div className={styles.titleWrapper}>
          <h3>{course.title}</h3>
          {isCompleted && <span className={styles.completedBadge}>🏆 Completed</span>}
        </div>
        
        {course.category && (
          <span className={styles.categoryBadge}>
            {course.category.name}
          </span>
        )}
        
        <p className={styles.description}>{course.description}</p>
      </div>

      <div className={styles.cardMeta}>
        <div className={styles.metaTop}>
          <span className={styles.lessonIndicator}>
            {course.lessons_count !== undefined ? `${course.lessons_count} Modules` : "Track Available"}
          </span>
          <span className={styles.progressText}>
            {progress}% Complete
          </span>
        </div>
        
        <div className={styles.progressContainer}>
          <div className={styles.progressBarBg}>
            <div
              className={`${styles.progressBarFill} ${isCompleted ? styles.completedFill : ""}`}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <div className={styles.actionRow}>
          <Link 
            to={`/courses/${course.id}`} 
            state={{ course }} 
            className={styles.viewButton}
          >
            Open Workspace
          </Link>
          <button
            onClick={() => onEnroll(course.id)}
            className={styles.enrollButton}
          >
            Quick Enroll
          </button>
        </div>
      </div>
    </div>
  );
}