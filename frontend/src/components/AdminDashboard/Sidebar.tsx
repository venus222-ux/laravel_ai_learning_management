import styles from "../../styles/AdminDashboard.module.css";
import type { TabType } from "@/types";

interface SidebarProps {
  currentTab: TabType;
  setCurrentTab: React.Dispatch<React.SetStateAction<TabType>>;
}

export default function Sidebar({ currentTab, setCurrentTab }: SidebarProps) {
  return (
    <aside className={styles.sidebar}>
      <div className={styles.logo}>ShieldAdmin</div>
      <nav className={styles.navGroup}>
        <div
          className={`${styles.navItem} ${currentTab === "home" ? styles.activeNavItem : ""}`}
          onClick={() => setCurrentTab("home")}
        >
          📊 Dashboard
        </div>

        {/* Added Traffic Analytics Tab */}
        <div
          className={`${styles.navItem} ${currentTab === "traffic" ? styles.activeNavItem : ""}`}
          onClick={() => setCurrentTab("traffic")}
        >
          🌐 Traffic Analytics
        </div>

        {/* Added Course Engine Manager Tab */}
        <div
          className={`${styles.navItem} ${currentTab === "courses" ? styles.activeNavItem : ""}`}
          onClick={() => setCurrentTab("courses")}
        >
          📚 Manage Courses
        </div>

        {/* Added Course Categories Manager Tab */}
        <div
          className={`${styles.navItem} ${currentTab === "categories" ? styles.activeNavItem : ""}`}
          onClick={() => setCurrentTab("categories")}
        >
          🏷️ Categories
        </div>

        <div
          className={`${styles.navItem} ${currentTab === "logs" ? styles.activeNavItem : ""}`}
          onClick={() => setCurrentTab("logs")}
        >
          📜 Activity Logs
        </div>

        <div
          className={`${styles.navItem} ${currentTab === "users" ? styles.activeNavItem : ""}`}
          onClick={() => setCurrentTab("users")}
        >
          👥 Users
        </div>
      </nav>
    </aside>
  );
}
