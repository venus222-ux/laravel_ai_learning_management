// ==================== AUTH ====================

export type Role = "user" | "moderator" | "admin";

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  role: Role;
  token_type?: string;
  expires_in?: number;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
}

// ==================== USER ====================

export interface UserRole {
  id?: number;
  name: Role;
}

export interface User {
  id: number;
  name: string;
  email: string;
  created_at: string;
  roles?: UserRole[];
}

// ==================== PROFILE ====================

export interface ProfileData {
  email: string;
  created_at?: string;
}

export interface ProfileUpdateRequest {
  email: string;
  password?: string;
  password_confirmation?: string;
}

export interface ProfileFormData {
  email: string;
  password: string;
  password_confirmation: string;
}

// ==================== API ====================

export interface APIMessageResponse {
  message: string;
}

// ==================== ACTIVITY LOG ====================

export interface ActivityLog {
  _id: string;
  email: string;
  action: string;
  status: "success" | "failed";
  ip_address: string;
  device: string;
  created_at: string;
}

// ==================== ADMIN DASHBOARD ====================

export interface DashboardStats {
  logins_today: number;
  failed_logins_today: number;
  active_users: number;
}

export interface DashboardData {
  stats: DashboardStats;
  recent_activity: ActivityLog[];
}

// ==================== UI ====================

export type Theme = "light" | "dark";

export type TabType = "home" | "logs" | "users" | "traffic";

// ==================== AUTH STORE ====================

export interface AuthState {
  isAuth: boolean;
  token: string | null;
  role: Role | null;
  theme: Theme;
  initialized: boolean;

  setAuth: (token: string, role: Role) => void;
  logout: () => void;
  setToken: (token: string | null) => void;
  toggleTheme: () => void;
  setInitialized: (value: boolean) => void;

  startTokenRefreshLoop: () => void;
  stopTokenRefreshLoop: () => void;
}

// ==================== LMS ====================

export interface Lesson {
  id: number;
  course_id: number;
  title: string;
  content?: string;
  order: number;
}

export interface Course {
  id: number;
  title: string;
  description: string;
  lessons_count?: number;
  lessons?: Lesson[];
}

// ==================== LMS STORE ====================

export interface LmsState {
  courses: Course[];
  activeCourse: Course | null;
  activeLesson: Lesson | null;
  isLoadingLms: boolean;

  fetchCoursesList: () => Promise<void>;
  fetchSingleCourse: (id: string | number) => Promise<void>;
  fetchSingleLesson: (
    courseId: string | number,
    lessonId: string | number
  ) => Promise<void>;
}