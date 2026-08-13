// Mock data for the application
import type { Student, AttendanceRecord } from "../types";

export const DEPARTMENTS = [
  "All",
  "Computer Science",
  "Electronics",
  "Mechanical",
  "Civil",
  "Electrical",
  "Chemical",
];

export const STUDENTS: Student[] = [
  {
    id: 1,
    roll_no: "CS001",
    name: "Aarav Kumar",
    email: "aarav@example.com",
    phone_no: "9876543210",
    department: "Computer Science",
    image_path: null,
    has_face: true,
    created_at: "2024-01-15T10:30:00Z",
  },
  {
    id: 2,
    roll_no: "CS002",
    name: "Bhavna Singh",
    email: "bhavna@example.com",
    phone_no: "9876543211",
    department: "Computer Science",
    image_path: null,
    has_face: true,
    created_at: "2024-01-15T10:30:00Z",
  },
  {
    id: 3,
    roll_no: "EC001",
    name: "Chirag Patel",
    email: "chirag@example.com",
    phone_no: "9876543212",
    department: "Electronics",
    image_path: null,
    has_face: false,
    created_at: "2024-01-15T10:30:00Z",
  },
  {
    id: 4,
    roll_no: "ME001",
    name: "Diana Sharma",
    email: "diana@example.com",
    phone_no: "9876543213",
    department: "Mechanical",
    image_path: null,
    has_face: true,
    created_at: "2024-01-15T10:30:00Z",
  },
  {
    id: 5,
    roll_no: "CV001",
    name: "Ethan Gupta",
    email: "ethan@example.com",
    phone_no: "9876543214",
    department: "Civil",
    image_path: null,
    has_face: true,
    created_at: "2024-01-15T10:30:00Z",
  },
];

export const WEEKLY_DATA = [
  { day: "Mon", attendance: 45 },
  { day: "Tue", attendance: 52 },
  { day: "Wed", attendance: 48 },
  { day: "Thu", attendance: 61 },
  { day: "Fri", attendance: 55 },
  { day: "Sat", attendance: 30 },
  { day: "Sun", attendance: 20 },
];

export const MONTHLY_DATA = Array.from({ length: 30 }).map((_, i) => ({
  month: `${i + 1}`,
  attendance: Math.floor(Math.random() * 100) + 20,
}));

export const DEPT_DATA = [
  { name: "Computer Science", value: 35, color: "#2563EB" },
  { name: "Electronics", value: 25, color: "#10B981" },
  { name: "Mechanical", value: 20, color: "#8B5CF6" },
  { name: "Civil", value: 12, color: "#F59E0B" },
  { name: "Electrical", value: 8, color: "#EF4444" },
];

export const ATTENDANCE: AttendanceRecord[] = [
  {
    id: 1,
    student_id: 1,
    attendance_date: "2024-08-13",
    attendance_time: "09:30:00",
    student_name: "Aarav Kumar",
    roll_no: "CS001",
    department: "Computer Science",
  },
  {
    id: 2,
    student_id: 2,
    attendance_date: "2024-08-13",
    attendance_time: "09:35:00",
    student_name: "Bhavna Singh",
    roll_no: "CS002",
    department: "Computer Science",
  },
  {
    id: 3,
    student_id: 4,
    attendance_date: "2024-08-13",
    attendance_time: "09:32:00",
    student_name: "Diana Sharma",
    roll_no: "ME001",
    department: "Mechanical",
  },
  {
    id: 4,
    student_id: 5,
    attendance_date: "2024-08-13",
    attendance_time: "09:40:00",
    student_name: "Ethan Gupta",
    roll_no: "CV001",
    department: "Civil",
  },
];
