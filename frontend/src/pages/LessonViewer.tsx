import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useLmsStore } from "../store/useLmsStore";
import { triggerLessonAi } from "../api";
import { getEcho } from "../utils/echo";
import DOMPurify from "dompurify";
import { useStore } from "../store/useStore";
import API from "../api";
import styles from "../styles/LessonViewer.module.css";
import confetti from 'canvas-confetti';
interface QuizQuestion {
  question: string;
  options: string[];
  answer: string;
}

export default function LessonViewer() {
  const { courseId, lessonId } = useParams();
  const {
    activeLesson,
    activeCourse,
    isLoadingLms,
    fetchSingleLesson,
    fetchSingleCourse,
  } = useLmsStore();

  const [certificateUrl, setCertificateUrl] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState<string | null>(null);
  const [parsedQuiz, setParsedQuiz] = useState<QuizQuestion[] | null>(null);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>({});
  const [quizScore, setQuizScore] = useState<number | null>(null);
  const [activeTask, setActiveTask] = useState<string | null>(null);
  const [progressMessage, setProgressMessage] = useState<string | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);
  const [completedLessons, setCompletedLessons] = useState<number[]>([]);

  const user = useStore((state) => state.user);

  useEffect(() => {
    if (courseId) fetchSingleCourse(courseId);
  }, [courseId, fetchSingleCourse]);

  useEffect(() => {
    if (courseId && lessonId) {
      fetchSingleLesson(courseId, lessonId);
      setAiResult(null);
      setParsedQuiz(null);
      setQuizScore(null);
      setSelectedAnswers({});
      setProgressMessage(null);
    }
  }, [courseId, lessonId, fetchSingleLesson]);

  useEffect(() => {
    if (!courseId) return;
    API.get(`/courses/${courseId}/completed-lessons`)
      .then((res) => setCompletedLessons(res.data.completed_lessons || []))
      .catch(console.error);
  }, [courseId]);

  useEffect(() => {
    if (!user?.id) return;
    const echo = getEcho();
    const channel = echo.private(`user.${user.id}`);

    channel.listen(".ai.completed", (data: { type: string; data: string }) => {
      setAiResult(data.data);
      setAiLoading(false);
      if (data.type === "quiz") {
        try {
          const clean = data.data.replace(/```json/g, "").replace(/```/g, "").trim();
          setParsedQuiz(JSON.parse(clean));
        } catch (e) {
          console.error("Quiz parse error", e);
        }
      }
      setActiveTask(null);
    });

    return () => {
      channel.stopListening(".ai.completed");
      echo.leave(`user.${user.id}`);
    };
  }, [user?.id]);

  useEffect(() => {
    if (progressMessage?.includes("certificate")) {
      API.get(`/certificates/${courseId}`)
        .then((res) => setCertificateUrl(res.data.file_path))
        .catch(() => {});
    }
  }, [progressMessage, courseId]);

  const handleAiAction = async (type: "summary" | "quiz" | "explain") => {
    setAiLoading(true);
    setActiveTask(type);
    setAiResult(null);
    setParsedQuiz(null);
    setQuizScore(null);
    try {
      await triggerLessonAi(courseId!, lessonId!, type);
    } catch {
      setAiLoading(false);
      setActiveTask(null);
      setAiResult("AI service failed.");
    }
  };

  const fireConfetti = () => {
  const end = Date.now() + 3 * 1000;
  const colors = ['#2563eb', '#10b981', '#f59e0b'];

  (function frame() {
    confetti({
      particleCount: 5,
      angle: 60,
      spread: 55,
      origin: { x: 0 },
      colors: colors,
      zIndex: 9999 // Ensure it's on top of all modal layers
    });
    confetti({
      particleCount: 5,
      angle: 120,
      spread: 55,
      origin: { x: 1 },
      colors: colors,
      zIndex: 9999
    });

    if (Date.now() < end) {
      requestAnimationFrame(frame);
    }
  })();
};

