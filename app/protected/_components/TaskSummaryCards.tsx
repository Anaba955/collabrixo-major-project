"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { createClient } from "@/utils/supabase/client";
import { RealtimeChannel } from '@supabase/supabase-js';

interface TaskCounts {
  total: number;
  todo: number;
  inProgress: number;
  done: number;
}

interface TaskPercentages {
  total: number;
  todo: number;
  inProgress: number;
  done: number;
}

export default function TaskSummaryCards({ initialTaskCounts = null }: { initialTaskCounts?: TaskCounts | null }) {
  const [taskCounts, setTaskCounts] = useState<TaskCounts>({
    total: 0,
    todo: 0,
    inProgress: 0,
    done: 0
  });
  
  const [percentages, setPercentages] = useState<TaskPercentages>({
    total: 0,
    todo: 0,
    inProgress: 0,
    done: 0
  });
  
  const [isLoading, setIsLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [differences, setDifferences] = useState<{ total: number; todo: number; inProgress: number; done: number }>({
    total: 0,
    todo: 0,
    inProgress: 0,
    done: 0
  });

  // Function to calculate task counts and percentages
  const calculateTaskMetrics = useCallback(async (userId: string) => {
    if (!userId) return;
    
    try {
      const supabase = createClient();
      
      // Get today's date (start of day)
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      // Get yesterday's date (start of day)
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      
      // Format dates for Supabase queries
      const todayStr = today.toISOString();
      const yesterdayStr = yesterday.toISOString();
      
      console.log('Today date:', todayStr);
      console.log('Yesterday date:', yesterdayStr);
      
      // Fetch current tasks (all tasks assigned to user)
      const { data: currentTasks, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('assigned_to', userId);
      
      if (error) {
        console.error('Error fetching current tasks:', error);
        throw error;
      }
      
      // Fetch tasks created today
      const { data: tasksBeforeToday, error: tasksBeforeTodayError } = await supabase
        .from('tasks')
        .select('*')
        .eq('assigned_to', userId)
        .lt('created_at', todayStr);
      
      if (tasksBeforeTodayError) {
        console.error('Error fetching tasks before today:', tasksBeforeTodayError);
        throw tasksBeforeTodayError;
      }
      
      // Fetch tasks created yesterday
      const { data: tasksCreatedYesterday, error: tasksCreatedYesterdayError } = await supabase
        .from('tasks')
        .select('*')
        .eq('assigned_to', userId)
        .gte('created_at', yesterdayStr)
        .lt('created_at', todayStr);
      
      if (tasksCreatedYesterdayError) {
        console.error('Error fetching tasks created yesterday:', tasksCreatedYesterdayError);
        throw tasksCreatedYesterdayError;
      }
      
      // Fetch tasks created today
      const { data: tasksCreatedToday, error: tasksCreatedTodayError } = await supabase
        .from('tasks')
        .select('*')
        .eq('assigned_to', userId)
        .gte('created_at', todayStr);
      
      if (tasksCreatedTodayError) {
        console.error('Error fetching tasks created today:', tasksCreatedTodayError);
        throw tasksCreatedTodayError;
      }
      
      // Process data
      const currentTasksArray = currentTasks || [];
      const tasksBeforeTodayArray = tasksBeforeToday || [];
      const tasksCreatedTodayArray = tasksCreatedToday || [];
      const tasksCreatedYesterdayArray = tasksCreatedYesterday || [];
      
      console.log('Total tasks:', currentTasksArray.length);
      console.log('Tasks before today:', tasksBeforeTodayArray.length);
      console.log('Tasks created today:', tasksCreatedTodayArray.length);
      console.log('Tasks created yesterday:', tasksCreatedYesterdayArray.length);
      
      // Calculate the state as of end of yesterday (all tasks except those created today)
      const yesterdayTasksArray = tasksBeforeTodayArray;
      
      // Count current tasks by status
      const currentCounts = {
        total: currentTasksArray.length,
        todo: currentTasksArray.filter(task => task.status === 'todo').length,
        inProgress: currentTasksArray.filter(task => task.status === 'inProgress').length,
        done: currentTasksArray.filter(task => task.status === 'done').length
      };
      
      // Count yesterday's tasks by status
      const yesterdayCounts = {
        total: yesterdayTasksArray.length,
        todo: yesterdayTasksArray.filter(task => task.status === 'todo').length,
        inProgress: yesterdayTasksArray.filter(task => task.status === 'inProgress').length,
        done: yesterdayTasksArray.filter(task => task.status === 'done').length
      };
      
      // Calculate differences
      const differences = {
        total: currentCounts.total - yesterdayCounts.total,
        todo: currentCounts.todo - yesterdayCounts.todo,
        inProgress: currentCounts.inProgress - yesterdayCounts.inProgress,
        done: currentCounts.done - yesterdayCounts.done
      };
      
      // Calculate percentage changes
      const calculatePercentage = (current: number, previous: number) => {
        if (previous === 0) {
          return current * 100; // 100% per item (1 item = 100%, 2 items = 200%, etc.)
        }
        return Math.round(((current - previous) / previous) * 100);
      };
      
      const percentageChanges = {
        total: calculatePercentage(currentCounts.total, yesterdayCounts.total),
        todo: calculatePercentage(currentCounts.todo, yesterdayCounts.todo),
        inProgress: calculatePercentage(currentCounts.inProgress, yesterdayCounts.inProgress),
        done: calculatePercentage(currentCounts.done, yesterdayCounts.done)
      };
      
      // Detailed logging
      console.log('Current counts:', currentCounts);
      console.log('Yesterday counts:', yesterdayCounts);
      console.log('Differences:', differences);
      console.log('Percentages:', percentageChanges);
      
      setTaskCounts(currentCounts);
      setPercentages(percentageChanges);
      setDifferences(differences);
      setIsLoading(false);
    } catch (error) {
      console.error('Error calculating task metrics:', error);
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (initialTaskCounts) {
      setTaskCounts(initialTaskCounts);
      setIsLoading(false);
      return;
    }
    
    let realtimeChannel: RealtimeChannel;
    
    const setupRealtimeAndFetchInitial = async () => {
      try {
        const supabase = createClient();
        
        // Get the current user
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          console.error("User not authenticated");
          setIsLoading(false);
          return;
        }
        
        setUserId(user.id);
        
        // Initial calculation
        await calculateTaskMetrics(user.id);
        
        // Set up realtime subscription
        realtimeChannel = supabase
          .channel('tasks-changes')
          .on('postgres_changes', 
            { 
              event: 'INSERT', 
              schema: 'public', 
              table: 'tasks',
              filter: `assigned_to=eq.${user.id}`
            }, 
            (payload) => {
              console.log('Task inserted:', payload);
              calculateTaskMetrics(user.id);
            }
          )
          .on('postgres_changes',
            {
              event: 'UPDATE',
              schema: 'public',
              table: 'tasks'
            },
            (payload) => {
              console.log('Task updated:', payload);
              calculateTaskMetrics(user.id);
            }
          )
          .on('postgres_changes',
            {
              event: 'DELETE',
              schema: 'public',
              table: 'tasks'
            },
            (payload) => {
              console.log('Task deleted:', payload);
              calculateTaskMetrics(user.id);
            }
          )
          .subscribe((status) => {
            console.log('Realtime subscription status:', status);
          });
        
      } catch (error) {
        console.error('Error setting up realtime:', error);
        setIsLoading(false);
      }
    };
    
    setupRealtimeAndFetchInitial();
    
    // Cleanup function
    return () => {
      const supabase = createClient();
      if (realtimeChannel) {
        supabase.removeChannel(realtimeChannel);
      }
    };
  }, [initialTaskCounts, calculateTaskMetrics]);
  
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6 md:mb-8">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="border-2 border-black dark:border-gray-800 bg-white/70 backdrop-blur-lg dark:bg-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all overflow-hidden h-32">
            <div className="h-full flex items-center justify-center">
              <div className="animate-spin w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full"></div>
            </div>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6 md:mb-8">
      {/* Total Tasks */}
      <Card className="border-2 border-black dark:border-gray-800 bg-white/70 backdrop-blur-lg dark:bg-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all overflow-hidden">
        <div className="absolute -right-6 -top-6 w-16 h-16 bg-red-400 dark:bg-red-500 rounded-full opacity-40"></div>
        <CardContent className="p-4 sm:p-6">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs sm:text-sm font-mono uppercase text-gray-500 dark:text-gray-400 tracking-wider">Total Tasks</p>
              <h3 className="text-2xl sm:text-3xl md:text-4xl font-black mt-1">{taskCounts.total}</h3>
              <div className={`flex items-center mt-2 text-xs px-2 py-1 rounded font-medium ${
                differences.total > 0 
                  ? 'bg-green-100/90 dark:bg-green-900 text-green-700 dark:text-green-300' 
                  : differences.total < 0 
                    ? 'bg-red-100/90 dark:bg-red-900 text-red-700 dark:text-red-300'
                    : 'bg-gray-100/90 dark:bg-gray-900 text-gray-700 dark:text-gray-300'
              }`}>
                <span className="mr-1">{differences.total > 0 ? '↑' : differences.total < 0 ? '↓' : '•'}</span> 
                {differences.total > 0 ? '+' : ''}{differences.total} ({Math.abs(percentages.total)}%) today's increment
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
              <div className={`flex items-center mt-2 text-xs px-2 py-1 rounded font-medium ${
                differences.todo > 0 
                  ? 'bg-green-100/90 dark:bg-green-900 text-green-700 dark:text-green-300' 
                  : differences.todo < 0 
                    ? 'bg-red-100/90 dark:bg-red-900 text-red-700 dark:text-red-300'
                    : 'bg-gray-100/90 dark:bg-gray-900 text-gray-700 dark:text-gray-300'
              }`}>
                <span className="mr-1">{differences.todo > 0 ? '↑' : differences.todo < 0 ? '↓' : '•'}</span> 
                {differences.todo > 0 ? '+' : ''}{differences.todo} ({Math.abs(percentages.todo)}%) today's increment
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
              <div className={`flex items-center mt-2 text-xs px-2 py-1 rounded font-medium ${
                differences.inProgress > 0 
                  ? 'bg-green-100/90 dark:bg-green-900 text-green-700 dark:text-green-300' 
                  : differences.inProgress < 0 
                    ? 'bg-red-100/90 dark:bg-red-900 text-red-700 dark:text-red-300'
                    : 'bg-gray-100/90 dark:bg-gray-900 text-gray-700 dark:text-gray-300'
              }`}>
                <span className="mr-1">{differences.inProgress > 0 ? '↑' : differences.inProgress < 0 ? '↓' : '•'}</span> 
                {differences.inProgress > 0 ? '+' : ''}{differences.inProgress} ({Math.abs(percentages.inProgress)}%) today's increment
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
              <div className={`flex items-center mt-2 text-xs px-2 py-1 rounded font-medium ${
                differences.done > 0 
                  ? 'bg-green-100/90 dark:bg-green-900 text-green-700 dark:text-green-300' 
                  : differences.done < 0 
                    ? 'bg-red-100/90 dark:bg-red-900 text-red-700 dark:text-red-300'
                    : 'bg-gray-100/90 dark:bg-gray-900 text-gray-700 dark:text-gray-300'
              }`}>
                <span className="mr-1">{differences.done > 0 ? '↑' : differences.done < 0 ? '↓' : '•'}</span> 
                {differences.done > 0 ? '+' : ''}{differences.done} ({Math.abs(percentages.done)}%) today's increment
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
  );
} 