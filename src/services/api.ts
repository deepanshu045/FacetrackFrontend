import type { Student, UserProfile } from "../types";

const API_BASE_URL = (import.meta as any).env.VITE_API_BASE_URL ?? "http://localhost:8000";

function getAuthToken() {
  return localStorage.getItem("token");
}

let authErrorHandler: (() => void) | null = null;

function getAuthHeaders(contentType?: string) {
  const headers = new Headers();
  const token = getAuthToken();
  if (token) {
    headers.set("Authorization", "Bearer " + token);
  }
  if (contentType) {
    headers.set("Content-Type", contentType);
  }
  return headers;
}

function handleAuthError(response: Response) {
  if (response.status === 401 && getAuthToken()) {
    clearAuthToken();
    if (authErrorHandler) {
      authErrorHandler();
    }
  }
}

async function handleResponse(response: Response) {
  await handleAuthError(response);

  const text = await response.text();
  const data = text ? JSON.parse(text) : null;

  if (!response.ok) {
    const message = data?.detail || data?.message || response.statusText;
    throw new Error(message || `Request failed with status ${response.status}`);
  }

  return data;
}

export async function login(collegeSlug: string, username: string, password: string) {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: "POST",
    headers: getAuthHeaders("application/json"),
    body: JSON.stringify({ college_slug: collegeSlug.trim().toLowerCase(), username, password }),
  });

  const data = await handleResponse(response);
  const token = data?.access_token || data?.token || data?.auth_token || data?.accessToken || data?.tokenValue;
  if (!token) throw new Error('Login response did not contain an access token');
  return { access_token: token, token_type: data?.token_type || 'bearer' };
}

export async function registerCollege(payload: {
  college_name: string;
  college_slug: string;
  username: string;
  name: string;
  email: string;
  password: string;
}) {
  const response = await fetch(`${API_BASE_URL}/auth/register-college`, {
    method: "POST",
    headers: getAuthHeaders("application/json"),
    body: JSON.stringify({
      ...payload,
      college_name: payload.college_name.trim(),
      college_slug: payload.college_slug.trim().toLowerCase(),
      username: payload.username.trim(),
      email: payload.email.trim().toLowerCase(),
    }),
  });
  return handleResponse(response) as Promise<{ message: string }>;
}

export async function verifyCollegeEmail(token: string) {
  const response = await fetch(`${API_BASE_URL}/auth/verify-college-email?token=${encodeURIComponent(token)}`, {
    method: "POST",
  });
  return handleResponse(response) as Promise<{ username: string; email: string }>;
}

export async function registerAdmin(payload: {
  username: string;
  name: string;
  email: string;
  password: string;
}) {
  const response = await fetch(`${API_BASE_URL}/auth/register-admin`, {
    method: "POST",
    headers: getAuthHeaders("application/json"),
    body: JSON.stringify({
      ...payload,
      username: payload.username.trim(),
      email: payload.email.trim().toLowerCase(),
    }),
  });
  return handleResponse(response) as Promise<{ id: number; username: string; name: string | null; email: string }>;
}

export interface CollegeAdmin {
  id: number;
  username: string;
  name: string | null;
  email: string;
}

export async function fetchCollegeAdmins() {
  const response = await fetch(`${API_BASE_URL}/auth/admins`, { headers: getAuthHeaders() });
  return handleResponse(response) as Promise<CollegeAdmin[]>;
}

export async function deleteCollegeAdmin(adminId: number) {
  const response = await fetch(`${API_BASE_URL}/auth/admins/${adminId}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });
  return handleResponse(response) as Promise<{ success: boolean }>;
}

export async function fetchStudents(): Promise<Student[]> {
  const response = await fetch(`${API_BASE_URL}/students`, {
    headers: getAuthHeaders(),
  });

  return handleResponse(response) as Promise<Student[]>;
}

export async function searchStudents(query: string): Promise<Student[]> {
  const params = new URLSearchParams({ query });
  const response = await fetch(`${API_BASE_URL}/students?${params.toString()}`, {
    headers: getAuthHeaders(),
  });

  return handleResponse(response) as Promise<Student[]>;
}

export async function addStudent(payload: Partial<Student>): Promise<Student> {
  const response = await fetch(`${API_BASE_URL}/students/register`, {
    method: "POST",
    headers: getAuthHeaders("application/json"),
    body: JSON.stringify(payload),
  });

  return handleResponse(response) as Promise<Student>;
}

export async function updateStudent(id: number, payload: Partial<Student>): Promise<Student | null> {
  const response = await fetch(`${API_BASE_URL}/students/${id}`, {
    method: "PUT",
    headers: getAuthHeaders("application/json"),
    body: JSON.stringify(payload),
  });

  if (response.status === 404) {
    return null;
  }

  return handleResponse(response) as Promise<Student>;
}

export async function deleteStudent(id: number): Promise<boolean> {
  const response = await fetch(`${API_BASE_URL}/students/${id}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });

  if (response.status === 404) {
    return false;
  }

  await handleResponse(response);
  return true;
}

