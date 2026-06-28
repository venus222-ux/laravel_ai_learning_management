import styles from "../../styles/LessonViewer.module.css";

interface QuizQuestion {
  question: string;
  options: string[];
  answer: string;
}

interface AiWorkspaceProps {
  handleAiAction: (type: "summary" | "quiz") => void;
  aiLoading: boolean;
  activeTask: string | null;
  aiResult: string | null;
  parsedQuiz: QuizQuestion[] | null;
  selectedAnswers: Record<number, string>;
  setSelectedAnswers: (answers: Record<number, string>) => void;
  evaluateQuiz: () => void;
  quizScore: number | null;
  closeAiModal: () => void;
}

export default function AiWorkspace({
  handleAiAction,
  aiLoading,
  activeTask,
  aiResult,
  parsedQuiz,
  selectedAnswers,
  setSelectedAnswers,
  evaluateQuiz,
  quizScore,
  closeAiModal
}: AiWorkspaceProps) {

  const CopilotTriggers = (
    <aside className={styles.aiCopilot}>
      <div className="p-4 border-bottom bg-light bg-opacity-50 d-flex align-items-center gap-2">
        <div className="bg-primary bg-opacity-10 p-2 rounded-3 text-primary d-flex align-items-center justify-content-center">⚡</div>
        <div>
          <h6 className="fw-bold m-0 text-dark">Copilot Integration</h6>
          <span className="text-muted small" style={{ fontSize: '0.75rem' }}>Context-Aware Assistant</span>
        </div>
      </div>
      <div className={`p-4 flex-grow-1 overflow-auto ${styles.customScroll}`}>
        <div className="d-flex flex-column gap-3 mb-4">
          <button onClick={() => handleAiAction("summary")} className="btn btn-light border text-dark fw-semibold py-3 rounded-3 small d-flex align-items-center justify-content-center gap-2">
            📝 Generate Summary
          </button>
          <button onClick={() => handleAiAction("quiz")} className="btn btn-light border text-dark fw-semibold py-3 rounded-3 small d-flex align-items-center justify-content-center gap-2">
            🎯 Practice Quiz
          </button>
        </div>
      </div>
    </aside>
  );

  const CopilotModal = activeTask && (
    <div className="position-fixed top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center" style={{ zIndex: 1050, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(5px)' }}>
      <div className="bg-white rounded-4 shadow-lg d-flex flex-column overflow-hidden" style={{ width: '80vw', height: '80vh' }}>
        
        <div className="p-4 border-bottom d-flex justify-content-between align-items-center bg-light">
          <h4 className="m-0 fw-bold text-dark d-flex align-items-center gap-2">
            {activeTask === 'summary' ? '📝 Lesson Summary' : '🎯 Practice Quiz'}
          </h4>
          <button onClick={closeAiModal} className="btn-close" aria-label="Close"></button>
        </div>

        <div className={`p-4 flex-grow-1 overflow-auto ${styles.customScroll}`}>
          {aiLoading && (
            <div className="h-100 d-flex flex-column justify-content-center align-items-center text-muted">
              <span className="spinner-border mb-3" style={{ width: '3rem', height: '3rem' }}></span>
              <h5>AI is analyzing the lesson...</h5>
            </div>
          )}

          {!aiLoading && aiResult && !parsedQuiz && (
            <div className="fs-5 text-secondary leading-relaxed p-4 bg-light rounded-4 border">
              {aiResult}
            </div>
          )}

          {!aiLoading && parsedQuiz && (
            <div className="mx-auto" style={{ maxWidth: '800px' }}>
              {parsedQuiz.map((q: any, i: number) => (
                <div key={i} className={`p-4 mb-4 rounded-4 border ${styles.quizCard}`}>
                  <p className="fw-bold text-dark fs-5 mb-3">{i + 1}. {q.question}</p>
                  <div className="d-flex flex-column gap-2">
                    {q.options.map((opt: string) => {
                      const isSelected = selectedAnswers[i] === opt;
                      return (
                        <label key={opt} className={`p-3 rounded-3 border cursor-pointer transition-all ${isSelected ? 'bg-primary text-white border-primary' : 'bg-light text-dark hover-bg-secondary'}`}>
                          <input
                            type="radio"
                            className="d-none"
                            name={`q-${i}`}
                            value={opt}
                            checked={isSelected}
                            onChange={() => setSelectedAnswers({ ...selectedAnswers, [i]: opt })}
                          />
                          <span>{opt}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              ))}

              {quizScore !== null && (
                <div className={`p-4 rounded-4 text-center fw-bold fs-4 border mb-4 ${quizScore === parsedQuiz.length ? 'bg-success text-white border-success' : 'bg-warning text-dark border-warning'}`}>
                  Final Score: {quizScore} / {parsedQuiz.length}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="p-4 border-top bg-light d-flex justify-content-end gap-3">
          {parsedQuiz && quizScore === null && !aiLoading && (
            <button onClick={evaluateQuiz} className="btn btn-primary px-5 fw-bold rounded-pill">
              Submit Answers
            </button>
          )}
          <button onClick={closeAiModal} className="btn btn-dark px-4 fw-bold rounded-pill">
            {quizScore !== null || (aiResult && !parsedQuiz) ? 'Done & Close' : 'Cancel'}
          </button>
        </div>

      </div>
    </div>
  );

  return (
    <>
      {CopilotTriggers}
      {CopilotModal}
    </>
  );
}