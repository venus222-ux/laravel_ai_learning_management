import { useEffect } from "react";
import { Link } from "react-router-dom";
import { useLmsStore } from "../store/useLmsStore";
import { enrollCourse } from "../api";

export default function CourseCatalog() {
  const { courses, isLoadingLms, fetchCoursesList } = useLmsStore();

  useEffect(() => {
    fetchCoursesList();
  }, [fetchCoursesList]);

  const handleEnroll = async (id: string) => {
    try {
      await enrollCourse(id);
      alert("Enrolled successfully!");
    } catch (err) {
      console.error(err);
      alert("Failed to enroll.");
    }
  };

  if (isLoadingLms && courses.length === 0)
    return <div>Loading courses...</div>;

  return (
    <div style={{ padding: "2rem" }}>
      <h2>Course Catalog</h2>

      <div
        style={{
          display: "grid",
          gap: "1rem",
          gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
        }}
      >
        {courses.map((course) => (
          <div
            key={course.id}
            style={{
              border: "1px solid #ccc",
              padding: "1rem",
              borderRadius: "8px",
            }}
          >
            <h3>{course.title}</h3>
            <p>{course.description}</p>
            <p>
              <small>{course.lessons_count} Lessons</small>
            </p>

            <div style={{ display: "flex", gap: "10px", marginTop: "1rem" }}>
              <Link
                to={`/courses/${course.id}`}
                style={{
                  padding: "0.5rem 1rem",
                  background: "#007bff",
                  color: "white",
                  textDecoration: "none",
                  borderRadius: "4px",
                }}
              >
                View Course
              </Link>

              <button
                onClick={() => handleEnroll(course.id)}
                style={{ padding: "0.5rem 1rem", cursor: "pointer" }}
              >
                Quick Enroll
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}