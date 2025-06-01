"use client";
import { useState } from "react";

import { Menu, LogOut } from "lucide-react";
import Sidebar from "./_components/sidebar"
import  Link  from "next/link";

import { ThemeSwitcher } from "@/components/theme-switcher";


export default function Layout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
    const [isCollapsed, setIsCollapsed] = useState(false);

    const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };
  return (
  <div className="flex min-h-screen w-full flex-col">
    {/* Navbar */}
    <nav className={`h-16 shadow-sm w-full top-0 z-30 flex items-center mb-4 px-4 ${isCollapsed?"bg-white":""}`}>
      <div className="flex items-center gap-4">
        <button
          onClick={toggleSidebar}
          className="rounded cursor-pointer p-1 hover:bg-slate-100"
        >
          <Menu className="w-6 h-6" />
        </button>
        <span className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-500 text-transparent bg-clip-text">
          Collabrixo
        </span>
      </div>
      <div className="ml-auto">
        <ThemeSwitcher />
        <Link
          href="/logout"
          className="flex items-center gap-2 px-4 py-2 hover:bg-slate-100 rounded-lg text-red-500"
        >
          <span>Logout</span>
          <LogOut className="w-5 h-5" />
        </Link>
      </div>
    </nav>

    {/* Sidebar Overlay & Content */}
    <div className="relative flex-1">
      {isCollapsed && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-20"
            onClick={toggleSidebar}
          />
          {/* Sidebar */}
          <div className="fixed top-16 left-0 w-64 h-[calc(100vh-4rem)] bg-white shadow-lg z-30">
            <Sidebar isCollapsed={isCollapsed} />
          </div>
        </>
      )}

      {/* Main Content */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  </div>
);

}