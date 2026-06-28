import { useState, useEffect } from "react";
import { createAdminCourse, updateAdminCourse } from "../../api";
import CourseEditor from "./CourseEditor";
import styles from "../../styles/AdminDashboard.module.css";
import type { Course, Category } from "@/types";

interface CourseFormProps {
  categories: Category[];
  courseToEdit: Course | null;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function CourseForm({ categories, courseToEdit, onSuccess, onCancel }: CourseFormProps) {
  const [form, setForm] = useState({ title: "", description: "", category_id: "" });

  useEffect(() => {
    if (courseToEdit) {
      setForm({
        title: courseToEdit.title,
        description: courseToEdit.description,
        category_id: courseToEdit.category_id ? String(courseToEdit.category_id) : "",
      });
    } else {
      setForm({ title: "", description: "", category_id: "" });
    }
  }, [courseToEdit]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      title: form.title,
      description: form.description,
      category_id: form.category_id ? Number(form.category_id) : null,
    };

    try {
      if (courseToEdit) {
        await updateAdminCourse(courseToEdit.id, payload);
      } else {
        await createAdminCourse(payload);
      }
      onSuccess();
      setForm({ title: "", description: "", category_id: "" });
    } catch (err: any) {
      alert(err.response?.data?.message || "Course compilation failed");
    }
  };

  return (
    <div className={styles.formContainer} style={{ marginBottom: "20px" }}>
      <h3 style={{ marginTop: 0 }}>{courseToEdit ? "⚙️ Modify Course Entity" : "✨ Spin Up New Course Path"}</h3>
      <form onSubmit={handleSubmit} className={styles.formGrid}>
        <div className={styles.formRow}>
          <input
            type="text"
            placeholder="Course Context Blueprint Title"
            className={styles.inputField}
            value={form.title}
            required
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />
          <select
            className={styles.selectField}
            value={form.category_id}
            onChange={(e) => setForm({ ...form, category_id: e.target.value })}
          >
            <option value="">Select Category Structure</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
        </div>

        <CourseEditor
          value={form.description}
          onChange={(value) => setForm({ ...form, description: value })}
        />

        <div className={styles.btnGroup}>
          <button type="submit" className={styles.primaryBtn}>
            {courseToEdit ? "Save Modifications" : "Initialize Course"}
          </button>
          {courseToEdit && (
            <button type="button" onClick={onCancel} className={styles.secondaryBtn}>Cancel</button>
          )}
        </div>
      </form>
    </div>
  );
}