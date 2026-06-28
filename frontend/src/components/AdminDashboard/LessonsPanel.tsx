import { useState, useEffect, lazy, Suspense } from "react";
import { getAdminLessons, createAdminLesson, updateAdminLesson, deleteAdminLesson } from "../../api";
const CourseEditor = lazy(() => import("./CourseEditor"));
import styles from "../../styles/AdminDashboard.module.css";
import type { Course, Lesson } from "@/types";

interface LessonsPanelProps {
  course: Course;
  onClose: () => void;
  onLessonsChanged: () => void;
}

export default function LessonsPanel({ course, onClose, onLessonsChanged }: LessonsPanelProps) {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  const [form, setForm] = useState({ title: "", content: "", order: "" });
  const [editingId, setEditingId] = useState<number | null>(null);

  useEffect(() => {
    loadLessons();
  }, [course.id]);

  const loadLessons = async () => {
    setIsLoading(true);
    cancelEdit();
    try {
      const res = await getAdminLessons(course.id);
      setLessons(res.data);
    } catch (err) {
      alert("Failed to load course lessons framework layout");
    } finally {
      setIsLoading(false);
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm({ title: "", content: "", order: "" });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      title: form.title,
      content: form.content,
      order: form.order ? Number(form.order) : undefined,
    };

    try {
      if (editingId) {
        await updateAdminLesson(course.id, editingId, payload);
      } else {
        await createAdminLesson(course.id, payload);
      }
      cancelEdit();
      loadLessons();
      onLessonsChanged(); 
    } catch (err: any) {
      alert(err.response?.data?.message || "Lesson processing transaction abort");
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Delete this lesson?")) return;
    try {
      await deleteAdminLesson(course.id, id);
      setLessons((prev) => prev.filter((l) => l.id !== id));
      onLessonsChanged();
    } catch (err: any) {
      alert(err.response?.data?.message || "Lesson removal failure");
    }
  };

  const handleEdit = (lesson: Lesson) => {
    setEditingId(lesson.id);
    setForm({ title: lesson.title, content: lesson.content || "", order: String(lesson.order) });
  };

  return (
    <>
      <div className={styles.formContainer} style={{ marginBottom: "20px", borderColor: "#bfdbfe" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>    
          <h3 style={{ margin: 0 }}>📖 Modules for: <span style={{ color: "#2563eb" }}>{course.title}</span></h3>
          <button 
            onClick={onClose} 
            style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", fontWeight: 600 }}
          >
            ✕ Close Panel
          </button>
        </div>
        <hr style={{ border: "0", borderTop: "1px solid #e5e7eb", margin: "12px 0" }} />
        
        <form onSubmit={handleSubmit} className={styles.formGrid}>
          <div className={styles.formRow}>
            <input
              type="text"
              placeholder="Lesson Segment Header Name"
              className={styles.inputField}
              value={form.title}
              required
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
            <input
              type="number"
              placeholder="Sequence Pos (Auto)"
              className={styles.inputField}
              style={{ width: "130px" }}
              value={form.order}
              onChange={(e) => setForm({ ...form, order: e.target.value })}
            />
          </div>

            <div style={{ minHeight: "240px" }}>
         <Suspense fallback={<div style={{ padding: "20px", color: "#6b7280" }}>Loading rich text editor...</div>}>
           <CourseEditor
            value={form.content}
            onChange={(value) => setForm({ ...form, content: value })}
          />
         </Suspense>
         </div>
          <div className={styles.btnGroup}>
            <button type="submit" className={styles.primaryBtn} style={{ backgroundColor: "#059669" }}>
              {editingId ? "Commit Execution" : "Append New Lesson"}
            </button>
            {editingId && (
              <button type="button" onClick={cancelEdit} className={styles.secondaryBtn}>Cancel</button>
            )}
          </div>
        </form>
      </div>

      <div className={styles.tableWrapper}>
        {isLoading ? (
          <div className={styles.loadingContainer}>Interrogating downstream module entries...</div>
        ) : lessons.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px 0", color: "#9ca3af", fontStyle: "italic" }}>
            No lessons loaded in this track sequence map. Use the form above to add one.
          </div>
        ) : (
          <table className={styles.adminTable}>
            <thead>
              <tr>
                <th style={{ width: "60px" }}>Order</th>
                <th>Segment Module Title</th>
                <th style={{ width: "120px" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {lessons.map((lesson) => (
                <tr key={lesson.id}>
                  <td style={{ fontWeight: 600, color: "#4b5563" }}>#{lesson.order}</td>
                  <td style={{ fontWeight: 500 }}>{lesson.title}</td>
                  <td>
                    <div className={styles.tableActions}>
                      <button onClick={() => handleEdit(lesson)} className={styles.editBtn}>Edit</button>
                      <button onClick={() => handleDelete(lesson.id)} className={styles.deleteBtn}>Drop</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}