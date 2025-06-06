



"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Menu, LogOut } from "lucide-react";
import Sidebar from "@/app/protected/_components/sidebar";
import Link from "next/link";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { createClient } from "@/utils/supabase/client";
import SimpleTooltip from "@/components/team_view";

type TeamMember = {
  id: string;
  name: string;
  designation: string;
};

export default function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const params = useParams();

  const projectIdFromUrl = params?.projectId;

//   const toggleSidebar = () => setIsCollapsed((prev) => !prev);
   const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };
    
  useEffect(() => {
    if (!projectIdFromUrl) {
      console.warn("No project ID in URL.");
      return;
    }

    const fetchTeamMembers = async () => {
      const supabase = createClient();

      try {
        const { data: project, error: projectError } = await supabase
          .from("projects")
          .select("team_members")
          .eq("project_id", projectIdFromUrl)
          .maybeSingle();

        if (projectError) {
          console.error("Error fetching project:", projectError.message);
          setTeamMembers([]);
          return;
        }

        if (!project) {
          console.warn("No project found with ID:", projectIdFromUrl);
          setTeamMembers([]);
          return;
        }

        const teamMemberIds: string[] = project.team_members ?? [];

        if (!Array.isArray(teamMemberIds) || teamMemberIds.length === 0) {
          console.warn("No team members found.");
          setTeamMembers([]);
          return;
        }

        const { data: profiles, error: profilesError } = await supabase
          .from("profiles")
          .select("id, email")
          .in("id", teamMemberIds);

        if (profilesError) {
          console.error("Error fetching profiles:", profilesError.message);
          setTeamMembers([]);
          return;
        }

        const membersArray: TeamMember[] = profiles.map((profile) => ({
          id: String(profile.id),
          name: profile.email || "Unknown",
          designation: "Team Member",
        }));

        setTeamMembers(membersArray);
      } catch (err) {
        console.error("Unexpected error:", err);
        setTeamMembers([]);
      }
    };

    fetchTeamMembers();
  }, [projectIdFromUrl]);

  return (
    <div className="flex min-h-screen w-full flex-col">
      <nav className="h-16 bg-white shadow-sm w-full sticky top-0 z-10 flex items-center mb-4 px-4">
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

        <div className="ml-auto flex items-center gap-4">
          {teamMembers.length > 0 && (
            <SimpleTooltip
              items={teamMembers}
              onAddMember={() => {
                alert("Add member clicked!");
              }}
            />
          )}

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

      <div className="flex flex-1">
        <div
          className={`$${
            isCollapsed ? "w-56 md:w-60 lg:w-72" : "w-0"
          } shadow-lg transition-all duration-300 overflow-hidden h-[calc(100vh-4rem)] sticky top-16`}
        >
          <Sidebar isCollapsed={isCollapsed} toggleSidebar={toggleSidebar} />
        </div>

        <main className="flex-1 px-4 transition-all duration-300">{children}</main>
      </div> 
      


    {/*anaba*/}  
 
    {/* <div className="relative flex-1">
      {isCollapsed && (
        <>
         
          <div
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-20"
            onClick={toggleSidebar}
          />
          <div className="fixed top-16 left-0 w-64 h-[calc(100vh-4rem)] bg-white shadow-lg z-30">
            <Sidebar isCollapsed={isCollapsed} />
          </div>
        </>
      )}

     
      <div className="relative z-10">
        {children}
      </div>
    </div>
       */}
    </div>
  );
}