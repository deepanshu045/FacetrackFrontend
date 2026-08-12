import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Toaster } from "sonner";

import Sidebar from "../components/layout/Sidebar";
import Navbar from "../components/layout/Navbar";
import LoginPage from "../pages/LoginPage";
import PublicAttendancePage from "../pages/PublicAttendancePage";
import VerifyCollegePage from "../pages/VerifyCollegePage";

import { pageMap } from "../routes/pageMap";
import { clearAuthToken, getStoredAuthToken, setAuthToken, setAuthErrorHandler } from "../services/api";
import { AppProvider } from "../context/AppContext";

import type { Page } from "../types";

export default function App() {
  const isPublicAttendancePage = window.location.pathname === "/student-attendance";
  const isCollegeVerificationPage = window.location.pathname === "/verify-college";
  const [token, setToken] = useState<string | null>(
    getStoredAuthToken()
  );

  const [page, setPage] = useState<Page>(
    token ? "dashboard" : "login"
  );

  const [collapsed, setCollapsed] = useState(false);
  const isLoggedIn = !!token;

  const sidebarWidth = collapsed ? 72 : 240;

  const logout = () => {
    clearAuthToken();
    setToken(null);
    setPage("login");
  };

  // Centralized page change handler to ensure navigation is consistent
  function handlePageChange(next: Page) {
    // useful during debugging — can be removed later
    // eslint-disable-next-line no-console
    console.log("navigate to", next);
    setPage(next);
  }

  useEffect(() => {
    setAuthErrorHandler(logout);
    return () => setAuthErrorHandler(null);
  }, [logout]);

  if (isPublicAttendancePage) {
    return (
      <>
        <Toaster position="top-right" theme="dark" />
        <PublicAttendancePage />
      </>
    );
  }

  if (isCollegeVerificationPage) {
    return <><Toaster position="top-right" theme="dark" /><VerifyCollegePage /></>;
  }

  if (!isLoggedIn) {
    return (
      <>
        <Toaster position="top-right" theme="dark" />

        <LoginPage
          onLogin={(token) => {
            setAuthToken(token);   // Save to localStorage
            setToken(token);       // Update React state
            setPage("dashboard");
          }}
        />
      </>
    );
  }

  return (
    <AppProvider value={{ logout }}>
      <div className="min-h-screen bg-[#020817] font-[Inter,system-ui,sans-serif]">
        <Toaster position="top-right" theme="dark" />

        <Sidebar
          page={page}
          onPage={handlePageChange}
          collapsed={collapsed}
          onToggle={() => setCollapsed((c) => !c)}
        />

        <div
          className="transition-all duration-300"
          style={{ marginLeft: sidebarWidth }}
        >
          <Navbar
            page={page}
            sidebarWidth={sidebarWidth}
            onMenuToggle={() => setCollapsed((c) => !c)}
            onPage={handlePageChange}
            onLogout={logout}
          />

          <main className="min-h-screen p-6 pt-16">
            <AnimatePresence mode="wait">
              <motion.div
                key={page}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
              >
                {pageMap[page]}
              </motion.div>
            </AnimatePresence>
          </main>
        </div>
      </div>
    </AppProvider>
  );
}
