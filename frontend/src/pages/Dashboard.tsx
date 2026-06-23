import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import API from "../api";

interface EnrolledCourse {
  id: number;
  title: string;
  total_lessons: number;
  completed_lessons_count: number;
  progress_percent: number;
  status: "completed" | "enrolled";
  certificate_url: string | null;
  certificate_number?: string | null;
}

interface DashboardPayload {
  user?: {
    id: number;
    name: string;
    email: string;
  };
  enrolled_courses?: EnrolledCourse[];
}

export default function Dashboard() {
  const [data, setData] = useState<DashboardPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const getAbsoluteUrl = (path: string) => {
    if (!path) return "#";
    if (path.startsWith("http")) return path;
    return `http://localhost:8000${path}`;
  };

  useEffect(() => {
    API.get("/dashboard")
      .then((res) => {
        setData(res.data);
      })
      .catch((err) => {
        console.error("Dashboard error:", err);
        setError("Failed to load dashboard.");
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div
        style={{
          padding: "3rem",
          textAlign: "center",
          color: "#6b7280",
        }}
      >
        Loading dashboard...
      </div>
    );
  }

  if (error || !data) {
    return (
      <div
        style={{
          padding: "3rem",
          textAlign: "center",
          color: "#ef4444",
        }}
      >
        {error ?? "Unable to load dashboard."}
      </div>
    );
  }

  const userName = data.user?.name ?? "Student";
  const userEmail = data.user?.email ?? "";
  const coursesList = data.enrolled_courses ?? [];

  return (
    <div
      style={{
        maxWidth: "1200px",
        margin: "0 auto",
        padding: "2rem",
      }}
    >
      {/* Header */}
      <div
        style={{
          background:
            "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)",
          color: "white",
          borderRadius: "16px",
          padding: "2rem",
          marginBottom: "2rem",
        }}
      >
        <h1
          style={{
            margin: 0,
            fontSize: "2rem",
            fontWeight: 800,
          }}
        >
          Welcome back, {userName}
        </h1>

        <p
          style={{
            marginTop: "0.5rem",
            opacity: 0.9,
          }}
        >
          {userEmail}
        </p>
      </div>

      <h2
        style={{
          marginBottom: "1.5rem",
          color: "#111827",
        }}
      >
        My Learning Dashboard
      </h2>

      {coursesList.length === 0 ? (
        <div
          style={{
            background: "#f9fafb",
            border: "2px dashed #d1d5db",
            borderRadius: "12px",
            padding: "3rem",
            textAlign: "center",
          }}
        >
          <p
            style={{
              color: "#6b7280",
              marginBottom: "1rem",
            }}
          >
            You haven't enrolled in any courses yet.
          </p>

          <Link
            to="/courses"
            style={{
              background: "#4f46e5",
              color: "white",
              padding: "0.75rem 1.25rem",
              borderRadius: "8px",
              textDecoration: "none",
              fontWeight: 600,
            }}
          >
            Browse Courses
          </Link>
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fill, minmax(350px, 1fr))",
            gap: "1.5rem",
          }}
        >
          {coursesList.map((course) => {
            const isCompleted = course.status === "completed";

            return (
              <div
                key={course.id}
                style={{
                  background: "#fff",
                  border: "1px solid #e5e7eb",
                  borderRadius: "12px",
                  padding: "1.5rem",
                  display: "flex",
                  flexDirection: "column",
                  boxShadow:
                    "0 4px 6px rgba(0,0,0,0.05)",
                }}
              >
                <div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                    }}
                  >
                    <h3
                      style={{
                        margin: 0,
                        fontSize: "1.2rem",
                        color: "#111827",
                      }}
                    >
                      {course.title}
                    </h3>

                    <span
                      style={{
                        padding: "0.3rem 0.7rem",
                        borderRadius: "9999px",
                        fontSize: "0.75rem",
                        fontWeight: 700,
                        backgroundColor: isCompleted
                          ? "#d1fae5"
                          : "#dbeafe",
                        color: isCompleted
                          ? "#065f46"
                          : "#1e40af",
                      }}
                    >
                      {isCompleted
                        ? "Completed"
                        : "In Progress"}
                    </span>
                  </div>

                  <div
                    style={{
                      marginTop: "1.25rem",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        marginBottom: "0.5rem",
                        fontSize: "0.95rem",
                      }}
                    >
                      <span>Progress</span>

                      <span
                        style={{
                          fontWeight: 700,
                        }}
                      >
                        {course.completed_lessons_count} of{" "}
                        {course.total_lessons} lessons completed
                      </span>
                    </div>

                    <div
                      style={{
                        height: "8px",
                        background: "#e5e7eb",
                        borderRadius: "999px",
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          width: `${course.progress_percent}%`,
                          height: "100%",
                          background: isCompleted
                            ? "#10b981"
                            : "#4f46e5",
                          transition:
                            "width 0.4s ease",
                        }}
                      />
                    </div>

                    <div
                      style={{
                        marginTop: "0.5rem",
                        fontSize: "0.85rem",
                        color: "#6b7280",
                      }}
                    >
                      {course.progress_percent}% completed
                    </div>
                  </div>

                  {isCompleted &&
                    course.certificate_number && (
                      <div
                        style={{
                          marginTop: "1rem",
                          fontSize: "0.85rem",
                          color: "#6b7280",
                        }}
                      >
                        Certificate ID:{" "}
                        {course.certificate_number}
                      </div>
                    )}
                </div>

                <div
                  style={{
                    marginTop: "auto",
                    paddingTop: "1.5rem",
                    display: "flex",
                    gap: "10px",
                  }}
                >
                  {!isCompleted ? (
                    <Link
                      to={`/courses/${course.id}`}
                      style={{
                        flex: 1,
                        textAlign: "center",
                        background: "#4f46e5",
                        color: "white",
                        padding: "0.75rem",
                        borderRadius: "8px",
                        textDecoration: "none",
                        fontWeight: 600,
                      }}
                    >
                      Continue Learning
                    </Link>
                  ) : (
                    <Link
                      to={`/courses/${course.id}`}
                      style={{
                        flex: 1,
                        textAlign: "center",
                        background: "#f3f4f6",
                        color: "#374151",
                        padding: "0.75rem",
                        borderRadius: "8px",
                        textDecoration: "none",
                        fontWeight: 600,
                      }}
                    >
                      View Course
                    </Link>
                  )}

                  {isCompleted &&
                    course.certificate_url && (
                      <a
                        href={getAbsoluteUrl(
                          course.certificate_url
                        )}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          flex: 1,
                          textAlign: "center",
                          background: "#10b981",
                          color: "white",
                          padding: "0.75rem",
                          borderRadius: "8px",
                          textDecoration: "none",
                          fontWeight: 600,
                        }}
                      >
                        📜 Download PDF
                      </a>
                    )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}