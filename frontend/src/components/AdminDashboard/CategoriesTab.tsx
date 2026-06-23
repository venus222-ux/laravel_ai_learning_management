import { useEffect, useState } from "react";
import {
  getAdminCategories,
  createAdminCategory,
  updateAdminCategory,
  deleteAdminCategory,
} from "../../api";

import styles from "../../styles/AdminDashboard.module.css";
import type { Category } from "@/types";

export default function CategoriesTab() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [categoryForm, setCategoryForm] = useState({ name: "" });
  const [editingId, setEditingId] = useState<number | null>(null);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const res = await getAdminCategories();
      setCategories(res.data);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setCategoryForm({ name: "" });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await updateAdminCategory(editingId, categoryForm);
      } else {
        await createAdminCategory(categoryForm);
      }
      handleCancelEdit();
      fetchCategories();
    } catch (err: any) {
      alert(err.response?.data?.message || "Category operation failed");
    }
  };

  const handleEdit = (category: Category) => {
    setEditingId(category.id);
    setCategoryForm({ name: category.name });
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Delete category?")) return;
    try {
      await deleteAdminCategory(id);
      setCategories((prev) => prev.filter((c) => c.id !== id));
    } catch (err: any) {
      alert(err.response?.data?.message || "Delete failed");
    }
  };

  return (
    <div className={styles.tabFadeIn}>
      <header className={styles.header}>
        <h2>Categories</h2>
        <p className={styles.subtitle}>Organize and classify your course catalog</p>
      </header>

      <div className={styles.formContainer}>
        <form onSubmit={handleSubmit} className={styles.btnGroup}>
          <input
            type="text"
            placeholder="Category Name (e.g., Development)"
            className={styles.inputField}
            style={{ maxWidth: "400px" }}
            value={categoryForm.name}
            required
            onChange={(e) => setCategoryForm({ name: e.target.value })}
          />
          <button type="submit" className={styles.primaryBtn}>
            {editingId ? "Update Category" : "Create Category"}
          </button>
          {editingId && (
            <button type="button" onClick={handleCancelEdit} className={styles.secondaryBtn}>
              Cancel
            </button>
          )}
        </form>
      </div>

      <div className={styles.tableWrapper}>
        {loading ? (
          <div className={styles.loadingContainer}>Loading categories configuration...</div>
        ) : (
          <table className={styles.adminTable}>
            <thead>
              <tr>
                <th>Name</th>
                <th>Slug</th>
                <th>Courses linked</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((category) => (
                <tr key={category.id}>
                  <td style={{ fontWeight: 500 }}>{category.name}</td>
                  <td><code>{category.slug}</code></td>
                  <td>{category.courses_count ?? 0} courses</td>
                  <td>
                    <div className={styles.tableActions}>
                      <button onClick={() => handleEdit(category)} className={styles.editBtn}>
                        Edit
                      </button>
                      <button onClick={() => handleDelete(category.id)} className={styles.deleteBtn}>
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}