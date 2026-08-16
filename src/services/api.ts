import type { Student, UserProfile } from "../types";

const API_BASE_URL = (import.meta as any).env.VITE_API_URL;

function getAuthToken() {
  return localStorage.getItem("token");
}

let authErrorHandler: (() => void) | null = null;

function getAuthHeaders(contentType?: string) {
  const headers = new Headers();
  const token = getAuthToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);
  if (contentType) headers.set("Content-Type", contentType);
  return headers;
}

async function handleResponse(response: Response) {
  if (response.status === 401 && getAuthToken()) {
    clearAuthToken();
    authErrorHandler?.();
  }

  const text = await response.text();
  let data: any = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = text; }

  if (!response.ok) {
    const detail = Array.isArray(data?.detail)
      ? data.detail.map((x: any) => x?.msg || String(x)).join(", ")
      : data?.detail || data?.message || response.statusText;
    throw new Error(detail || `Request failed with status ${response.status}`);
  }
  return data;
}

async function request(path: string, options: RequestInit = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: options.headers || getAuthHeaders(),
  });
  return handleResponse(response);
}

export async function login(collegeSlug: string, username: string, password: string) {
  const data = await request("/auth/login", {
    method: "POST",
    headers: getAuthHeaders("application/json"),
    body: JSON.stringify({ college_slug: collegeSlug.trim().toLowerCase(), username: username.trim(), password }),
  });
  const token = data?.access_token || data?.token || data?.auth_token || data?.accessToken || data?.tokenValue;
  if (!token) throw new Error("Login response did not contain an access token");
  return { access_token: token, token_type: data?.token_type || "bearer" };
}

export async function registerCollege(payload: { college_name: string; college_slug: string; username: string; name: string; email: string; password: string }) {
  return request("/auth/register-college", {
    method: "POST", headers: getAuthHeaders("application/json"),
    body: JSON.stringify({ ...payload, college_name: payload.college_name.trim(), college_slug: payload.college_slug.trim().toLowerCase(), username: payload.username.trim(), email: payload.email.trim().toLowerCase() }),
  }) as Promise<{ message: string }>;
}

export async function verifyCollegeEmail(token: string) {
  return request(`/auth/verify-college-email?token=${encodeURIComponent(token)}`, { method: "POST" }) as Promise<{ username: string; email: string }>;
}

export async function registerAdmin(payload: { username: string; name: string; email: string; password: string }) {
  return request("/auth/register-admin", { method: "POST", headers: getAuthHeaders("application/json"), body: JSON.stringify(payload) });
}

export interface CollegeAdmin { id: number; username: string; name: string | null; email: string; }
export async function fetchCollegeAdmins() { return request("/auth/admins") as Promise<CollegeAdmin[]>; }
export async function deleteCollegeAdmin(adminId: number) { return request(`/auth/admins/${adminId}`, { method: "DELETE" }); }

export async function fetchStudents(): Promise<Student[]> { return request("/students") as Promise<Student[]>; }
export async function searchStudents(query: string): Promise<Student[]> { return request(`/students?query=${encodeURIComponent(query)}`) as Promise<Student[]>; }
export async function addStudent(payload: Partial<Student>): Promise<Student> { return request("/students/register", { method: "POST", headers: getAuthHeaders("application/json"), body: JSON.stringify(payload) }) as Promise<Student>; }
export async function updateStudent(id: number, payload: Partial<Student>): Promise<Student | null> {
  try { return await request(`/students/${id}`, { method: "PUT", headers: getAuthHeaders("application/json"), body: JSON.stringify(payload) }) as Student; }
  catch (e: any) { if (String(e?.message).toLowerCase().includes("not found")) return null; throw e; }
}
export async function deleteStudent(id: number) { try { await request(`/students/${id}`, { method: "DELETE" }); return true; } catch (e: any) { if (String(e?.message).toLowerCase().includes("not found")) return false; throw e; } }
export async function uploadFace(studentId: number, file: Blob) {
  const formData = new FormData(); formData.append("file", file, `face-${studentId}.jpg`);
  return request(`/students/upload-face/${studentId}`, { method: "POST", headers: getAuthHeaders(), body: formData }) as Promise<{ message: string }>;
}

export interface ClassSection { id: number; college_id: number; department: string; class_name: string; section: string; is_active?: boolean; }
export async function fetchClassSections() { return request("/class-sections") as Promise<ClassSection[]>; }
export async function createClassSection(payload: { department: string; class_name: string; section: string }) { return request("/class-sections", { method: "POST", headers: getAuthHeaders("application/json"), body: JSON.stringify(payload) }) as Promise<ClassSection>; }
export async function deleteClassSection(id: number) { return request(`/class-sections/${id}`, { method: "DELETE" }); }

