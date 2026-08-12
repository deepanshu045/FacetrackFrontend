import { ReactNode, useState } from "react";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";
import { Page } from "../../types";

interface LayoutProps {
  page: Page;
  onPage: (page: Page) => void;
  children: ReactNode;
}

export default function Layout({
  page,
  onPage,
  children,
}: LayoutProps) {
  const [collapsed, setCollapsed] = useState(false);

  const sidebarWidth = collapsed ? 72 : 240;

  return (
    <div className="min-h-screen bg-[#020817]">

      <Sidebar
        page={page}
        onPage={onPage}
        collapsed={collapsed}
        onToggle={() => setCollapsed((v) => !v)}
      />

      <Navbar
        page={page}
        sidebarWidth={sidebarWidth}
        onMenuToggle={() => setCollapsed((v) => !v)}
        onPage={onPage}
      />

      <main
        className="pt-20 px-6 pb-6 transition-all duration-300 "
        style={{
          marginLeft: sidebarWidth,
        }}
      >
        {children}
      </main>

    </div>
  );
}
