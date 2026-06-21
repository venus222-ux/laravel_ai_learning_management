import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useLmsStore } from "../store/useLmsStore";
import { triggerLessonAi } from "../api";
import { getEcho } from "../utils/echo";

export default function LessonViewer() {
  const { courseId, lessonId } = useParams();
  const { activeLesson, isLoadingLms, fetchSingleLesson } = useLmsStore();
  
  // Local state for the AI Assistant
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState<string | null>(null);
  const [activeTask, setActiveTask] = useState<string | null>(null);

  // Fetch the lesson content on mount
  useEffect(() => {
    if (courseId && lessonId) {
      fetchSingleLesson(courseId, lessonId);
      setAiResult(null); // Reset AI panel on new lesson
    }
  }, [courseId, lessonId, fetchSingleLesson]);

  // Listen for the WebSocket broadcast when the background job finishes
  useEffect(() => {
    // Assuming your token decoding or state provides the user's ID
    // Hardcoded to 1 for example purposes if user ID isn't in state yet
    const userId = 1; 

    const echo = getEcho();
    const channel = echo.private(`user.${userId}`);

    channel.listen('.ai.completed', (data: { type: string; data: string }) => {
      setAiResult(data.data);
      setAiLoading(false);
      setActiveTask(null);
    });

    return () => {
      channel.stopListening('.ai.completed');
      echo.leave(`user.${userId}`);
    };
  }, []);

  const handleAiAction = async (type: "summary" | "quiz" | "explain") => {
    setAiLoading(true);
    setActiveTask(type);
    setAiResult(null);
    
    try {
      // This utilizes your existing Axios interceptors automatically!
      await triggerLessonAi(courseId!, lessonId!, type);
      // We don't set the result here—we wait for the WebSocket event!
    } catch (err) {
      console.error("AI trigger failed", err);
      setAiResult("Failed to contact the AI server. Please try again.");
      setAiLoading(false);
      setActiveTask(null);
    }
  };

  if (isLoadingLms || !activeLesson) return <div>Loading lesson content...</div>;

  return (
    <div style={{ display: "flex", maxWidth: "1200px", margin: "0 auto", padding: "2rem", gap: "2rem" }}>
      
      {/* Left Column: Lesson Content */}
      <div style={{ flex: 2 }}>
        <Link to={`/courses/${courseId}`}>← Back to Syllabus</Link>
        <h1 style={{ marginTop: "1rem" }}>{activeLesson.title}</h1>
        
        <div 
          style={{ marginTop: "2rem", lineHeight: "1.6", fontSize: "1.1rem" }}
          dangerouslySetInnerHTML={{ __html: activeLesson.content || "<p>No content provided.</p>" }} 
        />
      </div>

      {/* Right Column: AI Assistant Toolbox */}
      <div style={{ flex: 1, padding: "1.5rem", background: "#f4f4f5", borderRadius: "8px", height: "fit-content", position: "sticky", top: "2rem" }}>
        <h3>✨ AI Learning Assistant</h3>
        <p style={{ fontSize: "0.9rem", color: "#555" }}>Stuck on this lesson? Let AI help you understand it better.</p>
        
        <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "1.5rem" }}>
          <button 
            disabled={aiLoading}
            onClick={() => handleAiAction("summary")}
            style={{ padding: "0.75rem", background: "#6366f1", color: "white", border: "none", borderRadius: "6px", cursor: aiLoading ? "not-allowed" : "pointer", opacity: aiLoading && activeTask !== "summary" ? 0.5 : 1 }}
          >
            {aiLoading && activeTask === "summary" ? "⏳ Summarizing..." : "Summarize Lesson"}
          </button>
          <button 
            disabled={aiLoading}
            onClick={() => handleAiAction("quiz")}
            style={{ padding: "0.75rem", background: "#ec4899", color: "white", border: "none", borderRadius: "6px", cursor: aiLoading ? "not-allowed" : "pointer", opacity: aiLoading && activeTask !== "quiz" ? 0.5 : 1 }}
          >
             {aiLoading && activeTask === "quiz" ? "⏳ Generating..." : "Generate Practice Quiz"}
          </button>
          <button 
             disabled={aiLoading}
             onClick={() => handleAiAction("explain")}
             style={{ padding: "0.75rem", background: "#10b981", color: "white", border: "none", borderRadius: "6px", cursor: aiLoading ? "not-allowed" : "pointer", opacity: aiLoading && activeTask !== "explain" ? 0.5 : 1 }}
          >
             {aiLoading && activeTask === "explain" ? "⏳ Thinking..." : "Explain Like I'm 5"}
          </button>
        </div>

        {/* AI Results Display */}
        <div style={{ marginTop: "2rem", padding: "1rem", background: "white", borderRadius: "6px", border: "1px dashed #ccc", minHeight: "150px" }}>
          {aiLoading ? (
            <div style={{ color: "#888", textAlign: "center", fontStyle: "italic", marginTop: "2rem" }}>
               Sending request to background queue... waiting for AI.
            </div>
          ) : aiResult ? (
            <div 
               style={{ fontSize: "0.95rem", whiteSpace: "pre-wrap" }}
               // If your AI returns markdown, you might want to use a library like react-markdown here later!
            >
              {aiResult}
            </div>
          ) : (
            <p style={{ margin: 0, color: "#888", textAlign: "center", fontSize: "0.9rem", marginTop: "2rem" }}>
              Select a tool above to begin.
            </p>
          )}
        </div>
      </div>
      
    </div>
  );
}