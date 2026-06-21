import { useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { useLmsStore } from "../store/useLmsStore";

export default function LessonViewer() {
  const { courseId, lessonId } = useParams();
  const { activeLesson, isLoadingLms, fetchSingleLesson } = useLmsStore();

  useEffect(() => {
    if (courseId && lessonId) fetchSingleLesson(courseId, lessonId);
  }, [courseId, lessonId, fetchSingleLesson]);

  if (isLoadingLms || !activeLesson) return <div>Loading lesson content...</div>;

  return (
    <div style={{ display: "flex", maxWidth: "1200px", margin: "0 auto", padding: "2rem", gap: "2rem" }}>
      
      {/* Left Column: Lesson Content */}
      <div style={{ flex: 2 }}>
        <Link to={`/courses/${courseId}`}>← Back to Syllabus</Link>
        <h1 style={{ marginTop: "1rem" }}>{activeLesson.title}</h1>
        
        {/* Render HTML content securely (assuming backend sterilizes, or just text for MVP) */}
        <div 
          style={{ marginTop: "2rem", lineHeight: "1.6", fontSize: "1.1rem" }}
          dangerouslySetInnerHTML={{ __html: activeLesson.content || "<p>No content provided.</p>" }} 
        />
      </div>

      {/* Right Column: AI Assistant Toolbox (Day 4 Placeholder) */}
      <div style={{ flex: 1, padding: "1.5rem", background: "#f4f4f5", borderRadius: "8px", height: "fit-content" }}>
        <h3>✨ AI Learning Assistant</h3>
        <p style={{ fontSize: "0.9rem", color: "#555" }}>Stuck on this lesson? Let AI help you understand it better.</p>
        
        <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "1.5rem" }}>
          <button style={{ padding: "0.75rem", background: "#6366f1", color: "white", border: "none", borderRadius: "6px", cursor: "pointer" }}>
            Summarize Lesson
          </button>
          <button style={{ padding: "0.75rem", background: "#ec4899", color: "white", border: "none", borderRadius: "6px", cursor: "pointer" }}>
            Generate Practice Quiz
          </button>
          <button style={{ padding: "0.75rem", background: "#10b981", color: "white", border: "none", borderRadius: "6px", cursor: "pointer" }}>
            Explain Like I'm 5
          </button>
        </div>

        {/* Placeholder for AI Results */}
        <div style={{ marginTop: "2rem", padding: "1rem", background: "white", borderRadius: "6px", border: "1px dashed #ccc" }}>
          <p style={{ margin: 0, color: "#888", textAlign: "center", fontSize: "0.9rem" }}>AI results will appear here...</p>
        </div>
      </div>
      
    </div>
  );
}