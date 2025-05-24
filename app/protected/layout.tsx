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
    const [isCollapsed, setIsCollapsed] = useState(true);

    const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };
  return (
    
    <div className="flex min-h-screen w-full flex-col">
      {/* Navbar */}
      <nav className="h-16 bg-white shadow-sm w-full sticky top-0 z-10 flex items-center mb-4 px-4">
        <div className="flex items-center gap-4">
          <button onClick={toggleSidebar} className="rounded cursor-pointer p-1 hover:bg-slate-100">
            <Menu className="w-6 h-6" />
          </button>
          <span className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-500 text-transparent bg-clip-text">
            Collabrixo
          </span>
        </div>
        <div className="ml-auto">
           <ThemeSwitcher />
          <Link href="/logout" className="flex items-center gap-2 px-4 py-2 hover:bg-slate-100 rounded-lg text-red-500">
            <span>Logout</span>
            <LogOut className="w-5 h-5" />
          </Link>
        </div>
      </nav>

      
      <div className="flex flex-1">
        {/* Sidebar */}
        <div 
          className={`${
            isCollapsed 
              ? "w-56 md:w-60 lg:w-72" 
              : "w-0"
          }  shadow-lg transition-all duration-300 overflow-hidden h-[calc(100vh-4rem)] sticky top-16`}
        >
          <Sidebar isCollapsed={isCollapsed} toggleSidebar={toggleSidebar} />
        </div>
        {children}
      </div>
      
    </div>
  )
}