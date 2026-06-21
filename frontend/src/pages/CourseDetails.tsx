import { useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { useStore } from "../store/useStore";

export default function CourseDetails() {
  const { courseId } = useParams();
  const { activeCourse, isLoadingLms, fetchSingleCourse } = useStore();

  useEffect(() => {
    if (courseId) fetchSingleCourse(courseId);
  }, [courseId, fetchSingleCourse]);

  if (isLoadingLms || !activeCourse) return <div>Loading syllabus...</div>;

  return (
    <div style={{ padding: "2rem", maxWidth: "800px", margin: "0 auto" }}>
      <Link to="/courses">← Back to Catalog</Link>
      <h1 style={{ marginTop: "1rem" }}>{activeCourse.title}</h1>
      <p>{activeCourse.description}</p>

      <h3 style={{ marginTop: "2rem", borderBottom: "1px solid #ccc", paddingBottom: "0.5rem" }}>Syllabus</h3>
      <ul style={{ listStyleType: "none", padding: 0 }}>
        {activeCourse.lessons?.map((lesson) => (
          <li key={lesson.id} style={{ margin: "1rem 0", padding: "1rem", background: "#f9f9f9", borderRadius: "6px" }}>
            <strong>{lesson.order}. {lesson.title}</strong>
            <br />
            <Link to={`/courses/${activeCourse.id}/lessons/${lesson.id}`} style={{ color: "#007bff", textDecoration: "none", display: "inline-block", marginTop: "0.5rem" }}>
              Start Lesson →
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}