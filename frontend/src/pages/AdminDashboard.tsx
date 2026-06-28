import { useEffect, useState, lazy, Suspense } from "react";
import API from "../api";

import styles from "../styles/AdminDashboard.module.css";
import Sidebar from "../components/AdminDashboard/Sidebar";
import ActivityTable from "../components/AdminDashboard/ActivityTable";
import LmsStats from "@/components/AdminDashboard/LmsStats";

import type { DashboardData, User, TabType } from "@/types";

// Lazy load heavy tab modules
const CoursesTab = lazy(() => import("@/components/AdminDashboard/CoursesTab"));
const CategoriesTab = lazy(() => import("@/components/AdminDashboard/CategoriesTab"));
const TrafficDashboard = lazy(() => import("@/components/AdminDashboard/TrafficDashboard"));

export default function AdminDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [currentTab, setCurrentTab] = useState<TabType>("home");

  // Fetch standard analytics metrics on load
  useEffect(() => {
    API.get("/admin/dashboard")
      .then((res) => setData(res.data))
      .catch((err) => setError(err.response?.data?.message || "Request failed"));
  }, []);

  // Context-aware background data fetch synchronization loops
  useEffect(() => {
    if (currentTab === "users") {
      fetchUsers();
    }
  }, [currentTab]);

  // ==================== CORE FETCH OPERATIONS ====================
  const fetchUsers = async () => {
    try {
      const res = await API.get("/admin/users");
      setUsers(res.data);
    } catch (err) {
      console.error("Failed to fetch users");
    }
  };

  const handleDeleteUser = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;
    try {
      await API.delete(`/admin/users/${id}`);
      setUsers(users.filter((user) => user.id !== id));
    } catch (err: any) {
      alert(err.response?.data?.message || "Delete failed");
    }
  };

  if (error) return <div className={styles.errorState}>⚠️ Error: {error}</div>;
  if (!data) return <div className={styles.loadingState}>Loading dashboard...</div>;

  return (
    <div className={styles.dashboardContainer}>
      <Sidebar currentTab={currentTab} setCurrentTab={setCurrentTab} />

      <main className={styles.mainContent}>
        {/* HOME TAB */}
        {currentTab === "home" && (
          <div className={styles.homeCentered}>
            <header className={styles.header}>
              <h1 className={styles.welcomeTitle}>
                Welcome back, Admin 👋
              </h1>
              <p className={styles.subtitle}>
                System is running smoothly. Select a tab from the sidebar to manage app infrastructure.
              </p>
            </header>

            <LmsStats />
          </div>
        )}

        {/* LOGS TAB */}
        {currentTab === "logs" && (
          <div className={styles.tabFadeIn}>
            <header className={styles.header}>
              <h2>Activity Dashboard</h2>
              <p className={styles.subtitle}>Complete audit trail and security metrics.</p>
            </header>

            <div className={styles.statsGrid}>
              <div className={styles.statCard}>
                <span className={styles.statLabel}>Logins Today</span>
                <span className={styles.statValue}>{data.stats.logins_today}</span>
              </div>
              <div className={styles.statCard}>
                <span className={styles.statLabel}>Failed Attempts</span>
                <span className={`${styles.statValue} ${styles.dangerText}`}>
                  {data.stats.failed_logins_today}
                </span>
              </div>
              <div className={styles.statCard}>
                <span className={styles.statLabel}>Active Users</span>
                <span className={`${styles.statValue} ${styles.primaryText}`}>
                  {data.stats.active_users}
                </span>
              </div>
            </div>

            <ActivityTable activities={data.recent_activity} />
          </div>
        )}

        {/* USERS TAB */}
        {currentTab === "users" && (
          <div className={styles.tabFadeIn}>
            <header className={styles.header}>
              <h2>User Management</h2>
              <p className={styles.subtitle}>View and manage registered users.</p>
            </header>

            <div className={styles.tableWrapper}>
              <div className={styles.tableHeader}>Total Users: {users.length}</div>
              <table className={styles.adminTable}>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Joined</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id}>
                      <td>{user.name || "N/A"}</td>
                      <td>{user.email}</td>
                      <td>
                        <span className={styles.roleBadge}>
                          {user.roles?.[0]?.name || "user"}
                        </span>
                      </td>
                      <td>{new Date(user.created_at).toLocaleDateString()}</td>
                      <td>
                        <button className={styles.deleteBtn} onClick={() => handleDeleteUser(user.id)}>
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* LAZY LOADED TABS */}
        <Suspense fallback={<div className={styles.loadingState}>Loading module...</div>}>
          {/* TRAFFIC TAB */}
          {currentTab === "traffic" && <TrafficDashboard />}

          {/* COURSES CRUD ENGINE TAB */}
          {currentTab === "courses" && <CoursesTab />}

          {/* CATEGORIES CRUD ENGINE TAB */}
          {currentTab === "categories" && <CategoriesTab />}
        </Suspense>

      </main>
    </div>
  );
}