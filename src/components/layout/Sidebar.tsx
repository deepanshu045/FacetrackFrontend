import { AnimatePresence, motion } from "motion/react";
import {
  BarChart3,
  CalendarDays,
  Camera,
  ChevronLeft,
  ChevronRight,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  Radio,
  Settings,
  User,
  Users,
  XCircle,
} from "lucide-react";

import { Page } from "../../types";
import { cn } from "../../utils/cn";
import { useAppContext } from "../../context/AppContext";
import { clearAuthToken } from "../../services/api";
import FaceTrackMark from "../branding/FaceTrackMark";

const NAV_ITEMS: { id: Page; label: string; icon: typeof LayoutDashboard }[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "class-sections", label: "Class Sections", icon: GraduationCap },
  { id: "students", label: "Students", icon: Users },
  { id: "teachers", label: "Teachers", icon: User },
  { id: "lectures", label: "Lectures", icon: CalendarDays },
  { id: "schedules", label: "Weekly Schedule", icon: CalendarDays },
  { id: "closures", label: "College Closures", icon: XCircle },
  { id: "upload-face", label: "Upload Face", icon: Camera },
  { id: "live-attendance", label: "Live Attendance", icon: Radio },
  { id: "reports", label: "Reports", icon: BarChart3 },
  { id: "profile", label: "Profile", icon: User },
  { id: "settings", label: "Settings", icon: Settings },
];

interface SidebarProps {
  page: Page;
  onPage: (page: Page) => void;
  collapsed: boolean;
  onToggle: () => void;
}

export default function Sidebar({ page, onPage, collapsed, onToggle }: SidebarProps) {
  const appCtx = useAppContext();

  return (
    <motion.aside animate={{ width: collapsed ? 72 : 240 }} transition={{ duration: 0.25, ease: "easeInOut" }} className="fixed left-0 top-0 z-30 flex h-full flex-col overflow-hidden border-r border-white/6 bg-[#0F172A]">
      <div className="flex h-16 flex-shrink-0 items-center gap-3 border-b border-white/6 p-5">
        <FaceTrackMark size="sm" />
        <AnimatePresence>
          {!collapsed && <motion.span initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -8 }} className="whitespace-nowrap text-sm font-bold text-white">FaceTrack</motion.span>}
        </AnimatePresence>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {NAV_ITEMS.map(({ id, label, icon: Icon }) => {
          const active = page === id;
          return <button key={id} onClick={() => onPage(id)} className={cn("group relative flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200", active ? "bg-blue-600/15 text-blue-400 shadow-[0_0_20px_rgba(37,99,235,0.15)]" : "text-[#94A3B8] hover:bg-white/5 hover:text-white")}>
            {active && <div className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full bg-blue-500" />}
            <Icon size={18} className="flex-shrink-0" />
            <AnimatePresence>{!collapsed && <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="whitespace-nowrap">{label}</motion.span>}</AnimatePresence>
          </button>;
        })}
      </nav>

      <div className="space-y-1 border-t border-white/6 p-3">
        <button onClick={() => { if (appCtx?.logout) appCtx.logout(); else { try { clearAuthToken(); } catch {} onPage("login"); } }} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-[#94A3B8] transition-all hover:bg-red-500/10 hover:text-red-400">
          <LogOut size={18} className="flex-shrink-0" />
          {!collapsed && <span>Logout</span>}
        </button>
        <button onClick={onToggle} className="flex w-full items-center justify-center rounded-xl px-3 py-2 text-[#94A3B8] transition-all hover:bg-white/5 hover:text-white">
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>
    </motion.aside>
  );
}