const handleMarkAsComplete = async () => {
    try {
      const res = await API.post(`/courses/${courseId}/lessons/${lessonId}/complete`);
      setCompletedLessons(res.data.completed_lessons || []);
      
      if (res.data.course_completed) {
        setProgressMessage("🏆 Congratulations! You finished the course!");
        setShowCelebration(true);
        
        // --- Call it here ---
        fireConfetti(); 

        API.get(`/certificates/${courseId}`)
          .then((res) => setCertificateUrl(res.data.file_path))
          .catch(() => {});
      } else {
        setProgressMessage(`Lesson completed! Progress: ${res.data.progress_percent}%`);
      }
    } catch (err) {
      console.error("Completion error:", err);
    }
  };

  const evaluateQuiz = () => {
    if (!parsedQuiz) return;
    let score = 0;
    parsedQuiz.forEach((q, i) => {
      if (selectedAnswers[i] === q.answer) score++;
    });
    setQuizScore(score);
  };

  const isLessonCompleted = completedLessons.includes(Number(lessonId));
  const isCourseCompleted = activeCourse?.lessons && completedLessons.length === activeCourse.lessons.length;

  if (isLoadingLms || !activeLesson) {
    return (
      <div className="d-flex justify-content-center align-items-center min-vh-100 bg-white">
        <div className="spinner-border text-primary" style={{ width: '3rem', height: '3rem' }} role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.workspaceContainer}>
      
      {/* 1. FLUID SIDEBAR PANEL */}
      <aside className={styles.sidebar}>
        <div className="p-4 border-bottom">
          <Link to={`/courses/${courseId}`} className="btn btn-sm btn-light border text-secondary fw-medium px-3 rounded-pill">
            ← Back to Course
          </Link>
<h5
  className="mt-3 fw-bold text-dark"
  style={{
    fontSize: "0.95rem",
    lineHeight: "1.3",
    display: "-webkit-box",
    WebkitLineClamp: 2,
    WebkitBoxOrient: "vertical",
    overflow: "hidden",
  }}
>
  {activeCourse?.title || "Course Modules"}
</h5>        </div>

        <div className={`p-3 flex-grow-1 overflow-auto ${styles.customScroll}`}>
          <div className="nav flex-column gap-1">
            {activeCourse?.lessons?.map((lesson, idx) => {
              const isActive = Number(lessonId) === lesson.id;
              const completed = completedLessons.includes(lesson.id);

              return (
                <Link
                  key={lesson.id}
                  to={`/courses/${courseId}/lessons/${lesson.id}`}
                   className={`nav-link d-flex align-items-center justify-content-between py-2 px-3 rounded-3 ${                    isActive 
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

      {/* 2. CORE READING WORKSPACE */}
      <div className={`flex-grow-1 overflow-auto ${styles.customScroll}`} style={{ height: "100vh" }}>
        <main className={styles.readerWorkspace}>
          <header className="mb-5">
            <span className="badge bg-light text-primary border px-2.5 py-1.5 rounded-pill mb-2 fw-semibold text-uppercase tracking-wider" style={{ fontSize: '0.75rem' }}>
              Current Module
            </span>
            <h1 className="display-5 fw-extrabold text-dark tracking-tight">{activeLesson.title}</h1>
          </header>
          
          <article 
            className={styles.articleBody}
            dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(activeLesson.content ?? "") }}
          />

          <footer className="mt-5 pt-5 border-top d-flex flex-column gap-3">
            {!isCourseCompleted ? (
              <button
                onClick={handleMarkAsComplete}
                disabled={isLessonCompleted}
                className={`btn btn-lg rounded-pill px-5 py-3 fw-bold tracking-wide shadow transition-all ${
                  isLessonCompleted 
                    ? "btn-light text-muted border border-2 cursor-not-allowed" 
                    : "btn-primary"
                }`}
                style={{ width: "fit-content" }}
              >
                {isLessonCompleted ? "✓ Completed" : "Mark Module as Complete"}
              </button>
            ) : (
              <div className="p-4 bg-light rounded-4 border text-center">
                <h4 className="fw-bold text-dark mb-2">🎉 Track Completed!</h4>
                <p className="text-muted small mb-4">You have cleared all modules requested in this study stream.</p>
                {certificateUrl && (
                  <a href={certificateUrl} target="_blank" rel="noopener noreferrer" className="btn btn-dark rounded-pill px-4 py-2.5 shadow-sm fw-semibold">
                    📄 Get PDF Certificate
                  </a>
                )}
              </div>
            )}

            {progressMessage && !isCourseCompleted && (
              <div className="alert alert-secondary border-0 p-3 rounded-3 small text-center mt-2" role="alert">
                ✨ {progressMessage}
              </div>
            )}
          </footer>
        </main>
      </div>

      {/* 3. CO-PILOT SIDE PANEL */}
      <aside className={styles.aiCopilot}>
        <div className="p-4 border-bottom bg-light bg-opacity-50 d-flex align-items-center gap-2">
          <div className="bg-primary bg-opacity-10 p-2 rounded-3 text-primary d-flex align-items-center justify-content-center">
            ⚡
          </div>
          <div>
            <h6 className="fw-bold m-0 text-dark">Copilot Integration</h6>
            <span className="text-muted small" style={{ fontSize: '0.75rem' }}>Context-Aware Assistant</span>
          </div>
        </div>

        <div className={`p-4 flex-grow-1 overflow-auto ${styles.customScroll}`}>
          <div className="d-flex gap-2 mb-4">
            <button 
              onClick={() => handleAiAction("summary")} 
              disabled={aiLoading}
              className="btn btn-light border text-dark fw-semibold flex-grow-1 py-2.5 rounded-3 small d-flex align-items-center justify-content-center gap-2"
            >
              {aiLoading && activeTask === "summary" ? <span className="spinner-border spinner-border-sm" /> : "📝 Summary"}
            </button>
            <button 
              onClick={() => handleAiAction("quiz")} 
              disabled={aiLoading}
              className="btn btn-light border text-dark fw-semibold flex-grow-1 py-2.5 rounded-3 small d-flex align-items-center justify-content-center gap-2"
            >
              {aiLoading && activeTask === "quiz" ? <span className="spinner-border spinner-border-sm" /> : "🎯 Practice Quiz"}
            </button>
          </div>

          {aiResult && !parsedQuiz && (
            <div className="bg-light p-3 rounded-3 border small text-secondary leading-relaxed">
              {aiResult}
            </div>
          )}

          {/* DYNAMIC QUIZ WORKSPACE */}
          {parsedQuiz && (
            <div className="mt-2">
              <h6 className="fw-bold text-dark mb-3">Self-Assessment Check</h6>
              {parsedQuiz.map((q, i) => (
                <div key={i} className={styles.quizCard}>
                  <p className="fw-bold text-dark small mb-3">{i + 1}. {q.question}</p>
                  <div>
                    {q.options.map((opt) => {
                      const isSelected = selectedAnswers[i] === opt;
                      return (
                        <label key={opt} className={`${styles.interactiveLabel} ${isSelected ? styles.selectedOption : ""}`}>
                          <input
                            type="radio"
                            className="form-check-input d-none"
                            name={`q-${i}`}
                            value={opt}
                            checked={isSelected}
                            onChange={() => setSelectedAnswers({ ...selectedAnswers, [i]: opt })}
                          />
                          <span className="small">{opt}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              ))}

              <button onClick={evaluateQuiz} className="btn btn-dark w-100 py-2.5 rounded-3 fw-semibold shadow-sm mb-3">
                Evaluate Framework
              </button>

              {quizScore !== null && (
                <div className={`p-3 rounded-3 text-center fw-bold text-dark border ${quizScore === parsedQuiz.length ? 'bg-success-subtle border-success-subtle' : 'bg-warning-subtle border-warning-subtle'}`}>
                  Score Metrics: {quizScore} / {parsedQuiz.length}
                </div>
              )}
            </div>
          )}
        </div>
      </aside>

      {/* GLASSMORPHISM CELEBRATION MODAL */}
      {showCelebration && (
        <div className={styles.celebrationShade}>
          <div className={styles.glassCard}>
            <div className="text-center">
              <div className="display-3 mb-2">🏆</div>
              <h2 className="fw-black text-dark tracking-tight mb-2">Track Achieved!</h2>
              <p className="text-secondary small mb-4 px-3">Exceptional work. You have systematically satisfied all lesson criteria mapped inside this workspace environment.</p>
              
              <div className="d-flex flex-column gap-2">
                {certificateUrl && (
                  <a href={certificateUrl} target="_blank" rel="noopener noreferrer" className="btn btn-primary rounded-pill py-2.5 shadow fw-semibold">
                    Download Credentials Document
                  </a>
                )}
                <button onClick={() => setShowCelebration(false)} className="btn btn-link text-decoration-none text-muted fw-medium small mt-2">
                  Dismiss Overlay
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}