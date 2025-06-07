


//this code is working fine, but I am not using it right now

// "use client";

// import { useState } from "react";
// import { createClient } from "@/utils/supabase/client";
// import toast from "react-hot-toast";

// // --- Types ---
// type TeamMember = {
//   id: string;
//   name: string;
//   designation: string;
// };

// export default function SimpleTooltip({
//   items,
//   onAddMember,
//   projectId,
// }: {
//   items: TeamMember[];
//   onAddMember: () => void;
//   projectId: string;
// }) {
//   const [activeId, setActiveId] = useState<string | null>(null);
//   const [page, setPage] = useState(0);
//   const pageSize = 3;
//   const supabase = createClient();

//   const startIndex = page * pageSize;
//   const visibleItems = items.slice(startIndex, startIndex + pageSize);
//   const isLastPage = startIndex + pageSize >= items.length;
//   const remainingCount = Math.max(items.length - (startIndex + pageSize), 0);

//   const handleNext = () => {
//     if (!isLastPage) {
//       setPage(page + 1);
//     }
//   };

//   const handleAdd = async () => {
//     const email = prompt("Enter email of user to add:");
//     if (!email) {
//       alert("No email entered. Member addition cancelled.");
//       return;
//     }

//     alert(`Searching for user with email: ${email}...`);

//     const {
//       data: userProfile,
//       error: profileError,
//     } = await supabase
//       .from("profiles")
//       .select("id")
//       .eq("email", email)
//       .maybeSingle();

//     if (profileError || !userProfile) {
//       alert("User not found with this email.");
//       console.error("❌ Error fetching user profile:", profileError);
//       toast.error("User not found");
//       return;
//     }

//     const newUserId = userProfile.id;
//     alert(`✅ Found user ID: ${newUserId}`);

//     alert(`Fetching current team members for project ID: ${projectId}...`);
//     const { data: projectData, error: projectError } = await supabase
//       .from("projects")
//       .select("team_members")
//       .eq("project_id", projectId)
//       .maybeSingle();

//     if (projectError || !projectData) {
//       alert("❌ Failed to fetch project team list.");
//       toast.error("Failed to fetch project");
//       return;
//     }

//     const currentTeam: string[] = projectData.team_members || [];
//     alert(`👥 Current team: ${currentTeam.join(", ") || "No members yet"}`);

//     if (currentTeam.includes(newUserId)) {
//       alert("⚠️ User is already part of the team.");
//       toast("User is already in the team");
//       return;
//     }

//     const updatedTeam = [...currentTeam, newUserId];
//     alert(`📦 Updating project with new team: ${updatedTeam.join(", ")}`);

//     const { error: updateError } = await supabase
//       .from("projects")
//       .update({ team_members: updatedTeam })
//       .eq("project_id", projectId);

//     if (updateError) {
//       alert("❌ Failed to update project.");
//       toast.error("Failed to add member");
//       return;
//     }

//     alert("✅ Member added successfully to the project!");
//     toast.success("Member added!");
//     setPage(0);
//     onAddMember();
//   };

//   const getRandomColor = (seed: number): string => {
//     const colors = [
//       "#f87171",
//       "#facc15",
//       "#34d399",
//       "#60a5fa",
//       "#a78bfa",
//       "#f472b6",
//     ];
//     return colors[seed % colors.length];
//   };

//   return (
//     <div className="flex -space-x-3">
//       {visibleItems.map((item, index) => (
//         <div
//           key={item.id}
//           className="relative group"
//           onMouseEnter={() => setActiveId(item.id)}
//           onMouseLeave={() => setActiveId(null)}
//         >
//           <div
//             className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold cursor-pointer border-2 border-white"
//             style={{ backgroundColor: getRandomColor(index) }}
//           >
//             {item.name?.charAt(0)?.toUpperCase() || "?"}
//           </div>

//           {activeId === item.id && (
//             <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 max-w-xs p-2 bg-white border border-gray-200 rounded-lg shadow-lg text-center z-50 break-words">
//               <p className="text-sm font-semibold text-gray-800">{item.name}</p>
//               <p className="text-xs text-gray-500">{item.designation}</p>
//             </div>
//           )}
//         </div>
//       ))}

//       {items.length > pageSize && !isLastPage ? (
//         <div
//           className="w-10 h-10 rounded-full flex items-center justify-center bg-gray-300 text-gray-700 text-sm font-semibold border-2 border-white cursor-pointer"
//           onClick={handleNext}
//           title="Show next members"
//         >
//           +{remainingCount}
//         </div>
//       ) : (
//         <div
//           className="w-10 h-10 rounded-full flex items-center justify-center bg-gray-300 text-white text-xl font-bold border-2 border-white cursor-pointer"
//           onClick={handleAdd}
//           title="Add new member"
//         >
//           +
//         </div>
//       )}
//     </div>
//   );
// }


