import DOMPurify from "dompurify";
import styles from "../../styles/LessonViewer.module.css";

interface LessonBodyProps {
  activeLesson: any;
  isCourseCompleted: boolean;
  isLessonCompleted: boolean;
  handleMarkAsComplete: () => void;
  progressMessage: string | null;
  certificateUrl: string | null;
}

export default function LessonBody({ 
  activeLesson, 
  isCourseCompleted, 
  isLessonCompleted, 
  handleMarkAsComplete, 
  progressMessage, 
  certificateUrl 
}: LessonBodyProps) {
  return (
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
  );
}