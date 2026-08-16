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
  email?: string | null;
  phone_no?: string | null;
  department: string;
  class_name?: string | null;
  section?: string | null;
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

export interface TeacherAssignment {
  id: number;
  teacher_id: number;
  class_section_id: number;
}

export interface Lecture {
  id: number;
  college_id: number;
  class_section_id?: number | null;
  teacher_id?: number | null;
  subject: string;
  department?: string | null;
  class_name?: string | null;
  section?: string | null;
  lecture_date: string;
  start_time: string;
  end_time: string;
  status: "Scheduled" | "Cancelled" | string;
  created_at?: string | null;
}

export interface LectureSchedule {
  id: number;
  college_id: number;
  class_section_id?: number | null;
  subject: string;
  department?: string | null;
  class_name?: string | null;
  section?: string | null;
  day_of_week: number;
  start_time: string;
  end_time: string;
}

export interface CollegeClosure {
  id: number;
  college_id: number;
  closure_date: string;
  reason: "Holiday" | "Event" | "Emergency" | "Other" | string;
  description?: string | null;
}

export interface Attendance {
  id: number;
  student_id: number;
  lecture_id: number;
  marked_at: string;
  status: "Present" | "Absent" | string;
}

export interface AttendanceReport {
  student_id: number;
  roll_no: string;
  name: string;
  department: string;
  attendance_date: string;
  attendance_time: string;
}

export interface TeacherAttendanceRow {
  student_id: number;
  roll_no: string;
  name: string;
  status: "Present" | "Absent";
  attendance_id: number | null;
}

export interface RecognitionAttendanceResult {
  matched: boolean;
  attendance_marked: boolean;
  message: string;
  student_id?: number;
  roll_no?: string;
  name?: string;
  department?: string;
  attendance_id?: number;
  date?: string;
  time?: string;
}

export interface Notification {
  id: number;
  type: string;
  message: string;
  created_at: string;
  lecture_id?: number;
  subject?: string;
  attendance_date?: string;
  status?: string;
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
  college_id?: number;
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
