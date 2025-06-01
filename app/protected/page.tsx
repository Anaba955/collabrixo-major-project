"use client";
import React, { useEffect, useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import PieChart from "./_components/PieChart";
import Heatmap from "./_components/Heatmap";
import NotificationPanel from "./_components/NotificationPanel";
import NotificationButton from "./_components/NotificationButton";
import { createClient } from "@/utils/supabase/client";
import JeemBackground from "./_components/JeemBackground";
import TaskSummaryCards from "./_components/TaskSummaryCards";
import Link from "next/link";
import { Settings } from "lucide-react";
import BarsWithLine from "./_components/BarsWithLines";
import { Notification } from "./_components/NotificationPanel";

// Task data interfaces
interface TaskCounts {
  total: number;
  todo: number;
  inProgress: number;
  done: number;
}

type Task = {
  created_at: string;
  status: "todo" | "inProgress" | "done";
};

type TaskData = {
  week: string;
  todo: number;
  inProgress: number;
  done: number;
  totalTasks: number;
};

interface PieChartItem {
  name: string;
  value: number;
}

interface Profile {
  id: string;
  username: string | null;
  avatar_url: string | null;
}

export default function Dashboard() {
  // State for task data
  const supabaseClient = createClient();
  const [taskCounts, setTaskCounts] = useState<TaskCounts | null>(null);
  const [pieChartData, setPieChartData] = useState<PieChartItem[] | null>(null);
  const [taskLoading, setTaskLoading] = useState(true);
  const [heatmapLoading, setHeatmapLoading] = useState(true);
  // State for user profile data
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [taskChartData, setTaskChartData] = useState<TaskData[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // State to track window size for responsive components
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [graphDimensions, setGraphDimensions] = useState({
    width: 0,
    height: 0,
  });
  // State to control notification panel visibility
  const [showNotifications, setShowNotifications] = useState(false);

  // Reference to track clicks outside
  const notificationRef = useRef<HTMLDivElement>(null);
  const notificationAudioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        setGraphDimensions({
          width: containerRef.current.offsetWidth,
          height: containerRef.current.offsetHeight,
        });
      }
    };
    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, []);

  // Fetch user profile data
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const supabase = createClient();

        // Get current user
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();
        if (userError || !user) {
          throw new Error("User not found");
        }

        // Get user profile from profiles table
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("id, username, avatar_url")
          .eq("id", user.id)
          .single();

        if (!profileError && profileData) {
          setProfile(profileData);
        }
        setLoading(false);
      } catch (error) {
        console.error("Error fetching user profile:", error);
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, []);

  // Fetch task data
  useEffect(() => {
    const fetchTaskData = async () => {
      try {
        setTaskLoading(true);

        const supabase = createClient();

        // Get user ID
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) throw new Error("User not found");

        // Get task status distribution
        const { data, error } = await supabase.rpc(
          "get_user_task_status_distribution",
          {
            p_user_id: user.id,
          }
        );
        if (error) throw error;

        if (data && Array.isArray(data)) {
          // Calculate task counts
          let todo = 0;
          let inProgress = 0;
          let done = 0;
          let total = 0;

          // Map status data to pie chart format
          const chartData: PieChartItem[] = data.map((item) => {
            const value = Number(item.task_count) || 0;
            total += value;

            if (item.status === "todo") todo = value;
            else if (item.status === "inProgress") inProgress = value;
            else if (item.status === "done") done = value;

            return {
              name:
                item.status === "inProgress"
                  ? "In Progress"
                  : item.status === "todo"
                    ? "To Do"
                    : item.status === "done"
                      ? "Done"
                      : item.status,
              value: value,
            };
          });

          setTaskCounts({
            total,
            todo,
            inProgress,
            done,
          });
          setPieChartData(chartData);
        }

        setTaskLoading(false);
      } catch (error) {
        console.error("Error fetching task data:", error);
        setTaskLoading(false);
      }
    };

    fetchTaskData();
  }, []);

  // Set heatmap loaded after a short delay (no actual fetch needed)
  useEffect(() => {
    const timer = setTimeout(() => {
      setHeatmapLoading(false);
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    // Set initial dimensions
    setDimensions({
      width: window.innerWidth,
      height: window.innerHeight,
    });

    // Update dimensions on window resize
    const handleResize = () => {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);


 useEffect(() => {
  function getWeekOfMonth(date: Date): number {
    const start = new Date(date.getFullYear(), date.getMonth(), 1);
    const day = date.getDate();
    const startDay = start.getDay(); // Sunday = 0
    return Math.ceil((day + startDay) / 7);
  }

  function countTasksPerWeekByStatus(tasks: Task[]): TaskData[] {
    const result: Record<
      number,
      { todo: number; inProgress: number; done: number }
    > = {
      1: { todo: 0, inProgress: 0, done: 0 },
      2: { todo: 0, inProgress: 0, done: 0 },
      3: { todo: 0, inProgress: 0, done: 0 },
      4: { todo: 0, inProgress: 0, done: 0 },
      5: { todo: 0, inProgress: 0, done: 0 },
    };

    tasks.forEach((task) => {
      if (!task.created_at) return;

      const date = new Date(task.created_at);
      if (isNaN(date.getTime())) return;

      const week = getWeekOfMonth(date);
      if (!result[week]) {
        result[week] = { todo: 0, inProgress: 0, done: 0 };
      }

      if (task.status === "todo") result[week].todo += 1;
      else if (task.status === "inProgress") result[week].inProgress += 1;
      else if (task.status === "done") result[week].done += 1;
    });

    const formatted: TaskData[] = Object.entries(result).map(
      ([week, counts]) => ({
        week: `Week ${week}`,
        ...counts,
        totalTasks: counts.todo + counts.inProgress + counts.done,
      })
    );

    return formatted;
  }

  const getData = async () => {
    const { data: userData, error: userError } =
      await supabaseClient.auth.getUser();
    if (userError || !userData.user) {
      console.log("Error fetching current user", userError);
      return;
    }

    const { data: tasks, error } = await supabaseClient
      .from("tasks")
      .select("status, created_at")
      .eq("assigned_to", userData.user.id);

    if (error) {
      console.log("Error fetching data for bar graph", error);
      return;
    }

    const taskChartData: TaskData[] = countTasksPerWeekByStatus(tasks);
    setTaskChartData(taskChartData);
  };

  getData();
}, []);


  // Notification handlers
  const markAsRead = (id: string | number) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isUnread: false } : n))
    );
  };
  const markAsUnread = (id: string | number) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isUnread: true } : n))
    );
  };

  // Real-time notification logic
  useEffect(() => {
    let channel: any;
    let userId: string | null = null;
    let userProfile: Profile | null = null;
    let isMounted = true;
    const supabase = createClient();

    async function fetchUserAndSubscribe() {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      userId = user.id;
      // Get user profile (for avatar, etc.)
      const { data: profileData } = await supabase
        .from("profiles")
        .select("id, username, avatar_url")
        .eq("id", user.id)
        .single();
      userProfile = profileData;

      // Initial fetch: get all tasks assigned to this user (for notifications)
      const { data: tasks } = await supabase
        .from("tasks")
        .select("task_id, title, created_by, created_at")
        .eq("assigned_to", user.id)
        .order("created_at", { ascending: false });
      if (tasks && isMounted) {
        // Fetch assigner names in parallel
        const assignerIds = Array.from(new Set(tasks.map((t: any) => t.created_by).filter(Boolean)));
        let assignerMap: Record<string, { name: string; image: string; bgColor: string }> = {};
        if (assignerIds.length > 0) {
          const { data: assigners } = await supabase
            .from("profiles")
            .select("id, username, email, avatar_url")
            .in("id", assignerIds);
          if (assigners) {
            assigners.forEach((a: any) => {
              assignerMap[a.id] = {
                name: a.username || a.email || "Unknown",
                image: a.avatar_url || "/twitter-image.png",
                bgColor: "bg-indigo-800",
              };
            });
          }
        }
        // Build notifications
        const notifs: Notification[] = tasks.map((task: any) => {
          const assigner = assignerMap[task.created_by] || {
            name: "Unknown",
            image: "/twitter-image.png",
            bgColor: "bg-indigo-800",
          };
          return {
            id: task.task_id,
            user: assigner,
            action: "assigned you a task:",
            target: task.title,
            time: new Date(task.created_at).toLocaleString(),
            isUnread: true,
          };
        });
        setNotifications(notifs);
      }

      // Real-time subscription for new tasks assigned to this user
      channel = supabase
        .channel("realtime-tasks-notif")
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "tasks",
            filter: `assigned_to=eq.${user.id}`,
          },
          async (payload: any) => {
            const task = payload.new;
            // Fetch assigner profile
            let assigner = { name: "Unknown", image: "/twitter-image.png", bgColor: "bg-indigo-800" };
            if (task.created_by) {
              const { data: a } = await supabase
                .from("profiles")
                .select("username, email, avatar_url")
                .eq("id", task.created_by)
                .single();
              if (a) {
                assigner = {
                  name: a.username || a.email || "Unknown",
                  image: a.avatar_url || "/twitter-image.png",
                  bgColor: "bg-indigo-800",
                };
              }
            }
            setNotifications((prev) => [
              {
                id: task.task_id,
                user: assigner,
                action: "assigned you a task:",
                target: task.title,
                time: new Date(task.created_at).toLocaleString(),
                isUnread: true,
              },
              ...prev,
            ]);
            if (notificationAudioRef.current) {
              notificationAudioRef.current.currentTime = 0;
              notificationAudioRef.current.play().catch(() => {});
            }
          }
        )
        .subscribe();
    }
    fetchUserAndSubscribe();
    return () => {
      isMounted = false;
      if (channel) channel.unsubscribe();
    };
  }, []);

  // Calculate unread count
  const unreadCount = notifications.filter((n) => n.isUnread).length;

  // Add event listener to close notifications when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        showNotifications &&
        notificationRef.current &&
        !notificationRef.current.contains(event.target as Node)
      ) {
        setShowNotifications(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showNotifications]);

  // Calculate appropriate sizes based on screen width
  const getPieChartWidth = () => {
    const width = dimensions.width;
    if (width < 400) return width - 40; // Small mobile
    if (width < 640) return 320; // Mobile
    if (width < 768) return 350; // Small tablet
    if (width < 1024) return 400; // Tablet/small laptop
    return 450; // Desktop
  };

  const getHeatmapWidth = () => {
    const width = dimensions.width;
    if (width < 640) return 500; // Mobile scrollable
    if (width < 768) return 600; // Small tablet
    if (width < 1024) return 700; // Tablet
    if (width < 1280) return 800; // Small desktop
    return 900; // Large desktop
  };

  // Prime audio on first user interaction
  useEffect(() => {
    notificationAudioRef.current = new Audio('/notification.mp3');
    const prime = () => {
      notificationAudioRef.current?.play().then(() => {
        notificationAudioRef.current?.pause();
        notificationAudioRef.current!.currentTime = 0;
      }).catch(() => {});
      window.removeEventListener('click', prime);
    };
    window.addEventListener('click', prime);
    return () => window.removeEventListener('click', prime);
  }, []);

  return (
    <div className="p-4 md:p-8 lg:p-10 bg-transparent min-h-screen pb-24 max-w-[100vw] overflow-hidden">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 md:mb-10 gap-4">
        <div className="w-full md:w-auto">
          <div className="flex items-center gap-4 mb-2" ref={notificationRef}>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-black dark:text-white">
              Dashboard
            </h1>
            <NotificationButton
              count={unreadCount}
              onClick={() => setShowNotifications(!showNotifications)}
            />
            <NotificationPanel
              isOpen={showNotifications}
              onClose={() => setShowNotifications(false)}
              notifications={notifications}
              markAsRead={markAsRead}
              markAsUnread={markAsUnread}
            />
          </div>
          <p className="text-gray-600 dark:text-gray-400 text-base sm:text-lg max-w-[90vw] md:max-w-none">
            Welcome back,{" "}
            <span className="font-semibold">{profile?.username || "User"}</span>
          </p>
        </div>

        <div className="flex items-center space-x-4 w-full md:w-auto justify-end">
          <div className="bg-white/70 backdrop-blur-lg dark:bg-gray-800 px-3 sm:px-4 py-2 rounded-md shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] border-2 border-black dark:border-white flex items-center gap-2">
            <Link
              href="/protected/profile"
              className="hover:text-blue-500 transition-colors"
            >
              <Settings className="h-4 w-4" />
            </Link>
            <span className="font-bold text-sm sm:text-base">
              {profile?.username || "User"}
            </span>
          </div>
          <div className="h-16 w-16 sm:h-16 sm:w-16 rounded-md bg-black dark:bg-white shadow-[4px_4px_0px_0px_rgba(128,128,128,1)] overflow-hidden border-2 border-black dark:border-white flex-shrink-0">
            <div className="bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 w-full h-full">
              <img
                src={profile?.avatar_url || "/twitter-image.png"}
                alt={profile?.username || "User"}
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </div>
      <JeemBackground opacity={0.7} blurAmount={120} speed={35} />

      {/* Task Summary Row */}
      <TaskSummaryCards />

      {/* Middle Row - Progress Graph and Pie Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8 mb-6 md:mb-8">
        <Card className="border-2 border-black dark:border-gray-800 bg-white/70 backdrop-blur-lg dark:bg-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all overflow-hidden">
          <CardHeader className="border-b-2 border-black dark:border-gray-800 bg-gradient-to-r from-blue-50/90 to-blue-100/90 dark:from-blue-900/20 dark:to-indigo-900/20 p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0">
              <CardTitle className="font-black text-base sm:text-lg">
                PROGRESS GRAPH
              </CardTitle>
              <div className="flex flex-wrap gap-2">
                <span className="bg-blue-200/90 dark:bg-blue-800 text-blue-800 dark:text-blue-200 border border-black dark:border-blue-600 px-2 py-1 text-xs rounded font-bold">
                  Weekly
                </span>
                <span className="bg-white/90 dark:bg-gray-800 border border-black dark:border-gray-700 px-2 py-1 text-xs rounded font-bold">
                  Monthly
                </span>
              </div>
            </div>
          </CardHeader>
          <CardContent ref={containerRef} className="p-4 sm:p-6 m-6">
            <div className="h-64 sm:h-[300px] flex items-center justify-center bg-gradient-to-r from-gray-50/90 to-gray-100/90 dark:from-gray-900/20 dark:to-gray-800/20 rounded-md border-2 border-dashed border-black dark:border-gray-700">
              {/* This is a placeholder for the Progress Graph component */}
              {taskChartData.length > 0 && graphDimensions.width > 0 && graphDimensions.height > 0 && (
                <BarsWithLine
                  width={graphDimensions.width}
                  height={graphDimensions.height}
                  data={taskChartData}
                  events={true}
                />
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-black dark:border-gray-800 bg-white/70 backdrop-blur-lg dark:bg-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all overflow-hidden">
          <CardHeader className="border-b-2 border-black dark:border-gray-800 bg-gradient-to-r from-purple-50/90 to-indigo-100/90 dark:from-purple-900/20 dark:to-indigo-900/20 p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0">
              <CardTitle className="font-black text-base sm:text-lg">
                TASKS OVERVIEW
              </CardTitle>
              <div className="px-2 py-1 bg-white/90 dark:bg-gray-800 rounded border-2 border-black dark:border-gray-700 text-xs font-bold">
                Last updated: Today
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-3">
            <div className="h-64 sm:h-[300px] flex items-center justify-center">
              {dimensions.width > 0 && !taskLoading && pieChartData && (
                <PieChart
                  width={getPieChartWidth()}
                  height={Math.min(getPieChartWidth() * 0.8, 310)}
                />
              )}
              {taskLoading && (
                <div className="animate-spin w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full"></div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row - Activity Heatmap */}
      <Card className="border-2 border-black dark:border-gray-800 bg-white/70 backdrop-blur-lg dark:bg-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all mb-6 overflow-hidden">
        <CardHeader className="border-b-2 border-black dark:border-gray-800 bg-gradient-to-r from-green-50/90 to-emerald-100/90 dark:from-green-900/20 dark:to-emerald-900/20 p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0">
            <CardTitle className="font-black text-base sm:text-lg">
              MONTHLY ACTIVITY HEATMAP
            </CardTitle>
            <div className="flex flex-wrap gap-2">
              <span className="bg-green-200/90 dark:bg-green-800 text-green-800 dark:text-green-200 border border-black dark:border-green-600 px-2 py-1 text-xs rounded font-bold">
                Projects: All
              </span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-3 overflow-x-auto">
          <div className="h-64 sm:h-[280px] flex items-center justify-center min-w-[500px]">
            {dimensions.width > 0 && !heatmapLoading && (
              <Heatmap width={getHeatmapWidth()} height={240} />
            )}
            {heatmapLoading && (
              <div className="animate-spin w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full"></div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
