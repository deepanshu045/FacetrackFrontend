import type { StudentAttendanceSummary } from "../types";

const API_BASE_URL = ((import.meta as any).env.VITE_API_URL || "http://127.0.0.1:8000").replace(/\/$/, "");

export async function fetchStudentAttendanceSummary(studentId: number): Promise<StudentAttendanceSummary> {
  const token = localStorage.getItem("token");
  const headers = new Headers();
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const response = await fetch(`${API_BASE_URL}/reports/student/${studentId}/summary`, { headers });
  const text = await response.text();
  let data: any = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }

  if (!response.ok) {
    const detail = Array.isArray(data?.detail)
      ? data.detail.map((item: any) => item?.msg || String(item)).join(", ")
      : data?.detail || data?.message || response.statusText;
    throw new Error(detail || `Request failed with status ${response.status}`);
  }

  return data as StudentAttendanceSummary;
}
