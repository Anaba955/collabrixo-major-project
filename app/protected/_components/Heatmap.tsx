"use client";
import React, { useState, useEffect, useCallback } from 'react';
import { Group } from '@visx/group';
import { scaleLinear } from '@visx/scale';
import { createClient } from "@/utils/supabase/client";
import { RealtimeChannel } from '@supabase/supabase-js';

// Define the bin type
export interface HeatmapBin {
  count: number;
  day: string;
  date: Date;
}

// Define the week data type
export interface WeekData {
  bins: HeatmapBin[];
}

const cool1 = '#064e3b'; 
const cool2 = '#10b981'; 
export const background = '#28272c';

interface HeatmapProps {
  width: number;
  height: number;
  initialData?: WeekData[];
  events?: boolean;
  margin?: { top: number; right: number; bottom: number; left: number };
}

interface TooltipData {
  x: number;
  y: number;
  content: string;
  visible: boolean;
}

function Heatmap({
  width,
  height,
  initialData,
  events = false,
  margin = { top: 40, left: 70, right: 20, bottom: 30 },
}: HeatmapProps) {
  const [weekData, setWeekData] = useState<WeekData[]>(initialData || []);
  const [isLoading, setIsLoading] = useState(!initialData);
  const [userId, setUserId] = useState<string | null>(null);
  const [tooltip, setTooltip] = useState<TooltipData>({
    x: 0,
    y: 0,
    content: '',
    visible: false
  });

  // Function to create empty calendar grid with actual dates
  const createEmptyCalendarGrid = () => {
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const today = new Date();
    
    // Calculate first day to show (35 days ago from today)
    const firstDay = new Date(today);
    firstDay.setDate(today.getDate() - 34); // 35 days total (0-34)
    
    // Start with the correct day of week
    const startDayOfWeek = firstDay.getDay(); // 0=Sunday, 1=Monday, etc.
    
    // Create 5 weeks of empty data
    const weeks: WeekData[] = [];
    
    for (let week = 0; week < 5; week++) {
      const bins: HeatmapBin[] = [];
      
      for (let day = 0; day < 7; day++) {
        // Calculate the date for this cell
        const currentDate = new Date(firstDay);
        currentDate.setDate(firstDay.getDate() + (week * 7) + day);
        
        bins.push({
          day: dayNames[currentDate.getDay()],
          count: 0,
          date: new Date(currentDate)
        });
      }
      
      weeks.push({ bins });
    }
    
    return weeks;
  };

  // Function to fetch and format heatmap data
  const fetchHeatmapData = useCallback(async (userId: string) => {
    if (!userId) return;
    
    try {
      const supabase = createClient();
      
      const { data: allTasks, error } = await supabase
        .from('tasks')
        .select('updated_at, status')
        .eq('assigned_to', userId);
      
      if (error) {
        console.error('Error fetching tasks for heatmap:', error);
        throw error;
      }
      
      // Make sure we have an array even if no data was returned
      const tasks = allTasks || [];
      
      // Create empty calendar grid with today as the last cell
      const calendarGrid = createEmptyCalendarGrid();
      
      tasks.forEach(task => {
        const activityDate = new Date(task.updated_at);
        
        // Find matching cell in our grid
        for (let weekIndex = 0; weekIndex < calendarGrid.length; weekIndex++) {
          for (let dayIndex = 0; dayIndex < calendarGrid[weekIndex].bins.length; dayIndex++) {
            const cellDate = calendarGrid[weekIndex].bins[dayIndex].date;
            
            // Check if dates match (ignoring time)
            if (activityDate.getFullYear() === cellDate.getFullYear() &&
                activityDate.getMonth() === cellDate.getMonth() &&
                activityDate.getDate() === cellDate.getDate()) {
              
              // Increment count for matching date
              calendarGrid[weekIndex].bins[dayIndex].count += 1;
              break;
            }
          }
        }
      });
      
      console.log('Heatmap activity data updated:', calendarGrid);
      setWeekData(calendarGrid);
      setIsLoading(false);
      
    } catch (error) {
      console.error('Error calculating heatmap data:', error);
      // If there's an error, use empty calendar grid
      setWeekData(createEmptyCalendarGrid());
      setIsLoading(false);
    }
  }, []);
  
  useEffect(() => {
    if (initialData) {
      setWeekData(initialData);
      setIsLoading(false);
      return;
    }
    
    // this is the realtime channel for the heatmap, hope this works :)
    let realtimeChannel: RealtimeChannel;
    
    const setupRealtimeAndFetchInitial = async () => {
      try {
        const supabase = createClient();
        
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          console.error("User not authenticated");
          setIsLoading(false);
          return;
        }
        
        setUserId(user.id);
        
        await fetchHeatmapData(user.id);
        
        // again the * was not working :(, so I did it this way
        realtimeChannel = supabase
          .channel('heatmap-tasks-changes')
          .on('postgres_changes', 
            { 
              event: 'INSERT', 
              schema: 'public', 
              table: 'tasks',
              filter: `assigned_to=eq.${user.id}`
            }, 
            (payload) => {
              console.log('Task inserted (heatmap):', payload);
              fetchHeatmapData(user.id);
            }
          )
          .on('postgres_changes',
            {
              event: 'UPDATE',
              schema: 'public',
              table: 'tasks'
            },
            (payload) => {
              console.log('Task updated (heatmap):', payload);
              fetchHeatmapData(user.id);
            }
          )
          .on('postgres_changes',
            {
              event: 'DELETE',
              schema: 'public',
              table: 'tasks'
            },
            (payload) => {
              console.log('Task deleted (heatmap):', payload);
              fetchHeatmapData(user.id);
            }
          )
          .subscribe((status) => {
            console.log('Heatmap realtime subscription status:', status);
          });
        
      } catch (error) {
        console.error('Error setting up heatmap realtime:', error);
        setIsLoading(false);
      }
    };
    
    setupRealtimeAndFetchInitial();
    
    return () => {
      const supabase = createClient();
      if (realtimeChannel) {
        supabase.removeChannel(realtimeChannel);
      }
    };
  }, [fetchHeatmapData]);
  
  const colorMax = 9;
  
  const xMax = width - margin.left - margin.right;
  const yMax = height - margin.top - margin.bottom;
  
  // Ensure consistent cell sizes
  const binWidth = xMax / 7;   // 7 columns
  const binHeight = yMax / 5;  // 5 rows
  
  // scales - ensure we have exact 7 columns and 5 rows
  const xScale = scaleLinear<number>({
    domain: [0, 7],
    range: [0, xMax]
  });
  
  const yScale = scaleLinear<number>({
    domain: [0, 5],
    range: [0, yMax]
  });
  
  const rectColorScale = scaleLinear<string>({
    range: [cool1, cool2],
    domain: [0, colorMax],
  });
  
  const opacityScale = scaleLinear<number>({
    range: [0.4, 1], 
    domain: [0, colorMax],
  });
  
  const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  
  // Format date to display in tooltip
  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };
  
  // If invalid width, return empty SVG
  if (width < 10) {
    return <svg width={width} height={height}></svg>;
  }
  
  // If loading, show loading spinner
  if (isLoading) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="animate-spin w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }
  
  // If no data, show placeholder
  if (!weekData || weekData.length === 0) {
    return (
      <svg width={width} height={height}>
        <rect x={0} y={0} width={width} height={height} rx={14} fill={background} />
        <text
          x={width / 2}
          y={height / 2}
          fontSize={14}
          fill="#fff"
          textAnchor="middle"
        >
          No activity data available
        </text>
      </svg>
    );
  }
  
  // Function to handle hover events
  const handleMouseOver = (weekIndex: number, dayIndex: number, count: number, date: Date) => {
    const formattedDate = formatDate(date);
    const tooltipContent = `${formattedDate}: ${count} task${count !== 1 ? 's' : ''}`;
    
    // Get position in the SVG
    const x = margin.left + (dayIndex * binWidth) + (binWidth / 2);
    const y = margin.top + (weekIndex * binHeight) - 10;
    
    setTooltip({
      x,
      y,
      content: tooltipContent,
      visible: true
    });
  };
  
  const handleMouseOut = () => {
    setTooltip(prev => ({ ...prev, visible: false }));
  };
  
  // Generate labels for each week
  const generateWeekLabels = () => {
    if (!weekData || weekData.length === 0 || !weekData[0].bins || weekData[0].bins.length === 0) {
      return ["Week 1", "Week 2", "Week 3", "Week 4", "Week 5"];
    }
    
    return weekData.map((week, i) => {
      if (week.bins && week.bins.length > 0 && week.bins[0].date) {
        const firstDate = week.bins[0].date;
        const month = firstDate.toLocaleDateString('en-US', { month: 'short' });
        const day = firstDate.getDate();
        return `${month} ${day}`;
      }
      return `Week ${i+1}`;
    });
  };
  
  const weekLabels = generateWeekLabels();
  
  // Determine which cell represents today
  const findTodayCell = (): { week: number, day: number } | null => {
    const today = new Date();
    
    for (let weekIndex = 0; weekIndex < weekData.length; weekIndex++) {
      for (let dayIndex = 0; dayIndex < weekData[weekIndex].bins.length; dayIndex++) {
        const cellDate = weekData[weekIndex].bins[dayIndex].date;
        
        if (cellDate.getFullYear() === today.getFullYear() &&
            cellDate.getMonth() === today.getMonth() &&
            cellDate.getDate() === today.getDate()) {
          return { week: weekIndex, day: dayIndex };
        }
      }
    }
    
    return null;
  };
  
  const todayCell = findTodayCell();
  
  // Manual rendering approach
  return (
    <div className="relative">
      <svg width={width} height={height}>
        <rect x={0} y={0} width={width} height={height} rx={14} fill={background} />
        
        {/* Day labels (columns) */}
        <Group top={10} left={margin.left}>
          {dayLabels.map((day, i) => (
            <text
              key={day}
              x={i * binWidth + binWidth / 2}
              y={20}
              fontSize={12}
              fill="#fff"
              textAnchor="middle"
              fontWeight={i >= 5 ? "bold" : "normal"} 
            >
              {day}
            </text>
          ))}
        </Group>
        
        <Group top={margin.top} left={margin.left - 35}>
          {weekLabels.map((week, i) => (
            <text
              key={week}
              x={0}
              y={i * binHeight + binHeight / 2}
              fontSize={10}
              fill="#fff"
              textAnchor="start"
            >
              {week}
            </text>
          ))}
        </Group>
        <Group top={margin.top} left={margin.left}>
          {weekData.map((weekData, weekIndex) => (
            <React.Fragment key={`week-${weekIndex}`}>
              {weekData.bins.map((bin, dayIndex) => {
                const cellColor = rectColorScale(bin.count);
                const cellOpacity = opacityScale(bin.count);
                
                // Check if this is today's cell
                const isToday = todayCell && todayCell.week === weekIndex && todayCell.day === dayIndex;
                const borderColor = isToday ? "#ffffff" : "#000000";
                const borderWidth = isToday ? 2 : 1;
                
                return (
                  <rect
                    key={`cell-${weekIndex}-${dayIndex}`}
                    x={dayIndex * binWidth}
                    y={weekIndex * binHeight}
                    width={binWidth - 2}
                    height={binHeight - 2}
                    fill={cellColor}
                    fillOpacity={cellOpacity}
                    rx={4}
                    stroke={borderColor}
                    strokeOpacity={isToday ? 0.8 : 0.2}
                    strokeWidth={borderWidth}
                    onMouseOver={() => handleMouseOver(weekIndex, dayIndex, bin.count, bin.date)}
                    onMouseOut={handleMouseOut}
                    onClick={() => {
                      if (!events) return;
                      alert(JSON.stringify({ 
                        week: weekIndex + 1, 
                        day: bin.day,
                        date: formatDate(bin.date),
                        activity: bin.count
                      }));
                    }}
                    style={{ cursor: 'pointer' }}
                  />
                );
              })}
            </React.Fragment>
          ))}
        </Group>
        
        {/* Tooltip */}
        {tooltip.visible && (
          <g>
            <rect
              x={tooltip.x - 60}
              y={tooltip.y - 30}
              width={120}
              height={30}
              rx={4}
              fill="rgba(0, 0, 0, 0.8)"
              stroke="#fff"
              strokeWidth={1}
            />
            <text
              x={tooltip.x}
              y={tooltip.y - 10}
              fontSize={12}
              fill="#fff"
              textAnchor="middle"
              dominantBaseline="middle"
            >
              {tooltip.content}
            </text>
          </g>
        )}
      </svg>
    </div>
  );
}

export default Heatmap; 