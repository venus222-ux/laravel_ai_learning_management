import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useLmsStore } from "../store/useLmsStore";
import { triggerLessonAi } from "../api";
import { getEcho } from "../utilis/echo";
import { useStore } from "../store/useStore";
import API from "../api";
import styles from "../styles/LessonViewer.module.css";
import confetti from 'canvas-confetti';

// Import Child Components
import CourseSidebar from "../components/LessonViewer/CourseSidebar";
import LessonBody from "../components/LessonViewer/LessonBody";
import AiWorkspace from "../components/LessonViewer/AiWorkspace";

interface QuizQuestion {
  question: string;
  options: string[];
  answer: string;
}

export default function LessonViewer() {
  const { courseId, lessonId } = useParams();
  const { activeLesson, activeCourse, isLoadingLms, fetchSingleLesson, fetchSingleCourse } = useLmsStore();

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

  useEffect(() => { if (courseId) fetchSingleCourse(courseId); }, [courseId, fetchSingleCourse]);

  useEffect(() => {
    if (courseId && lessonId) {
      fetchSingleLesson(courseId, lessonId);
      closeAiModal();
      setProgressMessage(null);
    }
  }, [courseId, lessonId, fetchSingleLesson]);

  useEffect(() => {
    if (!courseId) return;
    API.get(`/courses/${courseId}/completed-lessons`)
      .then((res) => setCompletedLessons(res.data.completed_lessons || []))
      .catch(console.error);
  }, [courseId]);

  const initializeEchoListener = (userId: string | number) => {
    try {
      const echo = getEcho();
      const channelName = `user.${userId}`;
      const channel = echo.private(channelName);

      channel.stopListening(".ai.completed");
      channel.listen(".ai.completed", (data: any) => {
        setAiResult(data.content);
        setAiLoading(false);
        
        if (data.type === "quiz" && data.content) {
          try {
            const clean = data.content.replace(/```json/g, "").replace(/```/g, "").trim();
            setParsedQuiz(JSON.parse(clean));
          } catch (e) {
            console.error("JSON parsing failed on frontend:", e);
          }
        }
      });
    } catch (error) {
      console.error("💥 Failed to initialize Echo stream:", error);
    }
  };

  useEffect(() => {
    let initializedUserId: string | number | null = null;
    let retryInterval: NodeJS.Timeout;

    const runSetupAttempt = () => {
      const storeState = useStore.getState();
      const token = storeState.token;
      let userId: string | number | null = storeState.user?.id || null;

      if (!userId && token) {
        try {
          userId = JSON.parse(window.atob(token.split('.')[1]))?.sub;
        } catch (e) { }
      }

      if (userId) {
        if (initializedUserId === userId) return true;
        initializeEchoListener(userId);
        initializedUserId = userId;
        return true;
      }
      return false;
    };

    if (!runSetupAttempt()) {
      let attempts = 0;
      retryInterval = setInterval(() => {
        attempts++;
        if (runSetupAttempt() || attempts >= 10) clearInterval(retryInterval);
      }, 500);
    }

    return () => {
      if (retryInterval) clearInterval(retryInterval);
      if (initializedUserId) try { getEcho().private(`user.${initializedUserId}`).stopListening(".ai.completed"); } catch(e) {}
    };
  }, [user]);

  useEffect(() => {
    if (progressMessage?.includes("certificate")) {
      API.get(`/certificates/${courseId}`)
        .then((res) => setCertificateUrl(res.data.file_path))
        .catch(() => {});
    }
  }, [progressMessage, courseId]);

  const closeAiModal = () => {
    setActiveTask(null);
    setAiResult(null);
    setParsedQuiz(null);
    setQuizScore(null);
    setSelectedAnswers({});
    setAiLoading(false);
  };

  const handleAiAction = async (type: "summary" | "quiz") => {
    closeAiModal();
    setAiLoading(true);
    setActiveTask(type);

    const storeState = useStore.getState();
    let currentUserId = storeState.user?.id;
    if (!currentUserId && storeState.token) {
      try { currentUserId = JSON.parse(window.atob(storeState.token.split('.')[1])).sub; } catch(e) {}
    }
    if (currentUserId) initializeEchoListener(currentUserId);

    try {
      await triggerLessonAi(courseId!, lessonId!, type);
    } catch {
      setAiLoading(false);
      setAiResult("AI service failed.");
    }
  };

  const evaluateQuiz = () => {
    if (!parsedQuiz) return;
    let score = 0;
    parsedQuiz.forEach((q, i) => { if (selectedAnswers[i] === q.answer) score++; });
    setQuizScore(score);
  };

  const handleMarkAsComplete = async () => {
    try {
      const res = await API.post(`/courses/${courseId}/lessons/${lessonId}/complete`);
      setCompletedLessons(res.data.completed_lessons || []);
      
      if (res.data.course_completed) {
        setProgressMessage("🏆 Congratulations! You finished the course!");
        setShowCelebration(true);
        confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
        API.get(`/certificates/${courseId}`).then((res) => setCertificateUrl(res.data.file_path)).catch(() => {});
      } else {
        setProgressMessage(`Lesson completed! Progress: ${res.data.progress_percent}%`);
      }
    } catch (err) {}
  };

  const isLessonCompleted = completedLessons.includes(Number(lessonId));
  const isCourseCompleted = activeCourse?.lessons && completedLessons.length === activeCourse.lessons.length;

  if (isLoadingLms || !activeLesson) {
    return (
      <div className="d-flex justify-content-center align-items-center min-vh-100 bg-white">
        <div className="spinner-border text-primary" style={{ width: '3rem', height: '3rem' }} role="status"></div>
      </div>
    );
  }

  return (
    <div className={styles.workspaceContainer}>
      
      <CourseSidebar 
        courseId={courseId} 
        activeCourse={activeCourse} 
        lessonId={lessonId} 
        completedLessons={completedLessons} 
      />

      <LessonBody 
        activeLesson={activeLesson} 
        isLessonCompleted={isLessonCompleted} 
        isCourseCompleted={!!isCourseCompleted}
        handleMarkAsComplete={handleMarkAsComplete} 
        progressMessage={progressMessage} 
        certificateUrl={certificateUrl} 
      />

      <AiWorkspace 
        handleAiAction={handleAiAction}
        aiLoading={aiLoading}
        activeTask={activeTask}
        aiResult={aiResult}
        parsedQuiz={parsedQuiz}
        selectedAnswers={selectedAnswers}
        setSelectedAnswers={setSelectedAnswers}
        evaluateQuiz={evaluateQuiz}
        quizScore={quizScore}
        closeAiModal={closeAiModal}
      />

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