import { Link } from "react-router-dom";
import styles from "../../styles/LessonViewer.module.css";

interface CourseSidebarProps {
  courseId: string | undefined;
  activeCourse: any;
  lessonId: string | undefined;
  completedLessons: number[];
}

export default function CourseSidebar({ courseId, activeCourse, lessonId, completedLessons }: CourseSidebarProps) {
  return (
    <aside className={styles.sidebar}>
      <div className="p-4 border-bottom">
        <Link to={`/courses/${courseId}`} className="btn btn-sm btn-light border text-secondary fw-medium px-3 rounded-pill">
          ← Back to Course
        </Link>
        <h5 className="mt-3 fw-bold text-dark" style={{ fontSize: "0.95rem", lineHeight: "1.3", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
          {activeCourse?.title || "Course Modules"}
        </h5>
      </div>

      <div className={`p-3 flex-grow-1 overflow-auto ${styles.customScroll}`}>
        <div className="nav flex-column gap-1">
          {activeCourse?.lessons?.map((lesson: any, idx: number) => {
            const isActive = Number(lessonId) === lesson.id;
            const completed = completedLessons.includes(lesson.id);

            return (
              <Link
                key={lesson.id}
                to={`/courses/${courseId}/lessons/${lesson.id}`}
                className={`nav-link d-flex align-items-center justify-content-between py-2 px-3 rounded-3 ${
                  isActive 
                    ? "bg-dark text-white fw-medium shadow-sm" 
                    : completed 
                    ? "text-success bg-success-subtle bg-opacity-25" 
                    : "text-secondary hover-bg-light"
                }`}
                style={{ fontSize: "0.925rem" }}
              >
                <div className="d-flex align-items-center text-truncate">
                  <span className="text-muted me-2 small fw-mono">
                    {String(idx + 1).padStart(2, "0")}
                  </span>
                  <span className="text-truncate">{lesson.title}</span>
                </div>
                {completed && <span className="text-success fw-bold ms-2">✓</span>}
              </Link>
            );
          })}
        </div>
      </div>
    </aside>
  );
}