export interface Teacher { id: number; college_id: number; username: string; name: string; email?: string | null; is_active: boolean; }
export async function createTeacher(payload: { username: string; name: string; email?: string; password: string }) { return request("/teachers", { method: "POST", headers: getAuthHeaders("application/json"), body: JSON.stringify(payload) }) as Promise<Teacher>; }
export async function fetchTeachers() { return request("/teachers") as Promise<Teacher[]>; }
export async function loginTeacher(username: string, password: string) {
  const data = await request("/teachers/login", { method: "POST", headers: getAuthHeaders("application/json"), body: JSON.stringify({ username: username.trim(), password }) });
  const token = data?.access_token || data?.token;
  if (!token) throw new Error("Teacher login response did not contain an access token");
  return { access_token: token, token_type: data?.token_type || "bearer" };
}
export async function fetchTeacherMe() { return request("/teachers/me") as Promise<Teacher>; }
export async function fetchTeacherClasses() { return request("/teachers/me/classes") as Promise<ClassSection[]>; }
export async function assignTeacherClass(teacherId: number, classSectionId: number) { return request(`/teachers/admin/${teacherId}/classes`, { method: "POST", headers: getAuthHeaders("application/json"), body: JSON.stringify({ class_section_id: classSectionId }) }); }
export async function fetchTeacherLectures() { return request("/teachers/me/lectures") as Promise<Lecture[]>; }

export interface Lecture { id: number; college_id: number; subject: string; lecture_date: string; start_time: string; end_time: string; status: string; class_section_id?: number | null; teacher_id?: number | null; }
export async function fetchLectures(date?: string) { return request(date ? `/lectures?lecture_date=${encodeURIComponent(date)}` : "/lectures") as Promise<Lecture[]>; }
export async function createLecture(payload: Partial<Lecture>) { return request("/lectures", { method: "POST", headers: getAuthHeaders("application/json"), body: JSON.stringify(payload) }) as Promise<Lecture>; }
export async function updateLecture(id: number, payload: Partial<Lecture>) { return request(`/lectures/${id}`, { method: "PUT", headers: getAuthHeaders("application/json"), body: JSON.stringify(payload) }) as Promise<Lecture>; }
export async function deleteLecture(id: number) { return request(`/lectures/${id}`, { method: "DELETE" }); }

export async function fetchProfile() { return request("/auth/me") as Promise<UserProfile>; }
export async function updateProfile(payload: Partial<UserProfile>) { return request("/auth/me", { method: "PUT", headers: getAuthHeaders("application/json"), body: JSON.stringify(payload) }); }
export async function changePassword(currentPassword: string, newPassword: string) { return request("/auth/change-password", { method: "POST", headers: getAuthHeaders("application/json"), body: JSON.stringify({ current_password: currentPassword, new_password: newPassword }) }); }
export async function setCollegeAccessCode(accessCode: string) { return request("/auth/college/access-code", { method: "PUT", headers: getAuthHeaders("application/json"), body: JSON.stringify({ access_code: accessCode }) }); }

export async function fetchTodayAttendance() { return request("/reports/today") as Promise<any[]>; }
export async function fetchAttendanceByStudent(studentId: number) { return request(`/reports/student/${studentId}`) as Promise<any[]>; }
export async function fetchAttendanceByDate(attendanceDate: string) { return request(`/reports/date/${attendanceDate}`) as Promise<any[]>; }
export async function fetchMonthlyAttendance(year: number, month: number) { return request(`/reports/monthly/${year}/${month}`) as Promise<any[]>; }

export async function markAttendanceFromImage(image: Blob) {
  const formData = new FormData(); formData.append("file", image, "attendance.jpg");
  return request("/recognition/match", { method: "POST", headers: getAuthHeaders(), body: formData });
}
export async function markAttendanceForStudent(studentId: number) { return request("/recognition/manual", { method: "POST", headers: getAuthHeaders("application/json"), body: JSON.stringify({ student_id: studentId }) }); }
export async function getLectureAttendance(lectureId: number) { return request(`/teachers/me/lectures/${lectureId}/attendance`) as Promise<any[]>; }
export async function markTeacherAttendance(lectureId: number, studentId: number, status: string = "Present") { return request(`/teachers/me/lectures/${lectureId}/attendance`, { method: "POST", headers: getAuthHeaders("application/json"), body: JSON.stringify({ student_id: studentId, status }) }); }
export async function markAllTeacherAttendance(lectureId: number, status: string = "Present") { return request(`/teachers/me/lectures/${lectureId}/mark-all`, { method: "POST", headers: getAuthHeaders("application/json"), body: JSON.stringify({ status }) }); }

export function setAuthToken(token: string) { localStorage.setItem("token", token); }
export function clearAuthToken() { localStorage.removeItem("token"); }
export function getStoredAuthToken() { return getAuthToken(); }
export function setAuthErrorHandler(handler: (() => void) | null) { authErrorHandler = handler; }
