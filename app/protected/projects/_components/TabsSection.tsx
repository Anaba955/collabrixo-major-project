// "use client";

// import React, { useEffect, useState } from "react";
// import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
// import { Github, LayoutDashboard, MessageSquare, CalendarDays } from "lucide-react";
// import BoardContent from "./ui/BoardContent";
// import { useParams } from "next/navigation";
// import TeamChat from "@/components/Tchat";
// import ProjectCalendarPage from "@/components/ProjectCalendarPage";
// import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
// import { useCurrentUser } from "@/components/CurrentUser"; // Assuming this is the correct path
// import { useRouter } from "next/navigation";


// export default function TabsSection() {
//   const [currentUserId, setCurrentUserId] = useState<string | null>(null);
//   const [loading, setLoading] = useState(true);
//   const supabase = createClientComponentClient();
//   const params = useParams();
//   const projectId = params.projectId as string;

//   useEffect(() => {
//     const fetchUserAndProfile = async () => {
//       setLoading(true);

//       const { data: { user }, error: userError } = await supabase.auth.getUser();
//       if (userError) {
//         console.error("Error fetching auth user:", userError);
//         setLoading(false);
//         return;
//       }

//       if (user) {
//         const { data: profile, error: profileError } = await supabase
//           .from("profiles")
//           .select("id")
//           .eq("id", user.id)
//           .single();

//         if (profileError) {
//           console.error("Error fetching profile:", profileError);
//         } else {
//           setCurrentUserId(profile.id); // ✅ profile table’s id
//         }
//       }

//       setLoading(false);
//     };

//     fetchUserAndProfile();
//   }, [supabase]);

//   return (
//     <div className="w-full flex flex-col">
//       <Tabs defaultValue="kanban" className="w-full flex flex-col">
//         <TabsList className="grid w-full grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 mb-4">
//           <TabsTrigger value="kanban" className="flex items-center gap-2">
//             <LayoutDashboard className="w-4 h-4 text-purple-600" />
//             <span className="sm:inline text-purple-600 md:text-xl lg:text-base">
//               Kanban
//             </span>
//           </TabsTrigger>

//           <TabsTrigger value="calendar" className="flex items-center gap-2">
//             <CalendarDays className="w-4 h-4 text-purple-600" />
//             <span className="sm:inline text-purple-600 md:text-xl lg:text-base">
//               Calendar
//             </span>
//           </TabsTrigger>

//           <TabsTrigger value="chat" className="flex items-center gap-2">
//             <MessageSquare className="w-4 h-4 text-purple-600" />
//             <span className="sm:inline text-purple-600 md:text-xl lg:text-base">
//               Team Chat
//             </span>
//           </TabsTrigger>

//           <TabsTrigger value="activity" className="flex items-center gap-2">
//             <Github className="w-4 h-4 text-purple-600" />
//             <span className="sm:inline text-purple-600 md:text-xl lg:text-base">
//               Github Activity
//             </span>
//           </TabsTrigger>
//         </TabsList>

//         <div className="w-full">
//           <TabsContent value="kanban" className="w-full min-h-[500px] rounded-lg px-2">
//             <BoardContent />
//           </TabsContent>

//           <TabsContent value="calendar" className="w-full min-h-[500px] rounded-lg px-2">
//             <ProjectCalendarPage projectId={projectId} />
//           </TabsContent>

//           <TabsContent value="chat" className="w-full min-h-[500px] rounded-lg px-2">
//             {loading ? (
//               <p>Loading user...</p>
//             ) : currentUserId ? (
//               <TeamChat projectId={projectId} currentUserId={currentUserId} />
//             ) : (
//               <p>No user found.</p>
//             )}
//           </TabsContent>

//           <TabsContent value="activity" className="w-full min-h-[500px] rounded-lg px-2">
//             Github activity will go here.
//           </TabsContent>
//         </div>
//       </Tabs>
//     </div>
//   );
// }




// "use client";

// import React, { useEffect, useState } from "react";
// import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
// import { Github, LayoutDashboard, MessageSquare, CalendarDays } from "lucide-react";
// import BoardContent from "./ui/BoardContent";
// import { useParams } from "next/navigation";
// import TeamChat from "@/components/Tchat";
// import ProjectCalendarPage from "@/components/ProjectCalendarPage";
// import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

