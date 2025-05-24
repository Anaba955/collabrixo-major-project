// "use client";

// import { useState } from "react";
// import { Menu, LogOut } from "lucide-react";
// import Sidebar from "../_components/ui/sidebar";
// import Link from "next/link";
// import TabsSection from "../_components/TabsSection";
// import SimpleTooltip from "@/components/team_view";
// import { createClient } from "@/utils/supabase/client";

// export interface Project {
//   project_id: string;        
//   name: string | null;          
//   description: string | null;
//   created_at: string;    
//   updated_at: string;           
//   owner_id: string | null;      
//   team_members: string[] | null;
// }
// export default function Home() {
//   const [isCollapsed, setIsCollapsed] = useState(true);

//   const toggleSidebar = () => {
//     setIsCollapsed(!isCollapsed);
//   };

//   return (
//     <div className="flex flex-col min-h-screen w-full">
//       {/* Navbar */}
//       <nav className="h-16 bg-white shadow-sm sticky top-0 z-10 flex items-center px-4 mb-4">
//         {/* Left side: Menu + Logo */}
//         <div className="flex items-center gap-4">
//           <button
//             onClick={toggleSidebar}
//             className="rounded p-1 cursor-pointer hover:bg-slate-100"
//           >
//             <Menu className="w-6 h-6" />
//           </button>
//           <span className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-500 text-transparent bg-clip-text">
//             Collabrixo
//           </span>
//         </div>

//         {/* Right side: Tooltip + Logout */}
//         const supabaseClient = createClient();

//          const { error } = await supabaseClient.from("projects").select(team_members[0])
//     if( error ) {
//       console.error("Error adding task: ", error.message)
//     }
      

//         <div className="ml-auto flex items-center gap-4">
//           <SimpleTooltip
//               items={[
//                 { id: 1, name: "John Doe", designation: "Software Engineer" },
//                 { id: 2, name: "Jane Smith", designation: "Project Manager" },
//                 { id: 3, name: "Alex Lee", designation: "Designer" },
//                 { id: 4, name: "Chris Park", designation: "QA Engineer" },
//                 { id: 5, name: "Sara Tan", designation: "Product Owner" },
//                 { id: 6, name: "Jane Smith", designation: "Project Manager" },
//                 { id: 7, name: "Alex Lee", designation: "Designer" },
//                 { id: 8, name: "Chris Park", designation: "QA Engineer" },
//                 { id: 9, name: "Sara Tan", designation: "Product Owner" },
//               ]}
//               onAddMember={() => {
//                 // TODO: Implement add member logic here
//                 alert("Add member clicked!");
//               }}
//             />


//           <Link
//             href="/logout"
//             className="flex items-center gap-2 px-4 py-2 hover:bg-slate-100 rounded-lg text-red-500"
//           >
//             <span>Logout</span>
//             <LogOut className="w-5 h-5" />
//           </Link>
//         </div>
//       </nav>

//       {/* Main Section */}
//       <div className="flex flex-1">
//         {/* Sidebar */}
//         <div
//           className={`${
//             isCollapsed ? "w-56 md:w-60 lg:w-72" : "w-0"
//           } shadow-lg transition-all duration-300 overflow-hidden h-[calc(100vh-4rem)] sticky top-16`}
//         >
//           <Sidebar isCollapsed={isCollapsed} toggleSidebar={toggleSidebar} />
//         </div>

//         {/* Main Content */}
//         <main className="flex-1 px-4 transition-all duration-300">
//           <TabsSection />
//         </main>
//       </div>
//     </div>
//   );
// }


// "use client";

// import { useState, useEffect } from "react";
// import { Menu, LogOut } from "lucide-react";
// import Sidebar from "../_components/ui/sidebar";
// import Link from "next/link";
// import TabsSection from "../_components/TabsSection";
// import SimpleTooltip from "@/components/team_view";
// import { createClient } from "@/utils/supabase/client";

// export interface Project {
//   project_id: string;
//   name: string | null;
//   description: string | null;
//   created_at: string;
//   updated_at: string;
//   owner_id: string | null;
//   team_members: string[] | null;
// }

// export default function Home() {
//   const [isCollapsed, setIsCollapsed] = useState(true);
//   const [teamMembers, setTeamMembers] = useState<any[]>([]);

//   const toggleSidebar = () => {
//     setIsCollapsed(!isCollapsed);
//   };

//   useEffect(() => {
//     const fetchTeamMembers = async () => {
//       try {
//         const supabaseClient = createClient();
//         const { data, error } = await supabaseClient
//           .from("projects")
//           .select("team_members")
//           .limit(1)
//           .single();

//         if (error) {
//           console.error("Error fetching team members:", error.message);
//         } else if (data && data.team_members) {
//           const membersArray = data.team_members.map((name: string, index: number) => ({
//             id: index + 1,
//             name: name,
//             designation: "Team Member", // Placeholder, adjust as needed
//           }));
//           setTeamMembers(membersArray);
//         }
//       } catch (err) {
//         console.error("Unexpected error:", err);
//       }
//     };

//     fetchTeamMembers();
//   }, []);

