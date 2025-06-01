"use client";

import {
  LayoutDashboard,
  FolderTree,
  Folder,
  Plus,
  X,
  Trash2,
  EyeIcon,
  EyeOffIcon,
} from "lucide-react";
import { useState, useEffect, ChangeEvent } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { createPortal } from "react-dom";

type SidebarProps = {
  isCollapsed: boolean;
};

export interface Project {
  project_id: string;
  name: string | null;
  description: string | null;
  created_at: string;
  updated_at: string;
  owner_id: string | null;
  team_members: string[] | null;
}

export default function Sidebar({ isCollapsed }: SidebarProps) {
  const supabaseClient = createClient();
  const pathname = usePathname();
  const pathParts = pathname.split("/");
  const projectId = pathParts[pathParts.length - 1];
  const [projects, setProjects] = useState<Project[]>([]);
  const [showRemaining, setShowRemaining] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [id, setId] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<string | null>(null);

  const [newProject, setNewProject] = useState<{
    name: string;
    description: string;
  }>({
    name: "",
    description: "",
  });
  const [isMounted, setIsMounted] = useState(false);

  const currentUserId = async () => {
    const { data, error } = await supabaseClient.auth.getUser();
    if (error) {
      console.error("Error fetching user:", error);
      return null;
    }

    return data?.user?.id ?? null;
  };

  useEffect(() => {
    setIsMounted(true);

    const fetchData = async () => {
      const userId = await currentUserId();
      setId(userId);

      const { data, error } = await supabaseClient
        .from("projects")
        .select("*")
        .contains("team_members", [userId]);

      if (error) {
        console.error("Error fetching projects:", error);
      } else {
        setProjects(data);
      }
    };

    fetchData();
  }, []);

  const firstSix = projects.slice(0, 5);
  console.log(firstSix);
  const remaining = projects.slice(5);
  console.log(remaining);

  const handleDeleteClick = (projectId: string) => {
    console.log(projectId);
    setProjectToDelete(projectId);
    setShowDeleteModal(true);
  };
  const handleDeleteProject = async () => {
    const { error } = await supabaseClient
      .from("projects")
      .delete()
      .eq("project_id", projectToDelete);

    if (error) {
      console.log("Error while deleting project", error.message);
      return;
    }

    setProjects((prev) => prev.filter((p) => p.project_id !== projectToDelete));
    setShowDeleteModal(false);
  };

  const handleInputChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setNewProject((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmitProject = async () => {
    if (!newProject.name.trim()) {
      alert("Project name is required");
      return;
    }

    const { data, error } = await supabaseClient
      .from("projects")
      .insert([
        {
          name: newProject.name,
          description: newProject.description,
          owner_id: id,
          team_members: [id],
        },
      ])
      .select()
      .single();

    if (error) {
      console.error("Error adding project:", error);
      alert("Failed to add project");
      return;
    }

    if (data) {
      setProjects((prev) => [data, ...prev]);
      setNewProject({ name: "", description: "" });
      setShowForm(false);
    }
  };

  return (
    <div className="h-full overflow-y-auto px-2">
      <div className="dark:text-white">
        <Link
          href="/protected"
          className={`flex items-center gap-2 px-4 py-2 mt-2 rounded-lg  ${
            pathname === "/protected"
              ? "bg-slate-100 font-semibold"
              : "hover:bg-slate-100"
          }`}
        >
          <LayoutDashboard className="w-5 h-5 mr-3" />
          <span className="md:text-xl lg:text-base">Dashboard</span>
        </Link>

        <div className="mt-2">
          <div className="flex items-center gap-2 px-4 py-2 rounded-lg transition-colors">
            <FolderTree className="w-5 h-5" />
            <span className="md:text-xl lg:text-base">Projects</span>
            <div
              onClick={() => setShowForm(true)}
              className="cursor-pointer ml-auto rounded p-2 hover:bg-slate-100 transform transition-all duration-300 ease-in hover:scale-105"
              title="Add new project"
            >
              <Plus className="h-4 w-4" />
            </div>
          </div>
        </div>

        <div className="ml-4 mt-2 space-y-1">
          {firstSix.map((project) => (
            <div
              key={project.project_id}
              className={`group flex items-center justify-between px-4 py-2 rounded-lg transition-all duration-300 hover:bg-slate-100 ${project.project_id == projectId ? "bg-slate-100 font-semibold" : ""}`}
            >
              <Link
                href={`/protected/projects/${project.project_id}`}
                className="flex items-center gap-2 text-sm flex-1"
              >
                <Folder className="h-4 w-4 text-slate-500" />
                <span>
                  {project.name
                    ?.toLowerCase()
                    .split(" ")
                    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                    .join(" ")}
                </span>
              </Link>

              {id === project.owner_id && (
                <button
                  onClick={() => handleDeleteClick(project.project_id)}
                  className="text-red-500 hover:text-red-700 opacity-0 group-hover:opacity-100 transition"
                  title="Delete Project"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}

          {showRemaining &&
            remaining.map((project) => (
              <div
                key={project.project_id}
                className="group flex items-center justify-between px-4 py-2 rounded-lg transition-all duration-300 hover:bg-slate-100"
              >
                <Link
                  href={`/protected/projects/${project.project_id}`}
                  className="flex items-center gap-2 text-sm flex-1"
                >
                  <Folder className="h-4 w-4 text-slate-500" />
                  <span>
                    {project.name
                      ?.toLowerCase()
                      .split(" ")
                      .map(
                        (word) => word.charAt(0).toUpperCase() + word.slice(1)
                      )
                      .join(" ")}
                  </span>
                </Link>
                {id === project.owner_id && (
                  <button
                    onClick={() => handleDeleteClick(project.project_id)}
                    className="text-red-500 hover:text-red-700 opacity-0 group-hover:opacity-100 transition"
                    title="Delete Project"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          {remaining.length > 0 && (
            <button
              onClick={() => setShowRemaining(!showRemaining)}
              className="flex gap-2 px-4 py-2 text-sm rounded-lg hover:bg-slate-100 text-purple-600 font-medium"
            >
              {showRemaining ? (
                <>
                  <EyeOffIcon className="w-4 h-4" />
                  Show less
                </>
              ) : (
                <>
                  <EyeIcon className="w-4 h-4" /> 
                  View All Projects
                </>
              )}
            </button>
          )}
        </div>
        {showDeleteModal &&
          isMounted &&
          createPortal(
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[99999] p-4">
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg max-w-md w-full shadow-lg">
                <h2 className="text-lg font-semibold mb-4">Are you sure?</h2>
                <p className="text-sm mb-6">
                  Do you really want to delete this project? This action cannot
                  be undone.
                </p>
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => {
                      setShowDeleteModal(false);
                      setProjectToDelete(null);
                    }}
                    className="px-4 py-2 border rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDeleteProject}
                    className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>,
            document.body
          )}
      </div>

      {showForm &&
        isMounted &&
        createPortal(
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[99999] p-4">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg max-w-xl w-full border-3 border-black dark:border-gray-700 shadow-[8px_8px_0px_0px_rgba(0,0,0,0.3)]">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Add New Project</h2>
                <button
                  onClick={() => setShowForm(false)}
                  className="text-gray-500 hover:text-gray-700"
                  aria-label="Close form"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-4">
                {/* Name */}
                <div>
                  <label className="block text-sm font-medium mb-1">Name</label>
                  <input
                    type="text"
                    name="name"
                    value={newProject.name}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md"
                    placeholder="Project name"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Description
                  </label>
                  <textarea
                    name="description"
                    value={newProject.description}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md"
                    rows={3}
                    placeholder="Project description"
                  />
                </div>

                <div className="flex justify-end space-x-2 pt-4">
                  <button
                    onClick={() => setShowForm(false)}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmitProject}
                    className="px-4 py-2 bg-emerald-500 text-white rounded-md hover:bg-emerald-600 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.3)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0px_0px_rgba(0,0,0,0.3)]"
                  >
                    Add Project
                  </button>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