export async function uploadFace(studentId: number, file: Blob) {
  const formData = new FormData();
  formData.append("file", file, `face-${studentId}.jpg`);

  const response = await fetch(`${API_BASE_URL}/students/upload-face/${studentId}`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: formData,
  });

  return handleResponse(response) as Promise<{ message: string }>;
}

export async function fetchProfile() {
  const response = await fetch(`${API_BASE_URL}/auth/me`, {
    headers: getAuthHeaders(),
  });

  return handleResponse(response) as Promise<UserProfile>;
}

export async function updateProfile(payload: Partial<UserProfile>) {
  const response = await fetch(`${API_BASE_URL}/auth/me`, {
    method: "PUT",
    headers: getAuthHeaders("application/json"),
    body: JSON.stringify(payload),
  });

  return handleResponse(response) as Promise<any>;
}

export async function changePassword(currentPassword: string, newPassword: string) {
  const response = await fetch(`${API_BASE_URL}/auth/change-password`, {
    method: "POST",
    headers: getAuthHeaders("application/json"),
    body: JSON.stringify({
      current_password: currentPassword,
      new_password: newPassword,
    }),
  });

  return handleResponse(response) as Promise<any>;
}

export async function setCollegeAccessCode(accessCode: string) {
  const response = await fetch(`${API_BASE_URL}/auth/college/access-code`, {
    method: "PUT",
    headers: getAuthHeaders("application/json"),
    body: JSON.stringify({ access_code: accessCode }),
  });
  return handleResponse(response) as Promise<{ success: boolean }>;
}

export async function fetchTodayAttendance() {
  const response = await fetch(`${API_BASE_URL}/reports/today`, {
    headers: getAuthHeaders(),
  });
  return handleResponse(response) as Promise<Array<any>>;
}

export async function fetchAttendanceByStudent(studentId: number) {
  const response = await fetch(`${API_BASE_URL}/reports/student/${studentId}`, {
    headers: getAuthHeaders(),
  });
  return handleResponse(response) as Promise<Array<any>>;
}

export async function fetchAttendanceByDate(attendanceDate: string) {
  // attendanceDate should be YYYY-MM-DD
  const response = await fetch(`${API_BASE_URL}/reports/date/${attendanceDate}`, {
    headers: getAuthHeaders(),
  });
  return handleResponse(response) as Promise<Array<any>>;
}

export async function fetchMonthlyAttendance(year: number, month: number) {
  const response = await fetch(`${API_BASE_URL}/reports/monthly/${year}/${month}`, {
    headers: getAuthHeaders(),
  });
  return handleResponse(response) as Promise<Array<any>>;
}

export async function markAttendanceFromImage(image: Blob) {
  const formData = new FormData();
  formData.append("file", image, "attendance.jpg");

  const response = await fetch(`${API_BASE_URL}/recognition/match`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: formData,
  });

  return handleResponse(response) as Promise<any>;
}

export async function markAttendanceForStudent(studentId: number) {
  const response = await fetch(`${API_BASE_URL}/recognition/manual`, {
    method: "POST",
    headers: getAuthHeaders("application/json"),
    body: JSON.stringify({ student_id: studentId }),
  });

  return handleResponse(response) as Promise<any>;
}


export function setAuthToken(token: string) {
  localStorage.setItem("token", token);
}

export function clearAuthToken() {
  localStorage.removeItem("token");
}

export function getStoredAuthToken() {
  return getAuthToken();
}

export function setAuthErrorHandler(handler: (() => void) | null) {
  authErrorHandler = handler;
}
