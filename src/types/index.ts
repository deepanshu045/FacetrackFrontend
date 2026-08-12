// src/types/index.ts

export type Page =
  | "login"
  | "dashboard"
  | "students"
  | "upload-face"
  | "live-attendance"
  | "reports"
  | "profile"
  | "settings";

export interface Student {
  id: number;
  roll_no: string;
  name: string;
  email: string;
  phone_no?: string;
  department: string;
  image_path?: string | null;
  has_face: boolean;
  created_at?: string;
}

export interface AttendanceRecord {
  id: number;
  student_id: number;
  attendance_date: string;
  attendance_time: string;
  student_name: string;
  roll_no: string;
  department: string;
}

export interface UserProfile {
  id: number;
  username: string;
  name?: string | null;
  email: string;
  notifications: boolean;
  email_alerts: boolean;
  sound_alerts: boolean;
  threshold: number;
  resolution: string;
  fps: string;
  language: string;
}

export interface DepartmentData {
  name: string;
  value: number;
  color: string;
}

export interface WeeklyAttendance {
  day: string;
  attendance: number;
}

export interface MonthlyAttendance {
  month: string;
  attendance: number;
}