"use client";

import { useState } from "react";
import { createClient } from "@/utils/supabase/client";
import toast from "react-hot-toast";

// --- Types ---
type TeamMember = {
  id: string;
  name: string;
  designation: string;
};

export default function SimpleTooltip({
  items,
  onAddMember,
  projectId,
}: {
  items: TeamMember[];
  onAddMember: () => void;
  projectId: string;
}) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const pageSize = 3;
  const supabase = createClient();

  const startIndex = page * pageSize;
  const visibleItems = items.slice(startIndex, startIndex + pageSize);
  const isLastPage = startIndex + pageSize >= items.length;
  const remainingCount = Math.max(items.length - (startIndex + pageSize), 0);

  const handleNext = () => {
    if (!isLastPage) {
      setPage(page + 1);
    }
  };

  const handleAddClick = () => {
    setShowModal(true);
    setEmail("");
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEmail("");
  };

  const handleAdd = async () => {
    if (!email.trim()) {
      toast.error("Please enter an email address");
      return;
    }

    setIsLoading(true);

    try {
      const {
        data: userProfile,
        error: profileError,
      } = await supabase
        .from("profiles")
        .select("id")
        .eq("email", email)
        .maybeSingle();

      if (profileError || !userProfile) {
        console.error("❌ Error fetching user profile:", profileError);
        toast.error("User not found");
        setIsLoading(false);
        return;
      }

      const newUserId = userProfile.id;

      const { data: projectData, error: projectError } = await supabase
        .from("projects")
        .select("team_members")
        .eq("project_id", projectId)
        .maybeSingle();

      if (projectError || !projectData) {
        toast.error("Failed to fetch project");
        setIsLoading(false);
        return;
      }

      const currentTeam: string[] = projectData.team_members || [];

      if (currentTeam.includes(newUserId)) {
        toast("User is already in the team");
        setIsLoading(false);
        return;
      }

      const updatedTeam = [...currentTeam, newUserId];

      const { error: updateError } = await supabase
        .from("projects")
        .update({ team_members: updatedTeam })
        .eq("project_id", projectId);

      if (updateError) {
        toast.error("Failed to add member");
        setIsLoading(false);
        return;
      }

      toast.success("Member added!");
      setPage(0);
      onAddMember();
      handleCloseModal();
    } catch (error) {
      toast.error("Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  const getRandomColor = (seed: number): string => {
    const colors = [
      "#f87171",
      "#facc15",
      "#34d399",
      "#60a5fa",
      "#a78bfa",
      "#f472b6",
    ];
    return colors[seed % colors.length];
  };

  return (
    <div className="relative">
      <div className="flex -space-x-3">
        {visibleItems.map((item, index) => (
          <div
            key={item.id}
            className="relative group"
            onMouseEnter={() => setActiveId(item.id)}
            onMouseLeave={() => setActiveId(null)}
          >
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold cursor-pointer border-2 border-white"
              style={{ backgroundColor: getRandomColor(index) }}
            >
              {item.name?.charAt(0)?.toUpperCase() || "?"}
            </div>

            {activeId === item.id && (
              <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 max-w-xs p-2 bg-white border border-gray-200 rounded-lg shadow-lg text-center z-50 break-words">
                <p className="text-sm font-semibold text-gray-800">{item.name}</p>
                <p className="text-xs text-gray-500">{item.designation}</p>
              </div>
            )}
          </div>
        ))}

        {!isLastPage ? (
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center bg-gray-300 text-gray-700 text-sm font-semibold border-2 border-white cursor-pointer hover:bg-gray-400 transition-colors"
            onClick={handleNext}
            title="Show next members"
          >
            +{remainingCount}
          </div>
        ) : (
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center bg-blue-500 text-white text-xl font-bold border-2 border-white cursor-pointer hover:bg-blue-600 transition-colors"
            onClick={handleAddClick}
            title="Add new member"
          >
            +
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              handleCloseModal();
            }
          }}
        >
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4 shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-800">Add Team Member</h3>
              <button
                onClick={handleCloseModal}
                className="text-gray-400 hover:text-gray-600 text-xl font-bold"
                disabled={isLoading}
              >
                ×
              </button>
            </div>
            
            <div className="mb-4">
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter user's email address"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={isLoading}
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleAdd();
                  }
                  if (e.key === 'Escape') {
                    handleCloseModal();
                  }
                }}
              />
            </div>

            <div className="flex gap-3 justify-end">
              <button
                onClick={handleCloseModal}
                className="px-4 py-2 text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                disabled={isLoading}
              >
                Cancel
              </button>
              <button
                onClick={handleAdd}
                disabled={isLoading || !email.trim()}
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-blue-300 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Adding...
                  </>
                ) : (
                  'Add Member'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}