// interface TabsSectionProps {
//   currentUserId: string;
// }

// export default function TabsSection({ currentUserId }: TabsSectionProps) {
//   const [hasAccess, setHasAccess] = useState<boolean>(false);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);

//   const supabase = createClientComponentClient();
//   const params = useParams();
//   const projectId = params.projectId as string;

//   console.log("params:", params); // 👀 Debugging line
//   console.log("projectId:", projectId); // 👀 Debugging line
//   console.log("currentUserId:", currentUserId);


//   useEffect(() => {
//     const checkUserAccess = async () => {
//       setLoading(true);
//       setError(null);

//       try {
//         const { data, error:accessError } = await supabase
//   .from("projects")
//   .select("*")
//   .eq("project_id", projectId)
//   .contains("team_members", [currentUserId])  // 👈 checks if array contains the value
//   .single();


//         if (accessError || !data) {
//           setHasAccess(false);
//           if (accessError?.code !== "PGRST116") { // ignore 'no rows found' as non-fatal
//             console.error("Error checking access:", accessError);
//             setError("Failed to verify user access.");
//           }
//         } else {
//           setHasAccess(true);
//         }
//       } catch (err) {
//         console.error("Unexpected error:", err);
//         setError("Unexpected error occurred.");
//       } finally {
//         setLoading(false);
//       }
//     };

//     if (currentUserId && projectId) {
//       checkUserAccess();
//     } else {
//       setLoading(false);
//       setError("Missing user or project ID.");
//     }
//   }, [supabase, currentUserId, projectId]);

//   return (
//     <div className="w-full flex flex-col">
//       <Tabs defaultValue="kanban" className="w-full flex flex-col">
//         <TabsList className="grid w-full grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 mb-4">
//           <TabsTrigger value="kanban" className="flex items-center gap-2">
//             <LayoutDashboard className="w-4 h-4 text-purple-600" />
//             <span className="sm:inline text-purple-600 md:text-xl lg:text-base">
//               Kanban
//             </span>
//           </TabsTrigger>

//           <TabsTrigger value="calendar" className="flex items-center gap-2">
//             <CalendarDays className="w-4 h-4 text-purple-600" />
//             <span className="sm:inline text-purple-600 md:text-xl lg:text-base">
//               Calendar
//             </span>
//           </TabsTrigger>

//           <TabsTrigger value="chat" className="flex items-center gap-2">
//             <MessageSquare className="w-4 h-4 text-purple-600" />
//             <span className="sm:inline text-purple-600 md:text-xl lg:text-base">
//               Team Chat
//             </span>
//           </TabsTrigger>

//           <TabsTrigger value="activity" className="flex items-center gap-2">
//             <Github className="w-4 h-4 text-purple-600" />
//             <span className="sm:inline text-purple-600 md:text-xl lg:text-base">
//               Github Activity
//             </span>
//           </TabsTrigger>
//         </TabsList>

//         <div className="w-full">
//           <TabsContent value="kanban" className="w-full min-h-[500px] rounded-lg px-2">
//             <BoardContent />
//           </TabsContent>

//           <TabsContent value="calendar" className="w-full min-h-[500px] rounded-lg px-2">
//             <ProjectCalendarPage projectId={projectId} />
//           </TabsContent>

//           <TabsContent value="chat" className="w-full min-h-[500px] rounded-lg px-2">
//             {loading ? (
//               <p>Checking chat access...</p>
//             ) : error ? (
//               <p className="text-red-600">{error}</p>
//             ) : hasAccess ? (
//               <TeamChat projectId={projectId} currentUserId={currentUserId} />
//             ) : (
//               <p className="text-red-600">You don't have access to this project's chat.</p>
//             )}
//           </TabsContent>

//           <TabsContent value="activity" className="w-full min-h-[500px] rounded-lg px-2">
//             Github activity will go here.
//           </TabsContent>
//         </div>
//       </Tabs>
//     </div>
//   );
// }



// "use client";

