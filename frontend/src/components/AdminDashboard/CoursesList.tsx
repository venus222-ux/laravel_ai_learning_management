import { deleteAdminCourse } from "../../api";
import styles from "../../styles/AdminDashboard.module.css";
import type { Course } from "@/types";

interface CoursesListProps {
  courses: Course[];
  isLoading: boolean;
  selectedCourseId?: number;
  onEditCourse: (course: Course) => void;
  onManageLessons: (course: Course) => void;
  onCourseDeleted: (id: number) => void;
}

export default function CoursesList({ 
  courses, isLoading, selectedCourseId, onEditCourse, onManageLessons, onCourseDeleted 
}: CoursesListProps) {

  const handleDeleteCourse = async (id: number) => {
    if (!window.confirm("Purge course data? This action is absolute.")) return;
    try {
      await deleteAdminCourse(id);
      onCourseDeleted(id);
    } catch (err: any) {
      alert(err.response?.data?.message || "Purge execution failed");
    }
  };

  if (isLoading) {
    return <div className={styles.loadingContainer}>Streaming pipeline analytics...</div>;
  }

  return (
    <div className={styles.tableWrapper}>
      <table className={styles.adminTable}>
        <thead>
          <tr>
            <th>Target Title</th>
            <th>Structural Node</th>
            <th>Modules Count</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {courses.map((course) => (
            <tr key={course.id} style={{ backgroundColor: selectedCourseId === course.id ? "#f3f4f6" : "transparent" }}>
              <td style={{ fontWeight: 600 }}>{course.title}</td>
              <td>{course.category?.name || <em style={{ color: "#9ca3af" }}>Standalone Layout</em>}</td>
              <td>
                <button 
                  onClick={() => onManageLessons(course)}
                  className={styles.editBtn} 
                  style={{ padding: "2px 8px", backgroundColor: "#eff6ff", color: "#2563eb" }}
                >
                  📚 {course.lessons_count ?? 0} modules (Manage)
                </button>
              </td>
              <td>
                <div className={styles.tableActions}>
                  <button onClick={() => onEditCourse(course)} className={styles.editBtn}>Edit</button>
                  <button onClick={() => handleDeleteCourse(course.id)} className={styles.deleteBtn}>Purge</button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}