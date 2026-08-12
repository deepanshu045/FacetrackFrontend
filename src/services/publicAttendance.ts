export interface PublicAttendanceRecord {
  student_id: number;
  roll_no: string;
  name: string;
  department: string;
  attendance_date: string;
  attendance_time: string;
}

export interface PublicAttendanceReport {
  student: Pick<PublicAttendanceRecord, "roll_no" | "name" | "department">;
  records: PublicAttendanceRecord[];
}

const API_BASE_URL = (import.meta as any).env.VITE_API_BASE_URL ?? "http://localhost:8000";

export async function fetchPublicAttendance(collegeSlug: string, rollNo: string): Promise<PublicAttendanceReport> {
  const response = await fetch(
    `${API_BASE_URL}/public/${encodeURIComponent(collegeSlug.trim().toLowerCase())}/attendance/${encodeURIComponent(rollNo.trim())}`
  );
  const text = await response.text();
  const data = text ? JSON.parse(text) : null;

  if (!response.ok) {
    throw new Error(data?.detail || "Unable to find an attendance report");
  }

  return data as PublicAttendanceReport;
}
