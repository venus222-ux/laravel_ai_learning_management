import { useEffect, useState } from "react";
import {
  getAdminCourses,
  getAdminCategories,
  createAdminCourse,
  updateAdminCourse,
  deleteAdminCourse,
  getAdminLessons,
  createAdminLesson,
  updateAdminLesson,
  deleteAdminLesson,
} from "../../api";

import styles from "../../styles/AdminDashboard.module.css";
import type { Course, Category, Lesson } from "@/types";
import CourseEditor from "./CourseEditor";

export default function CoursesTab() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Focus Strategy Contexts
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [isLoadingLessons, setIsLoadingLoadingLessons] = useState(false);

  // Forms Management Block
  const [courseForm, setCourseForm] = useState({ title: "", description: "", category_id: "" });
  const [lessonForm, setLessonForm] = useState({ title: "", content: "", order: "" });

  const [editingCourseId, setEditingCourseId] = useState<number | null>(null);
  const [editingLessonId, setEditingLessonId] = useState<number | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [coursesRes, categoriesRes] = await Promise.all([
        getAdminCourses(),
        getAdminCategories(),
      ]);
      setCourses(coursesRes.data);
      setCategories(categoriesRes.data);
    } finally {
      setIsLoading(false);
    }
  };

  const loadLessonsWorkspace = async (course: Course) => {
    setSelectedCourse(course);
    setIsLoadingLoadingLessons(true);
    handleCancelLessonEdit();
    try {
      const res = await getAdminLessons(course.id);
      setLessons(res.data);
    } catch (err) {
      alert("Failed to load course lessons framework layout");
    } finally {
      setIsLoadingLoadingLessons(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingCourseId(null);
    setCourseForm({ title: "", description: "", category_id: "" });
  };

  const handleCancelLessonEdit = () => {
    setEditingLessonId(null);
    setLessonForm({ title: "", content: "", order: "" });
  };

  // Course Actions Processing Layout
  const handleCourseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      title: courseForm.title,
      description: courseForm.description,
      category_id: courseForm.category_id ? Number(courseForm.category_id) : null,
    };

    try {
      if (editingCourseId) {
        await updateAdminCourse(editingCourseId, payload);
      } else {
        await createAdminCourse(payload);
      }
      handleCancelEdit();
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message || "Course compilation failed");
    }
  };

  const handleEditCourse = (course: Course) => {
    setEditingCourseId(course.id);
    setCourseForm({
      title: course.title,
      description: course.description,
      category_id: course.category_id ? String(course.category_id) : "",
    });
  };

  const handleDeleteCourse = async (id: number) => {
    if (!window.confirm("Purge course data? This action is absolute.")) return;
    try {
      await deleteAdminCourse(id);
      if (selectedCourse?.id === id) setSelectedCourse(null);
      setCourses((prev) => prev.filter((c) => c.id !== id));
    } catch (err: any) {
      alert(err.response?.data?.message || "Purge execution failed");
    }
  };

  // Lesson Operations Processing Engine
  const handleLessonSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourse) return;

    const payload = {
      title: lessonForm.title,
      content: lessonForm.content,
      order: lessonForm.order ? Number(lessonForm.order) : undefined,
    };

    try {
      if (editingLessonId) {
        await updateAdminLesson(selectedCourse.id, editingLessonId, payload);
      } else {
        await createAdminLesson(selectedCourse.id, payload);
      }
      handleCancelLessonEdit();
      loadLessonsWorkspace(selectedCourse);
      fetchData(); // Sync parent metrics row structural counts
    } catch (err: any) {
      alert(err.response?.data?.message || "Lesson processing transaction abort");
    }
  };

  const handleEditLesson = (lesson: Lesson) => {
    setEditingLessonId(lesson.id);
    setLessonForm({
      title: lesson.title,
      content: lesson.content || "",
      order: String(lesson.order),
    });
  };

  const handleDeleteLesson = async (id: number) => {
    if (!selectedCourse || !window.confirm("Delete this lesson?")) return;
    try {
      await deleteAdminLesson(selectedCourse.id, id);
      setLessons((prev) => prev.filter((l) => l.id !== id));
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message || "Lesson removal failure");
    }
  };

  return (
    <div className={styles.tabFadeIn}>
      <header className={styles.header}>
        <h2>LMS Curriculum Workspace</h2>
        <p className={styles.subtitle}>Configure learning modules structure, course paths, and engine variables</p>
      </header>

      <div style={{ display: "grid", gridTemplateColumns: selectedCourse ? "1fr 1fr" : "1fr", gap: "24px" }}>
        
        {/* LEFT COLUMN: COURSE INFRASTRUCTURE MANAGEMENT */}
        <div>
          <div className={styles.formContainer} style={{ marginBottom: "20px" }}>
            <h3 style={{ marginTop: 0 }}>{editingCourseId ? "⚙️ Modify Course Entity" : "✨ Spin Up New Course Path"}</h3>
            <form onSubmit={handleCourseSubmit} className={styles.formGrid}>
              <div className={styles.formRow}>
                <input
                  type="text"
                  placeholder="Course Context Blueprint Title"
                  className={styles.inputField}
                  value={courseForm.title}
                  required
                  onChange={(e) => setCourseForm({ ...courseForm, title: e.target.value })}
                />
                <select
                  className={styles.selectField}
                  value={courseForm.category_id}
                  onChange={(e) => setCourseForm({ ...courseForm, category_id: e.target.value })}
                >
                  <option value="">Select Category Structure</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>

              <CourseEditor
                value={courseForm.description}
                onChange={(value) => setCourseForm({ ...courseForm, description: value })}
              />

              <div className={styles.btnGroup}>
                <button type="submit" className={styles.primaryBtn}>
                  {editingCourseId ? "Save Modifications" : "Initialize Course"}
                </button>
                {editingCourseId && (
                  <button type="button" onClick={handleCancelEdit} className={styles.secondaryBtn}>Cancel</button>
                )}
              </div>
            </form>
          </div>

          <div className={styles.tableWrapper}>
            {isLoading ? (
              <div className={styles.loadingContainer}>Streaming pipeline analytics...</div>
            ) : (
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
                  {courses.map((course) => {
                    const isSelected = selectedCourse?.id === course.id;
                    return (
                      <tr key={course.id} style={{ backgroundColor: isSelected ? "#f3f4f6" : "transparent" }}>
                        <td style={{ fontWeight: 600 }}>{course.title}</td>
                        <td>{course.category?.name || <em style={{ color: "#9ca3af" }}>Standalone Layout</em>}</td>
                        <td>
                          <button 
                            onClick={() => loadLessonsWorkspace(course)}
                            className={styles.editBtn} 
                            style={{ padding: "2px 8px", backgroundColor: "#eff6ff", color: "#2563eb" }}
                          >
                            📚 {course.lessons_count ?? 0} modules (Manage)
                          </button>
                        </td>
                        <td>
                          <div className={styles.tableActions}>
                            <button onClick={() => handleEditCourse(course)} className={styles.editBtn}>Edit</button>
                            <button onClick={() => handleDeleteCourse(course.id)} className={styles.deleteBtn}>Purge</button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: MODULE/LESSONS STEP-DOWN WORKSPACE */}
        {selectedCourse && (
          <div style={{ borderLeft: "1px dashed #e5e7eb", paddingLeft: "24px" }}>
            <div className={styles.formContainer} style={{ marginBottom: "20px", borderColor: "#bfdbfe" }}>
              <div style={{ display: "flex", justifyContent: "between", alignItems: "center", justifyContent: "space-between" }}>
                <h3 style={{ margin: 0 }}>📖 Modules for: <span style={{ color: "#2563eb" }}>{selectedCourse.title}</span></h3>
                <button 
                  onClick={() => setSelectedCourse(null)} 
                  style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", fontWeight: 600 }}
                >
                  ✕ Close Panel
                </button>
              </div>
              <hr style={{ border: "0", borderTop: "1px solid #e5e7eb", margin: "12px 0" }} />
              
              <form onSubmit={handleLessonSubmit} className={styles.formGrid}>
                <div className={styles.formRow}>
                  <input
                    type="text"
                    placeholder="Lesson Segment Header Name"
                    className={styles.inputField}
                    value={lessonForm.title}
                    required
                    onChange={(e) => setLessonForm({ ...lessonForm, title: e.target.value })}
                  />
                  <input
                    type="number"
                    placeholder="Sequence Pos (Auto)"
                    className={styles.inputField}
                    style={{ width: "130px" }}
                    value={lessonForm.order}
                    onChange={(e) => setLessonForm({ ...lessonForm, order: e.target.value })}
                  />
                </div>

                <div style={{ minHeight: "240px" }}>
                  <CourseEditor
                    value={lessonForm.content}
                    onChange={(value) => setLessonForm({ ...lessonForm, content: value })}
                  />
                </div>

                <div className={styles.btnGroup}>
                  <button type="submit" className={styles.primaryBtn} style={{ backgroundColor: "#059669" }}>
                    {editingLessonId ? "Commit Execution" : "Append New Lesson"}
                  </button>
                  {editingLessonId && (
                    <button type="button" onClick={handleCancelLessonEdit} className={styles.secondaryBtn}>Cancel</button>
                  )}
                </div>
              </form>
            </div>

            <div className={styles.tableWrapper}>
              {isLoadingLessons ? (
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
                            <button onClick={() => handleEditLesson(lesson)} className={styles.editBtn}>Edit</button>
                            <button onClick={() => handleDeleteLesson(lesson.id)} className={styles.deleteBtn}>Drop</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}