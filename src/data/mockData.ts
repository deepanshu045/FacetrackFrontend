
import { Student, AttendanceRecord, WeeklyAttendance, DepartmentData, MonthlyAttendance } from "../types";

export const STUDENTS: Student[] = [
  {
    id: 1,
    roll_no: "R001",
    name: "Alice Johnson",
    email: "alice@example.com",
    department: "CSE",
    face_image: null,
    face_encoding: null,
    created_at: new Date().toISOString(),
  },
  {
    id: 2,
    roll_no: "R002",
    name: "Bob Smith",
    email: "bob@example.com",
    department: "ECE",
    face_image: null,
    face_encoding: null,
    created_at: new Date().toISOString(),
  },
];

export const DEPARTMENTS = [
"Science",
"Arts",
"Commerce",
"All"
];

export const ATTENDANCE: AttendanceRecord[] = [
  {
    id: 1,
    student_id: 1,
    attendance_date: "2025-07-30",
    attendance_time: "09:00",
    student_name: "Alice Johnson",
    roll_no: "R001",
    department: "CSE",
  },
  {
    id: 2,
    student_id: 2,
    attendance_date: "2025-07-30",
    attendance_time: "09:05",
    student_name: "Bob Smith",
    roll_no: "R002",
    department: "ECE",
  },
];

export const WEEKLY_DATA: WeeklyAttendance[] = [
  { day: "Mon", attendance: 20 },
  { day: "Tue", attendance: 22 },
  { day: "Wed", attendance: 18 },
  { day: "Thu", attendance: 25 },
  { day: "Fri", attendance: 19 },
  { day: "Sat", attendance: 12 },
  { day: "Sun", attendance: 0 },
];

export const MONTHLY_DATA: MonthlyAttendance[] = [
  { month: "Jan", attendance: 400 },
  { month: "Feb", attendance: 380 },
  { month: "Mar", attendance: 420 },
];

export const DEPT_DATA: DepartmentData[] = [
  { name: "CSE", value: 120, color: "#3b82f6" },
  { name: "ECE", value: 80, color: "#ef4444" },
  { name: "MECH", value: 60, color: "#10b981" },
];
