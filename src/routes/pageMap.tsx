import DashboardPage from "../pages/DashboardPage";
import StudentsPage from "../pages/StudentsPage";
import LiveAttendancePage from "../pages/LiveAttendancePage";
import UploadPage from "../pages/UploadPage";
import ReportsPage from "../pages/ReportsPage";
import ProfilePage from "../pages/ProfilePage";
import SettingsPage from "../pages/SettingsPage";

import type { Page } from "../types";
import type { ReactNode } from "react";

export const pageMap: Record<Page, ReactNode> = {
  dashboard: <DashboardPage />,
  students: <StudentsPage />,
  "upload-face": <UploadPage />,
  "live-attendance": <LiveAttendancePage />,
  reports: <ReportsPage />,
  profile: <ProfilePage />,
  settings: <SettingsPage />,
  login: <DashboardPage />, // never rendered after login check
};