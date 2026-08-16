export type Page =
  | "login"
  | "dashboard"
  | "students"
  | "upload-face"
  | "live-attendance"
  | "reports"
  | "profile"
  | "settings"
  | "class-sections"
  | "teachers"
  | "lectures"
  | "schedules"
  | "closures";

export interface ClassSection {
  id: number;
  college_id: number;
  department: string;
  class_name: string;
  section: string;
  is_active?: boolean;
}

export interface Student {
  id: number;
  college_id?: number;
  roll_no: string;
  name: string;
  email: string;
  phone_no?: string;
  department: string;
  class_name?: string;
  section?: string;
  class_section_id?: number | null;
  image_path?: string | null;
  has_face: boolean;
  created_at?: string;
}

export interface Teacher {
  id: number;
  college_id: number;
  username: string;
  name: string;
  email?: string | null;
  is_active: boolean;
  created_at?: string;
}

export interface Lecture {
  id: number;
  college_id: number;
  class_section_id?: number | null;
  teacher_id?: number | null;
  subject: string;
  lecture_date: string;
  start_time: string;
  end_time: string;
  status: string;
}

export interface Attendance {
  id: number;
  student_id: number;
  lecture_id: number;
  marked_at: string;
  status?: string;
}

export interface AttendanceRecord {
  id: number;
  student_id: number;
  lecture_id?: number;
  attendance_date?: string;
  attendance_time?: string;
  student_name: string;
  roll_no: string;
  department: string;
  status?: string;
  marked_at?: string;
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
