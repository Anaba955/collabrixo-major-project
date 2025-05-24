"use client";
import {
  ChevronDown,
  LayoutDashboard,
  ChevronUp,
  FolderTree,
  Folder,
  Menu,
  Plus,
} from "lucide-react";
import { useState } from "react";
import  Link  from "next/link";
import { usePathname } from "next/navigation";

type SidebarProps = {
  isCollapsed: boolean;
  toggleSidebar: () => void;
};

export default function Sidebar({ isCollapsed, toggleSidebar }: SidebarProps) {
  const pathname = usePathname()
  const isActive = pathname === "/protected"
  const [showRemaining, setShowRemaining] = useState(false);
  
  const projects = [
    { id: 1, name: "Website Redesign" },
    { id: 2, name: "Mobile App Development" },
    { id: 3, name: "Marketing Campaign" },
    { id: 4, name: "E-commerce Platform" },
    { id: 5, name: "AI Chatbot Integration" },
    { id: 6, name: "Customer Feedback System" },
    { id: 7, name: "SEO Optimization" },
    { id: 8, name: "Cloud Migration" },
    { id: 9, name: "Analytics Dashboard" },
    { id: 10, name: "Online Learning Portal" },
    { id: 11, name: "Social Media Scheduler" },
    { id: 12, name: "Inventory Management System" },
    { id: 13, name: "HR Management Tool" },
    { id: 14, name: "Product Launch Tracker" },
    { id: 15, name: "Bug Tracking System" },
  ];
  const firstSix = projects.slice(0, 6);
  const remaining = projects.slice(6);

  if (!isCollapsed) {
    return null;
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="dark:text-white">
        <Link
          href="/protected"
          className={`flex items-center gap-2 px-4 py-2 mt-2 rounded-lg transform transition-all duration-300 ease-in hover:scale-105 ${
        isActive ? "bg-slate-100" : "hover:bg-slate-100"
      }`}
        >
          <LayoutDashboard className="w-5 h-5 mr-3" />
          <span className="md:text-xl lg:text-base">Dashboard</span>
        </Link>
        <div className="mt-2">
          
            <div className="flex items-center gap-2 w-full w-full flex items-center px-4 py-2 rounded-lg transition-colors">
              <FolderTree className="w-5 h-5" />
              <span className="md:text-xl lg:text-base">Projects</span>
              <div className="cursor-pointer ml-auto rounded p-2 hover:bg-slate-100 transform transition-all duration-300 ease-in hover:scale-105">
                  <Plus className="h-4 w-4 w-full pointer" />
              </div>
            </div>
        </div>
          <div className="ml-4 mt-2 space-y-1">
            {firstSix.map((project) => {
              return (
                <Link
                  href={`/protected/projects/${project.id}`}
                  key={project.id}
                  className={`flex items-center gap-2 px-4 py-2 text-sm rounded-lg transform transition-all duration-300 ease-in hover:scale-105 ${
                    pathname === `protected/projects/${project.id}` ? "bg-slate-100" : "hover:bg-slate-100"
                  }`}
                >
                  <Folder className="h-4 w-4 text-slate-500" />
                  <span>{project.name}</span>
                </Link>
              );
            })}
            {showRemaining &&
              remaining.map((project) => (
                <Link
                  href={`/protected/projects/${project.id}`}
                  key={project.id}
                  className={`flex items-center gap-2 px-4 py-2 text-sm rounded-lg transform transition-all duration-300 ease-in hover:scale-105 ${
                    pathname === `protected/projects/${project.id}` ? "bg-slate-100" : "hover:bg-slate-100"
                  }`}>
                  <Folder className="h-4 w-4 text-slate-500" />
                  <span>{project.name}</span>
                </Link>
              ))}
            {remaining.length > 0 && (
              <button
                onClick={() => setShowRemaining(!showRemaining)}
                className="block px-4 py-2 text-sm rounded-lg hover:bg-slate-100 text-purple-600 font-medium"
              >
                {showRemaining ? "Show less" : "View All Projects"}
              </button>
            )}
          </div>
      </div>
    </div>
  );
}
