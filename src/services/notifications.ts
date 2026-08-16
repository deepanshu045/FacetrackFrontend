export interface NotificationItem {
  id: number;
  type: "attendance" | string;
  message: string;
  created_at: string;
  lecture_id?: number;
  subject?: string;
  attendance_date?: string;
  status?: string;
}

// Keep notifications on the same API base as the rest of the frontend.
// This prevents local development from accidentally calling the deployed backend.
const API_BASE_URL = ((import.meta as any).env.VITE_API_URL || "http://127.0.0.1:8000").replace(/\/$/, "");

export async function fetchNotifications(limit = 8): Promise<NotificationItem[]> {
  const token = localStorage.getItem("token");
  const response = await fetch(`${API_BASE_URL}/notifications/?limit=${encodeURIComponent(String(limit))}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });

  const text = await response.text();
  let data: any = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }

  if (!response.ok) {
    const detail = Array.isArray(data?.detail)
      ? data.detail.map((x: any) => x?.msg || String(x)).join(", ")
      : data?.detail || data?.message || response.statusText;
    throw new Error(detail || `Request failed with status ${response.status}`);
  }

  return data as NotificationItem[];
}
