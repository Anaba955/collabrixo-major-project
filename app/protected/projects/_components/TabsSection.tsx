

"use client";

import React, { useEffect, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { Github, LayoutDashboard, MessageSquare, CalendarDays } from "lucide-react";
import BoardContent from "./ui/BoardContent";
import { useParams } from "next/navigation";
import TeamChat from "@/components/Tchat";
import ProjectCalendarPage from "@/components/ProjectCalendarPage";
import { createClient } from "@/utils/supabase/client"; // Updated import
import { User } from "@supabase/supabase-js";

import GithubActivity from "./GithubActivity";


export default function TabsSection() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [hasAccess, setHasAccess] = useState<boolean>(false);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [loadingAccess, setLoadingAccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient(); // Updated client creation
  const params = useParams();
  const projectId = params.projectId as string;

  console.log("🔍 URL params:", params);
  console.log("🔍 Extracted projectId:", projectId);

  // Initialize auth state and listen for changes
  useEffect(() => {
    let mounted = true;

    async function initializeAuth() {
      try {
        console.log("🚀 Initializing auth state...");
        
        // Get initial session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error("❌ Session error:", sessionError);
          throw sessionError;
        }

        if (mounted) {
          if (session?.user) {
            console.log("✅ Initial user found:", session.user.id);
            setCurrentUser(session.user);
          } else {
            console.log("⚠️ No initial session found");
            setCurrentUser(null);
          }
          setLoadingAuth(false);
        }
      } catch (err: any) {
        console.error("❌ Auth initialization error:", err);
        if (mounted) {
          setError(`Authentication failed: ${err.message}`);
          setCurrentUser(null);
          setLoadingAuth(false);
        }
      }
    }

    initializeAuth();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log("🔄 Auth state changed:", event, session?.user?.id);
        
        if (mounted) {
          if (session?.user) {
            setCurrentUser(session.user);
            setError(null);
          } else {
            setCurrentUser(null);
            setProfile(null);
            setHasAccess(false);
          }
          setLoadingAuth(false);
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [supabase.auth]);

  // Fetch user profile when user changes
  useEffect(() => {
    if (!currentUser) {
      setProfile(null);
      return;
    }

    async function fetchProfile() {
      try {
        console.log("🔍 Fetching profile for user:", currentUser.id);
        
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", currentUser.id)
          .single();

        if (profileError) {
          console.warn("⚠️ Failed to fetch user profile:", profileError);
          // Don't treat profile fetch failure as critical error
        } else {
          console.log("✅ User profile data:", profileData);
          setProfile(profileData);
        }
      } catch (err) {
        console.error("❌ Error fetching profile:", err);
      }
    }

    fetchProfile();
  }, [currentUser, supabase]);

  // Check project access when user or projectId changes
  useEffect(() => {
    if (!currentUser || !projectId) {
      console.warn("⚠️ Missing user or projectId:", { 
        userId: currentUser?.id, 
        projectId 
      });
      setHasAccess(false);
      setLoadingAccess(false);
      
      if (!currentUser) {
        setError("Please log in to access this project.");
      } else if (!projectId) {
        setError("Project ID is missing.");
      }
      return;
    }

    async function checkUserAccess() {
      setLoadingAccess(true);
      setError(null);

      try {
        console.log("🔍 Checking access for user:", currentUser.id, "project:", projectId);
        
        const { data, error: accessError } = await supabase
          .from("projects")
          .select("team_members")
          .eq("project_id", projectId)
          .single();

        console.log("🔍 Project access fetch result:", { data, accessError });

        if (accessError) {
          console.error("❌ Access check error:", accessError);
          
          if (accessError.code === 'PGRST116') {
            throw new Error("Project not found");
          } else {
            throw new Error(`Failed to verify access: ${accessError.message}`);
          }
        }

        if (!data) {
          throw new Error("Project not found");
        }

        // Check if user is in team_members array
        const isTeamMember = Array.isArray(data.team_members) && 
                            data.team_members.includes(currentUser.id);
        const hasProjectAccess = isTeamMember;

        console.log("🔍 Access check results:", {
          userId: currentUser.id,
          isTeamMember,
          hasProjectAccess,
          teamMembers: data.team_members
        });

        setHasAccess(hasProjectAccess);

        if (!hasProjectAccess) {
          setError("You don't have permission to access this project.");
        }

      } catch (err: any) {
        console.error("❌ Error during access check:", err);
        setError(err.message);
        setHasAccess(false);
      } finally {
        setLoadingAccess(false);
      }
    }

    checkUserAccess();
  }, [currentUser, projectId, supabase]);

  // Debug current state
  console.log("🔍 Current state:", {
    userId: currentUser?.id,
    hasAccess,
    loadingAuth,
    loadingAccess,
    error,
    projectId
  });

  // Loading state
  if (loadingAuth) {
    return (
      <div className="flex justify-center items-center min-h-[200px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-2"></div>
          <p>Loading authentication...</p>
        </div>
      </div>
    );
  }

  // Not authenticated
  if (!currentUser) {
    return (
      <div className="text-center p-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-red-800 mb-2">Authentication Required</h2>
          <p className="text-red-600">Please log in to access this project.</p>
          {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
        </div>
      </div>
    );
  }

  // Access check loading
  if (loadingAccess) {
    return (
      <div className="flex justify-center items-center min-h-[200px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-2"></div>
          <p>Verifying project access...</p>
        </div>
      </div>
    );
  }

  // Access denied
  if (!hasAccess) {
    return (

      <div className="text-center p-8">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-yellow-800 mb-2">Access Denied</h2>
          <p className="text-yellow-700">
            {error || "You don't have permission to access this project."}
          </p>
          <p className="text-sm text-yellow-600 mt-2">
            User ID: {currentUser.id} | Project ID: {projectId}
          </p>
        </div>
      </div>
    );
  }

  // Main content when authenticated and has access
  return (
    <div className="w-full flex flex-col">
      {/* Remove debug info in production */}
      {/* {process.env.NODE_ENV === 'development' && (
        <div className="bg-gray-100 p-2 mb-4 text-xs rounded">
          <p>Debug: User ID: {currentUser.id}</p>
          <p>Debug: Project ID: {projectId}</p>
          <p>Debug: Has Access: {hasAccess.toString()}</p>
          <p>Debug: Email: {currentUser.email}</p>
        </div>
      )} */}

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
            <TeamChat projectId={projectId} currentUserId={currentUser.id} />
          </TabsContent>

          <TabsContent value="activity" className="w-full min-h-[500px] rounded-lg px-2">
            <div className="text-center p-8 text-gray-500">
              <Github className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <GithubActivity />

       
            </div>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}