// import React, { useEffect, useState } from "react";
// import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
// import { Github, LayoutDashboard, MessageSquare, CalendarDays } from "lucide-react";
// import BoardContent from "./ui/BoardContent";
// import { useParams } from "next/navigation";
// import TeamChat from "@/components/Tchat";
// import ProjectCalendarPage from "@/components/ProjectCalendarPage";
// import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

// export default function TabsSection() {
//   const [currentUserId, setCurrentUserId] = useState<string | null>(null);
//   const [hasAccess, setHasAccess] = useState<boolean>(false);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);

//   const supabase = createClientComponentClient();
//   const params = useParams();
//   const projectId = params.projectId as string;

//   // 1. Fetch current user's profile ID from `profiles` table
//   useEffect(() => {
//     const fetchCurrentUserId = async () => {
//       try {
//         // Get logged-in user from auth
//         const {
//           data: { user },
//           error: authError,
//         } = await supabase.auth.getUser();

//         if (authError || !user) {
//           setError("Failed to get authenticated user.");
//           setLoading(false);
//           return;
//         }

//         // Fetch user profile by auth user ID or email (assuming profiles.user_id === auth user.id)
//         const { data: profile, error: profileError } = await supabase
//           .from("profiles")
//           .select("id")
//           .eq("id", user.id)  // or use another field, adjust if needed
//           .single();

//         if (profileError || !profile) {
//           setError("Failed to fetch user profile.");
//           setLoading(false);
//           return;
//         }

//         setCurrentUserId(profile.id);
//       } catch (err) {
//         console.error("Error fetching user profile:", err);
//         setError("Unexpected error fetching user profile.");
//         setLoading(false);
//       }
//     };

//     fetchCurrentUserId();
//   }, [supabase]);

//   // 2. Check access once we have currentUserId and projectId
//   useEffect(() => {
//     const checkUserAccess = async () => {
//       setLoading(true);
//       setError(null);

//       if (!currentUserId || !projectId) {
//         setError("Missing user or project ID.");
//         setLoading(false);
//         return;
//       }

//       try {
//         const { data, error: accessError } = await supabase
//           .from("projects")
//           .select("*")
//           .eq("project_id", projectId)
//           .contains("team_members", [currentUserId])
//           .single();

//         if (accessError || !data) {
//           setHasAccess(false);
//           if (accessError?.code !== "PGRST116") {
//             console.error("Error checking access:", accessError);
//             setError("Failed to verify user access.");
//           }
//         } else {
//           setHasAccess(true);
//         }
//       } catch (err) {
//         console.error("Unexpected error:", err);
//         setError("Unexpected error occurred.");
//       } finally {
//         setLoading(false);
//       }
//     };

//     if (currentUserId && projectId) {
//       checkUserAccess();
//     }
//   }, [supabase, currentUserId, projectId]);

//   console.log("params:", params);
//   console.log("projectId:", projectId);
//   console.log("currentUserId:", currentUserId);

//   return (
//     <div className="w-full flex flex-col">
//       <Tabs defaultValue="kanban" className="w-full flex flex-col">
//         <TabsList className="grid w-full grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 mb-4">
//           <TabsTrigger value="kanban" className="flex items-center gap-2">
//             <LayoutDashboard className="w-4 h-4 text-purple-600" />
//             <span className="sm:inline text-purple-600 md:text-xl lg:text-base">Kanban</span>
//           </TabsTrigger>

//           <TabsTrigger value="calendar" className="flex items-center gap-2">
//             <CalendarDays className="w-4 h-4 text-purple-600" />
//             <span className="sm:inline text-purple-600 md:text-xl lg:text-base">Calendar</span>
//           </TabsTrigger>

//           <TabsTrigger value="chat" className="flex items-center gap-2">
//             <MessageSquare className="w-4 h-4 text-purple-600" />
//             <span className="sm:inline text-purple-600 md:text-xl lg:text-base">Team Chat</span>
//           </TabsTrigger>

//           <TabsTrigger value="activity" className="flex items-center gap-2">
//             <Github className="w-4 h-4 text-purple-600" />
//             <span className="sm:inline text-purple-600 md:text-xl lg:text-base">Github Activity</span>
//           </TabsTrigger>
//         </TabsList>

//         <div className="w-full">
//           <TabsContent value="kanban" className="w-full min-h-[500px] rounded-lg px-2">
//             <BoardContent />
//           </TabsContent>