//   return (
//     <div className="flex flex-col min-h-screen w-full">
//       {/* Navbar */}
//       <nav className="h-16 bg-white shadow-sm sticky top-0 z-10 flex items-center px-4 mb-4">
//         {/* Left side: Menu + Logo */}
//         <div className="flex items-center gap-4">
//           <button
//             onClick={toggleSidebar}
//             className="rounded p-1 cursor-pointer hover:bg-slate-100"
//           >
//             <Menu className="w-6 h-6" />
//           </button>
//           <span className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-500 text-transparent bg-clip-text">
//             Collabrixo
//           </span>
//         </div>

//         {/* Right side: Tooltip + Logout */}
//         <div className="ml-auto flex items-center gap-4">
//           <SimpleTooltip
//             items={teamMembers.length > 0 ? teamMembers : [
//               { id: 1, name: "John Doe", designation: "Software Engineer" },
//               { id: 2, name: "Jane Smith", designation: "Project Manager" },
//             ]}
//             onAddMember={() => {
//               alert("Add member clicked!");
//             }}
//           />

//           <Link
//             href="/logout"
//             className="flex items-center gap-2 px-4 py-2 hover:bg-slate-100 rounded-lg text-red-500"
//           >
//             <span>Logout</span>
//             <LogOut className="w-5 h-5" />
//           </Link>
//         </div>
//       </nav>

//       {/* Main Section */}
//       <div className="flex flex-1">
//         {/* Sidebar */}
//         <div
//           className={`$${isCollapsed ? "w-56 md:w-60 lg:w-72" : "w-0"} shadow-lg transition-all duration-300 overflow-hidden h-[calc(100vh-4rem)] sticky top-16`}
//         >
//           <Sidebar isCollapsed={isCollapsed} toggleSidebar={toggleSidebar} />
//         </div>

//         {/* Main Content */}
//         <main className="flex-1 px-4 transition-all duration-300">
//           <TabsSection />
//         </main>
//       </div>
//     </div>
//   );
// }





"use client";

import { useState, useEffect } from "react";
import { Menu, LogOut } from "lucide-react";
import Sidebar from "../_components/ui/sidebar";
import Link from "next/link";
import TabsSection from "../_components/TabsSection";
import SimpleTooltip from "@/components/team_view";
import { createClient } from "@/utils/supabase/client";

export interface Project {
  project_id: string;
  name: string | null;
  description: string | null;
  created_at: string;
  updated_at: string;
  owner_id: string | null;
  team_members: string[] | null;
}

export default function Home() {
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [teamMembers, setTeamMembers] = useState<{ id: number; name: string; designation: string }[]>([]);

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  useEffect(() => {
    const fetchTeamMembers = async () => {
      try {
        const supabaseClient = createClient();
        const { data, error } = await supabaseClient
          .from("projects")
          .select("team_members")
          .limit(1)
          .single();

        if (error) {
          console.error("Error fetching team members:", error.message);
          setTeamMembers([]); // clear on error
        } else if (data?.team_members && Array.isArray(data.team_members)) {
          // Map the array of member names to objects with id and designation
          const membersArray = data.team_members.map((name: string, index: number) => ({
            id: index + 1,
            name,
            designation: "Team Member", // Adjust if you have real designations
          }));
          setTeamMembers(membersArray);
        } else {
          setTeamMembers([]); // no members found
        }
      } catch (err) {
        console.error("Unexpected error:", err);
        setTeamMembers([]); // clear on error
      }
    };

    fetchTeamMembers();
  }, []);

  return (
    <div className="flex flex-col min-h-screen w-full">
      {/* Navbar */}
      <nav className="h-16 bg-white shadow-sm sticky top-0 z-10 flex items-center px-4 mb-4">
        {/* Left side: Menu + Logo */}
        <div className="flex items-center gap-4">
          <button
            onClick={toggleSidebar}
            className="rounded p-1 cursor-pointer hover:bg-slate-100"
            aria-label="Toggle sidebar"
          >
            <Menu className="w-6 h-6" />
          </button>
          <span className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-500 text-transparent bg-clip-text">
            Collabrixo
          </span>
        </div>

        {/* Right side: Tooltip + Logout */}
        <div className="ml-auto flex items-center gap-4">
          {/* Only show tooltip if there are team members */}
          {teamMembers.length > 0 && (
            <SimpleTooltip
              items={teamMembers}
              onAddMember={() => {
                alert("Add member clicked!");
              }}
            />
          )}

          <Link
            href="/logout"
            className="flex items-center gap-2 px-4 py-2 hover:bg-slate-100 rounded-lg text-red-500"
          >
            <span>Logout</span>
            <LogOut className="w-5 h-5" />
          </Link>
        </div>
      </nav>

      {/* Main Section */}
      <div className="flex flex-1">
        {/* Sidebar */}
        <div
          className={`${
            isCollapsed ? "w-56 md:w-60 lg:w-72" : "w-0"
          } shadow-lg transition-all duration-300 overflow-hidden h-[calc(100vh-4rem)] sticky top-16`}
        >
          <Sidebar isCollapsed={isCollapsed} toggleSidebar={toggleSidebar} />
        </div>

        {/* Main Content */}
        <main className="flex-1 px-4 transition-all duration-300">
          <TabsSection />
        </main>
      </div>
    </div>
  );
}
