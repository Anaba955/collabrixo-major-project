"use client";
import React, { useEffect, useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import PieChart from './_components/PieChart';
import Heatmap, { WeekData } from './_components/Heatmap';
import NotificationPanel from './_components/NotificationPanel';
import NotificationButton from './_components/NotificationButton';
import { createClient } from '@/utils/supabase/client';
import JeemBackground from './_components/JeemBackground';

// Task data interfaces
interface TaskCounts {
  total: number;
  todo: number;
  inProgress: number;
  done: number;
}

interface PieChartItem {
  name: string;
  value: number;
}

// Dummy data for pie chart
const DUMMY_PIE_CHART_DATA: PieChartItem[] = [
  { name: 'To Do', value: 12 },
  { name: 'In Progress', value: 8 },
  { name: 'Done', value: 15 }
];

// Dummy data for task counts
const DUMMY_TASK_COUNTS: TaskCounts = {
  total: 35,
  todo: 12,
  inProgress: 8,
  done: 15
};

// Dummy data generator for heatmap
const generateDummyHeatmapData = (): WeekData[] => {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const weeks = 5;
  
  return Array.from({ length: weeks }, (_, weekIndex) => ({
    bins: days.map(day => ({
      day,
      // Create a pattern - more activity on weekdays, less on weekends
      count: day === 'Sat' || day === 'Sun' 
        ? Math.floor(Math.random() * 3) // 0-2 for weekends
        : Math.floor(Math.random() * 7) + 2 // 2-8 for weekdays
    }))
  }));
};

export default function Dashboard() {
  // State for task data
  const [taskCounts, setTaskCounts] = useState<TaskCounts>(DUMMY_TASK_COUNTS);
  const [pieChartData, setPieChartData] = useState<PieChartItem[]>(DUMMY_PIE_CHART_DATA);
  const [taskLoading, setTaskLoading] = useState(true);

  // State for heatmap data
  const [weekData, setWeekData] = useState<WeekData[]>(generateDummyHeatmapData());
  const [heatmapLoading, setHeatmapLoading] = useState(true);

  // State to track window size for responsive components
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  // State to control notification panel visibility
  const [showNotifications, setShowNotifications] = useState(false);
  
  // Reference to track clicks outside
  const notificationRef = useRef<HTMLDivElement>(null);

  // Fetch task data
  useEffect(() => {
    const fetchTaskData = async () => {
      try {
        setTaskLoading(true);
        
        // Uncomment below to use real data from Supabase
        // -------------------------------------------------
        /*
        const supabase = createClient();
        
        // Get user ID
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('User not found');
        
        // Get task status distribution
        const { data, error } = await supabase.rpc('get_user_task_status_distribution', {
          p_user_id: user.id
        });
        
        if (error) throw error;
        
        if (data && Array.isArray(data)) {
          // Calculate task counts
          let todo = 0;
          let inProgress = 0;
          let done = 0;
          let total = 0;
          
          // Map status data to pie chart format
          const chartData: PieChartItem[] = data.map(item => {
            const value = Number(item.task_count) || 0;
            total += value;
            
            if (item.status === 'todo') todo = value;
            else if (item.status === 'inprogress') inProgress = value;
            else if (item.status === 'done') done = value;
            
            return {
              name: item.status === 'inprogress' ? 'In Progress' : 
                    item.status === 'todo' ? 'To Do' : 
                    item.status === 'done' ? 'Done' : item.status,
              value: value
            };
          });
          
          setTaskCounts({
            total,
            todo,
            inProgress,
            done
          });
          setPieChartData(chartData);
        }
        */
        
        // Simulate API delay
        setTimeout(() => {
          setTaskCounts(DUMMY_TASK_COUNTS);
          setPieChartData(DUMMY_PIE_CHART_DATA);
          setTaskLoading(false);
        }, 1000);
        
      } catch (error) {
        console.error('Error fetching task data:', error);
        // Use dummy data as fallback
        setTaskCounts(DUMMY_TASK_COUNTS);
        setPieChartData(DUMMY_PIE_CHART_DATA);
        setTaskLoading(false);
      }
    };
    
    fetchTaskData();
  }, []);
  
  // Fetch heatmap data
  useEffect(() => {
    const fetchHeatmapData = async () => {
      try {
        setHeatmapLoading(true);
        
        // Uncomment below to use real data from Supabase
        // -------------------------------------------------
        /*
        const supabase = createClient();
        
        // Get user ID
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('User not found');
        
        // Get heatmap data from view
        const { data, error } = await supabase
          .from('vw_heatmap_data')
          .select('*')
          .eq('user_id', user.id)
          .order('week_number', { ascending: true });
        
        if (error) throw error;
        
        if (data && Array.isArray(data)) {
          // Transform data to the format needed by Heatmap component
          const formattedData: WeekData[] = data.map(week => ({
            bins: week.bins.map((bin: any) => ({
              count: bin.count,
              day: bin.day
            }))
          }));
          
          setWeekData(formattedData);
        }
        */
        
        // Simulate API delay
        setTimeout(() => {
          setWeekData(generateDummyHeatmapData());
          setHeatmapLoading(false);
        }, 1000);
        
      } catch (error) {
        console.error('Error fetching heatmap data:', error);
        // Already using dummy data
        setHeatmapLoading(false);
      }
    };
    
    fetchHeatmapData();
  }, []);

  useEffect(() => {
    // Set initial dimensions
    setDimensions({
      width: window.innerWidth,
      height: window.innerHeight
    });

    // Update dimensions on window resize
    const handleResize = () => {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showNotifications]);

  // Calculate appropriate sizes based on screen width
  const getPieChartWidth = () => {
    const width = dimensions.width;
    if (width < 400) return width - 40; // Small mobile
    if (width < 640) return 320; // Mobile
    if (width < 768) return 350; // Small tablet
    if (width < 1024) return 400; // Tablet/small laptop
    return 400; // Desktop
  };

  const getHeatmapWidth = () => {
    const width = dimensions.width;
    if (width < 640) return 500; // Mobile scrollable
    if (width < 768) return 600; // Small tablet
    if (width < 1024) return 700; // Tablet
    if (width < 1280) return 800; // Small desktop
    return 900; // Large desktop
  };

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
              count={3} 
              onClick={() => setShowNotifications(!showNotifications)} 
            />
            <NotificationPanel 
              isOpen={showNotifications} 
              onClose={() => setShowNotifications(false)} 
            />
          </div>
          <p className="text-gray-600 dark:text-gray-400 text-base sm:text-lg max-w-[90vw] md:max-w-none">
            Welcome back, <span className="font-semibold">
              Quadeer, Hope you bought yourself a cup of coffee</span>
          </p>
        </div>
        
        <div className="flex items-center space-x-4 w-full md:w-auto justify-end">
          <div className="bg-white/70 backdrop-blur-lg dark:bg-gray-800 px-3 sm:px-4 py-2 rounded-md shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] border-2 border-black dark:border-white">
            <span className="font-bold text-sm sm:text-base">quadeer2003</span>
          </div>
          <div className="h-16 w-16 sm:h-16 sm:w-16 rounded-md bg-black dark:bg-white shadow-[4px_4px_0px_0px_rgba(128,128,128,1)] overflow-hidden border-2 border-black dark:border-white flex-shrink-0">
            <div className="bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 w-full h-full">
              <img src="/dance.gif" alt="Quadeer" width={60} height={60} className="w-full h-full object-cover" />
            </div>
          </div>
        </div>
      </div>
      <JeemBackground opacity={0.7} blurAmount={120} speed={35} />

      {/* Task Summary Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6 md:mb-8">
        {/* Total Tasks */}
        <Card className="border-2 border-black dark:border-gray-800 bg-white/70 backdrop-blur-lg dark:bg-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all overflow-hidden">
          <div className="absolute -right-6 -top-6 w-16 h-16 bg-red-400 dark:bg-red-500 rounded-full opacity-40"></div>
          <CardContent className="p-4 sm:p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs sm:text-sm font-mono uppercase text-gray-500 dark:text-gray-400 tracking-wider">Total Tasks</p>
                <h3 className="text-2xl sm:text-3xl md:text-4xl font-black mt-1">{taskCounts.total}</h3>
                <div className="flex items-center mt-2 text-xs bg-green-100/90 dark:bg-green-900 text-green-700 dark:text-green-300 px-2 py-1 rounded font-medium">
                  <span className="mr-1">↑</span> 8% from yesterday
                </div>
              </div>
              <div className="bg-red-100/90 dark:bg-red-900/30 p-2 sm:p-3 rounded-md border-2 border-black dark:border-red-700">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 sm:h-6 sm:w-6 text-red-500 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Todo */}
        <Card className="border-2 border-black dark:border-gray-800 bg-white/70 backdrop-blur-lg dark:bg-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all overflow-hidden">
          <div className="absolute -right-6 -top-6 w-16 h-16 bg-yellow-400 dark:bg-yellow-500 rounded-full opacity-40"></div>
          <CardContent className="p-4 sm:p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs sm:text-sm font-mono uppercase text-gray-500 dark:text-gray-400 tracking-wider">Todo</p>
                <h3 className="text-2xl sm:text-3xl md:text-4xl font-black mt-1">{taskCounts.todo}</h3>
                <div className="flex items-center mt-2 text-xs bg-green-100/90 dark:bg-green-900 text-green-700 dark:text-green-300 px-2 py-1 rounded font-medium">
                  <span className="mr-1">↑</span> 5% from yesterday
                </div>
              </div>
              <div className="bg-yellow-100/90 dark:bg-yellow-900/30 p-2 sm:p-3 rounded-md border-2 border-black dark:border-yellow-700">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 sm:h-6 sm:w-6 text-yellow-500 dark:text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* In Progress */}
        <Card className="border-2 border-black dark:border-gray-800 bg-white/70 backdrop-blur-lg dark:bg-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all overflow-hidden">
          <div className="absolute -right-6 -top-6 w-16 h-16 bg-green-400 dark:bg-green-500 rounded-full opacity-40"></div>
          <CardContent className="p-4 sm:p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs sm:text-sm font-mono uppercase text-gray-500 dark:text-gray-400 tracking-wider">In Progress</p>
                <h3 className="text-2xl sm:text-3xl md:text-4xl font-black mt-1">{taskCounts.inProgress}</h3>
                <div className="flex items-center mt-2 text-xs bg-green-100/90 dark:bg-green-900 text-green-700 dark:text-green-300 px-2 py-1 rounded font-medium">
                  <span className="mr-1">↑</span> 12% from yesterday
                </div>
              </div>
              <div className="bg-green-100/90 dark:bg-green-900/30 p-2 sm:p-3 rounded-md border-2 border-black dark:border-green-700">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 sm:h-6 sm:w-6 text-green-500 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Done */}
        <Card className="border-2 border-black dark:border-gray-800 bg-white/70 backdrop-blur-lg dark:bg-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all overflow-hidden">
          <div className="absolute -right-6 -top-6 w-16 h-16 bg-purple-400 dark:bg-purple-500 rounded-full opacity-40"></div>
          <CardContent className="p-4 sm:p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs sm:text-sm font-mono uppercase text-gray-500 dark:text-gray-400 tracking-wider">Done</p>
                <h3 className="text-2xl sm:text-3xl md:text-4xl font-black mt-1">{taskCounts.done}</h3>
                <div className="flex items-center mt-2 text-xs bg-orange-100/90 dark:bg-orange-900 text-orange-700 dark:text-orange-300 px-2 py-1 rounded font-medium">
                  <span className="mr-1">↑</span> 0.5% from yesterday
                </div>
              </div>
              <div className="bg-purple-100/90 dark:bg-purple-900/30 p-2 sm:p-3 rounded-md border-2 border-black dark:border-purple-700">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 sm:h-6 sm:w-6 text-purple-500 dark:text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Middle Row - Progress Graph and Pie Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8 mb-6 md:mb-8">
        <Card className="border-2 border-black dark:border-gray-800 bg-white/70 backdrop-blur-lg dark:bg-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all overflow-hidden">
          <CardHeader className="border-b-2 border-black dark:border-gray-800 bg-gradient-to-r from-blue-50/90 to-blue-100/90 dark:from-blue-900/20 dark:to-indigo-900/20 p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0">
              <CardTitle className="font-black text-base sm:text-lg">PROGRESS GRAPH</CardTitle>
              <div className="flex flex-wrap gap-2">
                <span className="bg-blue-200/90 dark:bg-blue-800 text-blue-800 dark:text-blue-200 border border-black dark:border-blue-600 px-2 py-1 text-xs rounded font-bold">Weekly</span>
                <span className="bg-white/90 dark:bg-gray-800 border border-black dark:border-gray-700 px-2 py-1 text-xs rounded font-bold">Monthly</span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            <div className="h-64 sm:h-[300px] flex items-center justify-center bg-gradient-to-r from-gray-50/90 to-gray-100/90 dark:from-gray-900/20 dark:to-gray-800/20 rounded-md border-2 border-dashed border-black dark:border-gray-700">
              {/* This is a placeholder for the Progress Graph component */}
              <p className="text-gray-500 dark:text-gray-400 font-mono text-sm">Progress Graph Component Placeholder</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-black dark:border-gray-800 bg-white/70 backdrop-blur-lg dark:bg-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all overflow-hidden">
          <CardHeader className="border-b-2 border-black dark:border-gray-800 bg-gradient-to-r from-purple-50/90 to-indigo-100/90 dark:from-purple-900/20 dark:to-indigo-900/20 p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0">
              <CardTitle className="font-black text-base sm:text-lg">TASKS OVERVIEW</CardTitle>
              <div className="px-2 py-1 bg-white/90 dark:bg-gray-800 rounded border-2 border-black dark:border-gray-700 text-xs font-bold">
                Last updated: Today
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-3">
            <div className="h-64 sm:h-[300px] flex items-center justify-center">
              {dimensions.width > 0 && !taskLoading && (
                <PieChart 
                  width={getPieChartWidth()} 
                  height={Math.min(getPieChartWidth() * 0.8, 270)} 
                  data={pieChartData}
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
            <CardTitle className="font-black text-base sm:text-lg">MONTHLY ACTIVITY HEATMAP</CardTitle>
            <div className="flex flex-wrap gap-2">
              <span className="bg-green-200/90 dark:bg-green-800 text-green-800 dark:text-green-200 border border-black dark:border-green-600 px-2 py-1 text-xs rounded font-bold">Projects: All</span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-3 overflow-x-auto">
          <div className="h-64 sm:h-[280px] flex items-center justify-center min-w-[500px]">
            {dimensions.width > 0 && !heatmapLoading && (
              <Heatmap 
                width={getHeatmapWidth()} 
                height={240} 
                weekData={weekData}
              />
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
