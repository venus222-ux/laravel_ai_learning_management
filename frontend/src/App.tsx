import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { lazy, Suspense, useEffect } from "react";
import Navbar from "./components/Navbar";
import { ToastContainer } from "react-toastify";
import { useStore } from "./store/useStore";
import ProtectedRoute from "./components/ProtectedRoute";
import { useAuthRestore } from "./store/useAuthRestore";

// Lazy-loaded pages
const Home = lazy(() => import("./pages/Home"));
const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Profile = lazy(() => import("./pages/Profile"));
const ForgotPassword = lazy(() => import("./pages/ForgetPassword"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const NotFound = lazy(() => import("./pages/NotFound"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));

// ======================================================
// Day 1 LMS Placeholders (Replace with real pages Day 3)
// ======================================================
const CourseCatalog = () => (
  <div className="container py-5">
    <h1>Course Catalog</h1>
    <p>Browse all available courses.</p>
  </div>
);

const CourseDetails = () => (
  <div className="container py-5">
    <h1>Course Details</h1>
    <p>Course information, curriculum, progress, reviews.</p>
  </div>
);

const LessonViewer = () => (
  <div className="container py-5">
    <h1>Lesson Viewer & AI Tutor</h1>
    <p>Video lesson, quizzes, notes, AI assistant.</p>
  </div>
);

// ======================================================
// Auth Bootstrap
// ======================================================
const AuthBootstrap = () => {
  useAuthRestore();
  return null;
};

// ======================================================
// App
// ======================================================
const App = () => {
  const { theme, isAuth, role, initialized } = useStore();

  useEffect(() => {
    document.documentElement.setAttribute("data-bs-theme", theme);
  }, [theme]);

  return (
    <BrowserRouter>
      {/* Restore auth on refresh */}
      <AuthBootstrap />

      <Navbar />

      {!initialized ? (
        <div style={{ textAlign: "center", marginTop: "2rem" }}>
          Loading...
        </div>
      ) : (
        <Suspense
          fallback={
            <div style={{ textAlign: "center", marginTop: "2rem" }}>
              Loading page...
            </div>
          }
        >
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Home />} />

            <Route
              path="/login"
              element={
                !isAuth ? (
                  <Login />
                ) : role === "admin" ? (
                  <Navigate to="/admin/dashboard" replace />
                ) : (
                  <Navigate to="/dashboard" replace />
                )
              }
            />

            <Route
              path="/register"
              element={
                !isAuth ? (
                  <Register />
                ) : role === "admin" ? (
                  <Navigate to="/admin/dashboard" replace />
                ) : (
                  <Navigate to="/dashboard" replace />
                )
              }
            />

            <Route
              path="/forgot-password"
              element={<ForgotPassword />}
            />

            <Route
              path="/reset-password/:token"
              element={<ResetPassword />}
            />

            {/* Protected User Routes */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />

            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              }
            />

            {/* ======================================================
                LMS Routes
            ====================================================== */}

            <Route
              path="/courses"
              element={
                <ProtectedRoute>
                  <CourseCatalog />
                </ProtectedRoute>
              }
            />

            <Route
              path="/courses/:courseId"
              element={
                <ProtectedRoute>
                  <CourseDetails />
                </ProtectedRoute>
              }
            />

            <Route
              path="/courses/:courseId/lessons/:lessonId"
              element={
                <ProtectedRoute>
                  <LessonViewer />
                </ProtectedRoute>
              }
            />

            {/* Admin Routes */}
            <Route
              path="/admin/dashboard"
              element={
                <ProtectedRoute role="admin">
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />

            {/* 404 */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      )}

      <ToastContainer position="top-right" autoClose={3000} />
    </BrowserRouter>
  );
};

export default App;