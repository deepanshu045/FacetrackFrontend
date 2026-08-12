import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  Bell,
  ChevronDown,
  LogOut,
  Menu,
  Search,
  Settings,
  User,
} from "lucide-react";

import Avatar from "../ui/Avatar";
import { Page } from "../../types";
import { cn } from "../../utils/cn";
import { useLogout } from "../../hooks/useLogout";
import { searchStudents } from "../../services/api";
import { fetchNotifications, type NotificationItem } from "../../services/notifications";
import type { Student } from "../../types";

interface NavbarProps {
  page: Page;
  sidebarWidth: number;
  onMenuToggle: () => void;
  onPage: (page: Page) => void;
  onLogout?: () => void;
}

const PAGE_TITLES: Record<Page, string> = {
  dashboard: "Dashboard",
  students: "Students",
  "upload-face": "Upload Face",
  "live-attendance": "Live Attendance",
  reports: "Reports",
  profile: "Profile",
  settings: "Settings",
  login: "Login",
};

function formatNotificationTime(createdAt: string) {
  const seconds = Math.max(0, Math.floor((Date.now() - new Date(createdAt).getTime()) / 1000));
  if (seconds < 60) return "Just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

export default function Navbar({
  page,
  sidebarWidth,
  onMenuToggle,
  onPage,
  onLogout = () => {},
}: NavbarProps) {
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState<Student[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [notificationsRead, setNotificationsRead] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  // Provide a centralized logout hook and prefer an explicit onLogout prop when passed
  const logoutHook = useLogout();
  const logout = onLogout ?? logoutHook;

  // Close dropdowns and clear search when navigating to a new page
  useEffect(() => {
    setNotifOpen(false);
    setProfileOpen(false);
    setSearch("");
    setSearchResults([]);
  }, [page]);

  useEffect(() => {
    const query = search.trim();
    if (!query) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    let cancelled = false;
    const timeout = window.setTimeout(async () => {
      setIsSearching(true);
      try {
        const results = await searchStudents(query);
        if (!cancelled) setSearchResults(results);
      } catch {
        if (!cancelled) setSearchResults([]);
      } finally {
        if (!cancelled) setIsSearching(false);
      }
    }, 300);

    return () => {
      cancelled = true;
      window.clearTimeout(timeout);
    };
  }, [search]);

  function selectStudent() {
    // selecting a search result should behave like navigating via sidebar
    setNotifOpen(false);
    setProfileOpen(false);
    setSearch("");
    setSearchResults([]);
    onPage("students");
  }

  useEffect(() => {
    let cancelled = false;

    async function loadNotifications() {
      setNotificationsLoading(true);
      try {
        const data = await fetchNotifications();
        if (!cancelled) setNotifications(data);
      } catch {
        if (!cancelled) setNotifications([]);
      } finally {
        if (!cancelled) setNotificationsLoading(false);
      }
    }

    void loadNotifications();
    return () => {
      cancelled = true;
    };
  }, [notifOpen]);

  return (
    <header
      className="fixed top-0 right-0 z-20 flex h-16 items-center gap-4 border-b border-white/6 bg-[#020817]/90 px-6 backdrop-blur-md transition-all duration-300"
      style={{ left: sidebarWidth }}
    >
      {/* Mobile Menu */}
      <button
        onClick={onMenuToggle}
        className="text-[#94A3B8] hover:text-white lg:hidden"
      >
        <Menu size={20} />
      </button>

      <h1 className="text-lg font-semibold text-white">
        {PAGE_TITLES[page]}
      </h1>

      <div className="flex-1" />

      {/* Search */}
      <div className="relative hidden sm:block">
        <Search
          size={15}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-[#475569]"
        />

        <input
          value={search}
          onChange={(e) => {
            // typing in search should close other dropdowns
            setNotifOpen(false);
            setProfileOpen(false);
            setSearch(e.target.value);
          }}
          onFocus={() => {
            setNotifOpen(false);
            setProfileOpen(false);
          }}
          placeholder="Search..."
          className="w-56 rounded-xl border border-white/10 bg-white/5 py-2 pl-9 pr-4 text-sm text-white placeholder:text-[#475569] focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-all"
        />

        {search.trim() && (
          <div className="absolute right-0 top-11 w-72 overflow-hidden rounded-xl border border-white/10 bg-[#1E293B] shadow-2xl">
            {isSearching ? (
              <p className="px-4 py-3 text-sm text-[#94A3B8]">Searching...</p>
            ) : searchResults.length ? (
              searchResults.slice(0, 6).map((student) => (
                <button
                  key={student.id}
                  type="button"
                  onClick={selectStudent}
                  className="block w-full px-4 py-3 text-left transition-colors hover:bg-white/5"
                >
                  <p className="text-sm font-medium text-white">{student.name}</p>
                  <p className="mt-0.5 text-xs text-[#94A3B8]">
                    {student.roll_no} · {student.department}
                  </p>
                </button>
              ))
            ) : (
              <p className="px-4 py-3 text-sm text-[#94A3B8]">No students found.</p>
            )}
          </div>
        )}
      </div>

      {/* Notifications */}
      <div className="relative">
        <button
          onClick={() => {
            setNotificationsRead(true);
            setProfileOpen(false); // close profile when opening notifications
            setNotifOpen((v) => !v);
          }}
          className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-[#94A3B8] transition-colors hover:bg-white/10 hover:text-white"
        >
          <Bell size={16} />
          {notifications.length > 0 && !notificationsRead && (
            <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-blue-500" />
          )}
        </button>

        <AnimatePresence>
          {notifOpen && (
            <motion.div
              initial={{ opacity: 0, y: 8, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.96 }}
              className="absolute right-0 top-12 w-72 overflow-hidden rounded-2xl border border-white/10 bg-[#1E293B] shadow-2xl"
            >
              <div className="border-b border-white/10 p-4">
                <p className="text-sm font-semibold text-white">
                  Notifications
                </p>
              </div>

              {notificationsLoading ? (
                <p className="px-4 py-3 text-sm text-[#94A3B8]">Loading notifications...</p>
              ) : notifications.length ? (
                notifications.map((item) => (
                  <div key={item.id} className="flex items-start gap-3 px-4 py-3">
                    <span className={cn("mt-1.5 h-2 w-2 flex-shrink-0 rounded-full bg-emerald-500")} />
                    <div>
                      <p className="text-sm text-white">{item.message}</p>
                      <p className="mt-0.5 text-xs text-[#94A3B8]">
                        {formatNotificationTime(item.created_at)}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="px-4 py-3 text-sm text-[#94A3B8]">No notifications yet.</p>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Profile */}
      <div className="relative">
        <button
          onClick={() => {
            setNotifOpen(false); // close notifications when opening profile
            setProfileOpen((v) => !v);
          }}
          className="flex items-center gap-2.5 rounded-xl px-2 py-1 transition-colors hover:bg-white/5"
        >
          <Avatar
            name="Admin User"
            size="sm"
          />

          <div className="hidden text-left sm:block">
            <p className="text-sm font-medium leading-none text-white">
              Admin User
            </p>

            <p className="mt-0.5 text-xs text-[#94A3B8]">
              Administrator
            </p>
          </div>

          <ChevronDown
            size={14}
            className="text-[#94A3B8]"
          />
        </button>

        <AnimatePresence>
          {profileOpen && (
            <motion.div
              initial={{ opacity: 0, y: 8, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.96 }}
              className="absolute right-0 top-12 w-48 overflow-hidden rounded-2xl border border-white/10 bg-[#1E293B] shadow-2xl"
            >
              {[
                { icon: User, label: "Profile", page: "profile" as const },
                { icon: Settings, label: "Settings", page: "settings" as const },
              ].map(({ icon: Icon, label, page: targetPage }) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => {
                    setProfileOpen(false);
                    onPage(targetPage);
                  }}
                  className="flex w-full items-center gap-3 px-4 py-3 text-sm text-[#94A3B8] transition-colors hover:bg-white/5 hover:text-white"
                >
                  <Icon size={15} />
                  {label}
                </button>
              ))}

              <div className="border-t border-white/10">
                <button
                  onClick={logout}
                  className="flex w-full items-center gap-3 px-4 py-3 text-sm text-red-400 transition-colors hover:bg-red-500/10"
                >
                  <LogOut size={15} />
                  Logout
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
}
