import { useEffect, useState } from "react";
import API from "../../api";

import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
  CartesianGrid,
} from "recharts";

import styles from "../../styles/AdminDashboard.module.css";

interface LmsStatsData {
  total_users: number;
  total_courses: number;
  total_enrollments: number;
  completed_courses: number;
  in_progress_courses: number;
  users_with_completed_course: number;
  users_currently_learning: number;
  certificates_issued: number;
}

export default function LmsStats() {
  const [stats, setStats] = useState<LmsStatsData | null>(null);

  useEffect(() => {
    API.get("/admin/lms-stats")
      .then((res) => setStats(res.data))
      .catch(console.error);
  }, []);

  if (!stats) return (
    <div className={styles.loadingState}>Loading statistics...</div>
  );

  // PIE DATA (Course Status)
  const pieData = [
    { name: "Completed", value: stats.completed_courses },
    { name: "In Progress", value: stats.in_progress_courses },
  ];

  // Modern UI Colors
  const PIE_COLORS = ["#10b981", "#f59e0b"]; 
  const BAR_COLOR = "#6366f1";

  // BAR DATA (Platform Overview)
  const barData = [
    { name: "Users", value: stats.total_users },
    { name: "Courses", value: stats.total_courses },
    { name: "Enrollments", value: stats.total_enrollments },
    { name: "Certificates", value: stats.certificates_issued },
  ];

  return (
    <div className={styles.lmsStatsContainer}>
      
      <div className={styles.header}>
        <h2>Platform Overview</h2>
        <p>Monitor your LMS performance and user engagement</p>
      </div>

      {/* KPI CARDS */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Total Users</span>
          <strong className={styles.statValue}>{stats.total_users.toLocaleString()}</strong>
        </div>

        <div className={styles.statCard}>
          <span className={styles.statLabel}>Active Learners</span>
          <strong className={styles.statValue}>{stats.users_currently_learning.toLocaleString()}</strong>
        </div>

        <div className={styles.statCard}>
          <span className={styles.statLabel}>Graduated Users</span>
          <strong className={styles.statValue}>{stats.users_with_completed_course.toLocaleString()}</strong>
        </div>

        <div className={styles.statCard}>
          <span className={styles.statLabel}>Certificates</span>
          <strong className={styles.statValue}>{stats.certificates_issued.toLocaleString()}</strong>
        </div>
      </div>

      {/* CHARTS */}
      <div className={styles.chartGrid}>

        {/* PIE CHART */}
        <div className={styles.chartBox}>
          <div className={styles.chartHeader}>
            <h3>Course Progress</h3>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={pieData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={5}
                label
              >
                {pieData.map((_, index) => (
                  <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} stroke="none" />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}
              />
              <Legend verticalAlign="bottom" height={36} iconType="circle" />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* BAR CHART */}
        <div className={styles.chartBox}>
          <div className={styles.chartHeader}>
            <h3>Platform Metrics</h3>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={barData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
              <XAxis 
                dataKey="name" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#6b7280', fontSize: 12 }} 
                dy={10}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#6b7280', fontSize: 12 }} 
              />
              <Tooltip 
                cursor={{ fill: '#f3f4f6' }}
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}
              />
              <Bar 
                dataKey="value" 
                fill={BAR_COLOR} 
                radius={[4, 4, 0, 0]} 
                barSize={40}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

      </div>
    </div>
  );
}