//           <TabsContent value="calendar" className="w-full min-h-[500px] rounded-lg px-2">
//             <ProjectCalendarPage projectId={projectId} />
//           </TabsContent>

//           <TabsContent value="chat" className="w-full min-h-[500px] rounded-lg px-2">
//             {loading ? (
//               <p>Checking chat access...</p>
//             ) : error ? (
//               <p className="text-red-600">{error}</p>
//             ) : hasAccess && currentUserId ? (
//               <TeamChat projectId={projectId} currentUserId={currentUserId} />
//             ) : (
//               <p className="text-red-600">You don't have access to this project's chat.</p>
//             )}
//           </TabsContent>

//           <TabsContent value="activity" className="w-full min-h-[500px] rounded-lg px-2">
//             Github activity will go here.
//           </TabsContent>
//         </div>
//       </Tabs>
//     </div>
//   );
// }

"use client";

import React, { useEffect, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Github, LayoutDashboard, MessageSquare, CalendarDays } from "lucide-react";
import BoardContent from "./ui/BoardContent";
import { useParams } from "next/navigation";
import TeamChat from "@/components/Tchat";
import ProjectCalendarPage from "@/components/ProjectCalendarPage";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

export default function TabsSection() {
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [hasAccess, setHasAccess] = useState<boolean>(false);
  const [loadingUser, setLoadingUser] = useState(true);
  const [loadingAccess, setLoadingAccess] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClientComponentClient();
  const params = useParams();
  const projectId = params.projectId as string;

  console.log("🔍 URL params:", params);
  console.log("🔍 Extracted projectId:", projectId);

  // Fetch current logged-in user ID and profile
  useEffect(() => {
    async function fetchCurrentUser() {
      setLoadingUser(true);
      setError(null);

      try {
        console.log("🚀 Fetching current user session...");
        
        // Try getUser() first as it's more reliable for getting current user
        const { data: userData, error: userError } = await supabase.auth.getUser();
        console.log("🔍 getUser() result:", { userData, userError });

        if (userError) {
          console.warn("⚠️ getUser() failed, trying getSession():", userError);
          
          // Fallback to getSession()
          const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
          console.log("🔍 getSession() result:", { sessionData, sessionError });

          if (sessionError || !sessionData.session?.user) {
            throw new Error("No authenticated user found");
          }

          const userId = sessionData.session.user.id;
          console.log("✅ Current user ID from session:", userId);
          setCurrentUserId(userId);
        } else {
          if (!userData.user) {
            throw new Error("No user data returned");
          }
          
          const userId = userData.user.id;
          console.log("✅ Current user ID from getUser():", userId);
          setCurrentUserId(userId);
        }

        // Fetch profile after successfully getting user ID
        if (currentUserId) {
          console.log("🔍 Fetching profile for user:", currentUserId);
          const { data: profileData, error: profileError } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", currentUserId)
            .single();

          if (profileError) {
            console.warn("⚠️ Failed to fetch user profile:", profileError);
          } else {
            console.log("✅ User profile data:", profileData);
            setProfile(profileData);
          }
        }

      } catch (err: any) {
        console.error("❌ Error during user fetch:", err);
        setError(`Failed to fetch current user: ${err.message}`);
        setCurrentUserId(null);
      } finally {
        setLoadingUser(false);
      }
    }

    fetchCurrentUser();
  }, [supabase]); // Removed currentUserId from dependencies to avoid infinite loop

  // Separate effect for fetching profile when currentUserId changes
  useEffect(() => {
    async function fetchProfile() {
      if (!currentUserId) return;

      try {
        console.log("🔍 Fetching profile for user:", currentUserId);
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", currentUserId)
          .single();

        if (profileError) {
          console.warn("⚠️ Failed to fetch user profile:", profileError);
        } else {
          console.log("✅ User profile data:", profileData);
          setProfile(profileData);
        }
      } catch (err) {
        console.error("❌ Error fetching profile:", err);
      }
    }

    fetchProfile();
  }, [currentUserId, supabase]);

  // Check if current user has access to the project
  useEffect(() => {
    async function checkUserAccess() {
      if (!currentUserId || !projectId) {
        console.warn("⚠️ Missing currentUserId or projectId:", { currentUserId, projectId });
        setHasAccess(false);
        setLoadingAccess(false);
        if (!currentUserId) setError("User not logged in.");
        if (!projectId) setError("Project ID missing.");
        return;
      }

      setLoadingAccess(true);
      setError(null);

      try {
        console.log("🔍 Checking access for user:", currentUserId, "project:", projectId);
        
        const { data, error: accessError } = await supabase
          .from("projects")
          .select("team_members")
          .eq("project_id", projectId)
          .single();

        console.log("🔍 Project access fetch result:", { data, accessError });

        if (accessError) {
          console.error("❌ Access check error:", accessError);
          throw new Error(`Failed to verify user access: ${accessError.message}`);
        }

        if (!data) {
          throw new Error("Project not found");
        }

        const isMember =
          Array.isArray(data.team_members) && data.team_members.includes(currentUserId);
        console.log(`✅ User ${currentUserId} has access:`, isMember);
        console.log("🔍 Team members array:", data.team_members);
        setHasAccess(isMember);

      } catch (err: any) {
        console.error("❌ Error during access check:", err);
        setError(`Failed to verify user access: ${err.message}`);
        setHasAccess(false);
      } finally {
        setLoadingAccess(false);
      }
    }

    checkUserAccess();
  }, [supabase, currentUserId, projectId]);

  // Debug render to show current state
  console.log("🔍 Current state:", {
    currentUserId,
    hasAccess,
    loadingUser,
    loadingAccess,
    error,
    projectId
  });

  if (loadingUser) {
    return (
      <div className="text-center p-4">
        <p>Loading user info...</p>
        {error && <p className="text-red-600 mt-2">Error: {error}</p>}
      </div>
    );
  }

  if (!currentUserId) {
    return (
      <div className="text-center p-4">
        <p className="text-red-600">Unable to get current user. Please log in.</p>
        {error && <p className="text-red-600 mt-2">Error: {error}</p>}
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col">
      {/* Debug info - remove in production */}
      <div className="bg-gray-100 p-2 mb-4 text-xs rounded">
        <p>Debug: User ID: {currentUserId}</p>
        <p>Debug: Project ID: {projectId}</p>
        <p>Debug: Has Access: {hasAccess.toString()}</p>
      </div>

      <Tabs defaultValue="kanban" className="w-full flex flex-col">
        <TabsList className="grid w-full grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 mb-4">
          <TabsTrigger value="kanban" className="flex items-center gap-2">
            <LayoutDashboard className="w-4 h-4 text-purple-600" />
            <span className="text-purple-600">Kanban</span>
          </TabsTrigger>

          <TabsTrigger value="calendar" className="flex items-center gap-2">
            <CalendarDays className="w-4 h-4 text-purple-600" />
            <span className="text-purple-600">Calendar</span>
          </TabsTrigger>

          <TabsTrigger value="chat" className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-purple-600" />
            <span className="text-purple-600">Team Chat</span>
          </TabsTrigger>

          <TabsTrigger value="activity" className="flex items-center gap-2">
            <Github className="w-4 h-4 text-purple-600" />
            <span className="text-purple-600">Github Activity</span>
          </TabsTrigger>
        </TabsList>

        <div className="w-full">
          <TabsContent value="kanban" className="w-full min-h-[500px] rounded-lg px-2">
            <BoardContent profile={profile} />
          </TabsContent>

          <TabsContent value="calendar" className="w-full min-h-[500px] rounded-lg px-2">
            <ProjectCalendarPage projectId={projectId} />
          </TabsContent>

          <TabsContent value="chat" className="w-full min-h-[500px] rounded-lg px-2">
            {loadingAccess ? (
              <p>Checking chat access...</p>
            ) : error ? (
              <p className="text-red-600">{error}</p>
            ) : hasAccess ? (
              <TeamChat projectId={projectId} currentUserId={currentUserId} />
            ) : (
              <p className="text-red-600">You don't have access to this project's chat.</p>
            )}
          </TabsContent>

          <TabsContent value="activity" className="w-full min-h-[500px] rounded-lg px-2">
            Github activity will go here.
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}