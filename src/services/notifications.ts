export interface NotificationItem {
  id: number;
  type: "attendance";
  message: string;
  created_at: string;
}

const API_BASE_URL = (import.meta as any).env.VITE_API_URL || "https://facetrack-ggbe.onrender.com";

export async function fetchNotifications(): Promise<NotificationItem[]> {
  const token = localStorage.getItem("token");
  const response = await fetch(`${API_BASE_URL}/notifications/`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  const text = await response.text();
  const data = text ? JSON.parse(text) : null;

  if (!response.ok) {
    throw new Error(data?.detail || data?.message || response.statusText);
  }

  return data as NotificationItem[];
}
