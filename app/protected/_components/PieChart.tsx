"use client";



import React, { useState, useEffect, useCallback } from 'react';
import Pie from '@visx/shape/lib/shapes/Pie';
import { scaleOrdinal } from '@visx/scale';
import { Group } from '@visx/group';
import { ChevronDown } from 'lucide-react';

import { createClient } from "@/utils/supabase/client";
import { RealtimeChannel } from '@supabase/supabase-js';


export interface PieChartItem {
  name: string;
  value: number;
}

interface PieArc {
  data: PieChartItem;
  startAngle: number;
  endAngle: number;
  index: number;
}

const defaultColors = [
  '#6b21a8', 
  '#818cf8', 
  '#38bdf8', 
  '#fb7185', 
  '#34d399', 
  '#fbbf24', 
];

const getValue = (d: PieChartItem) => d.value;

const defaultMargin = { top: 50, right: 20, bottom: 20, left: 20 };

export interface PieChartProps {
  width: number;
  height: number;

  initialData?: PieChartItem[];

  margin?: typeof defaultMargin;
  colors?: string[];
  innerRadius?: number; 
  outerRadius?: number; 
  cornerRadius?: number;
}

export default function PieChart({
  width,
  height,

  initialData,

  margin = defaultMargin,
  colors = defaultColors,
  innerRadius = 0, 
  outerRadius, 
  cornerRadius = 3,
}: PieChartProps) {
  const [viewMode, setViewMode] = useState<'normal' | 'advanced'>('normal');

  const [data, setData] = useState<PieChartItem[]>(initialData || []);
  const [isLoading, setIsLoading] = useState(!initialData);
  const [userId, setUserId] = useState<string | null>(null);
  
  // Function to fetch and calculate chart data
  const fetchChartData = useCallback(async (userId: string) => {
    if (!userId) return;
    
    try {
      const supabase = createClient();
      
      // Fetch all tasks assigned to current user
      const { data: allTasks, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('assigned_to', userId);
      
      if (error) {
        console.error('Error fetching tasks for pie chart:', error);
        throw error;
      }
      
      // Make sure we have an array even if no data was returned
      const tasks = allTasks || [];
      
      // Count tasks by status
      const todoCount = tasks.filter(task => task.status === 'todo').length;
      const inProgressCount = tasks.filter(task => task.status === 'inProgress').length;
      const doneCount = tasks.filter(task => task.status === 'done').length;
      
      // Format data for pie chart
      const chartData: PieChartItem[] = [
        { name: 'To Do', value: todoCount },
        { name: 'In Progress', value: inProgressCount },
        { name: 'Done', value: doneCount }
      ];
      
      console.log('Pie chart data updated:', chartData);
      setData(chartData);
      setIsLoading(false);
      
    } catch (error) {
      console.error('Error calculating pie chart data:', error);
      setIsLoading(false);
    }
  }, []);
  
  useEffect(() => {
    if (initialData) {
      setData(initialData);
      setIsLoading(false);
      return;
    }
    
    let realtimeChannel: RealtimeChannel | null = null;
    let isMounted = true;
    
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
        
        if (!isMounted) return;
        
        setUserId(user.id);
        
        // Initial data fetch
        await fetchChartData(user.id);
        
        if (!isMounted) return;
        
        // Set up realtime subscription with unique channel name
        const channelName = `pie-chart-tasks-changes-${user.id}-${Date.now()}`;
        realtimeChannel = supabase
          .channel(channelName)
          .on('postgres_changes', 
            { 
              event: 'INSERT', 
              schema: 'public', 
              table: 'tasks',
              filter: `assigned_to=eq.${user.id}`
            }, 
            (payload) => {
              if (isMounted) {
                console.log('Task inserted (pie chart):', payload);
                fetchChartData(user.id);
              }
            }
          )
          .on('postgres_changes',
            {
              event: 'UPDATE',
              schema: 'public',
              table: 'tasks'
            },
            (payload) => {
              if (isMounted) {
                console.log('Task updated (pie chart):', payload);
                fetchChartData(user.id);
              }
            }
          )
          .on('postgres_changes',
            {
              event: 'DELETE',
              schema: 'public',
              table: 'tasks'
            },
            (payload) => {
              if (isMounted) {
                console.log('Task deleted (pie chart):', payload);
                fetchChartData(user.id);
              }
            }
          )
          .subscribe((status) => {
            if (isMounted) {
              console.log('Pie chart realtime subscription status:', status);
            }
          });
        
      } catch (error) {
        console.error('Error setting up pie chart realtime:', error);
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };
    
    setupRealtimeAndFetchInitial();
    
    // Cleanup function
    return () => {
      isMounted = false;
      if (realtimeChannel) {
        const supabase = createClient();
        supabase.removeChannel(realtimeChannel).then(() => {
          console.log('PieChart channel cleaned up');
        }).catch((error) => {
          console.warn('Error cleaning up PieChart channel:', error);
        });
      }
    };
  }, [fetchChartData]);
  
  if (width < 10) return null;
  
  if (isLoading) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="animate-spin w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }
  
  // If we have no data or all zeros, show a message
  const hasData = data.some(item => item.value > 0);
  if (!hasData) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-center text-gray-500 dark:text-gray-400">
          <p className="text-lg font-bold">No tasks found</p>
          <p className="text-sm">Create tasks to see your distribution</p>
        </div>
      </div>
    );
  }

  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;
  const radius = Math.min(innerWidth, innerHeight) / 2;
  const centerY = innerHeight / 2;
  const centerX = innerWidth / 2;
  
  const pieOuterRadius = outerRadius || (viewMode === 'normal' ? radius * 0.5 : radius * 0.75); 
  
  const effectiveInnerRadius = viewMode === 'advanced' ? radius * 0.45 : innerRadius;
  
  const getItemColor = scaleOrdinal({
    domain: data.map(d => d.name),
    range: colors,
  });

  const total = data.reduce((sum, item) => sum + item.value, 0);

  const getPercentage = (value: number) => {
    return Math.round((value / total) * 100) + '%';
  };

  const getSortedData = (sortFn: (a: PieChartItem, b: PieChartItem) => number) => {
    return [...data].sort(sortFn);
  };
  
  const highestItem = getSortedData((a, b) => b.value - a.value)[0];
  const lowestItem = getSortedData((a, b) => a.value - b.value)[0];
  const averageValue = Math.round(total / data.length);

  // Adjust label positions for specific segments in advanced view
  const getLabelPosition = (name: string, angle: number, labelRadius: number) => {
    // Default positions using the angle
    let x = Math.cos(angle) * labelRadius;
    let y = Math.sin(angle) * labelRadius;
    
    // For "In Progress", force position to top (90 degrees)
    if (name === "In Progress" && viewMode === 'advanced') {
      // Position at the top (-90 degrees in radians is -Math.PI/2)
      x = 0;
      y = -labelRadius - 10; // Additional offset to move it higher
    }
    
    return { x, y };
  };

  return (
    <div className="relative">
      <div className="absolute top-0 left-0 z-10">
        <div className="relative inline-block">
          <select 
            value={viewMode}
            onChange={(e) => setViewMode(e.target.value as 'normal' | 'advanced')}
            className="appearance-none bg-white dark:bg-gray-800 border-3 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] rounded px-4 py-2 pr-8 cursor-pointer text-sm font-medium"
          >
            <option value="normal">Normal View</option>
            <option value="advanced">Advanced View</option>
          </select>
          <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
            <ChevronDown size={16} />
          </div>
        </div>
      </div>
      
      <svg width={width} height={height}>
        <rect rx={14} width={width} height={height} fill={"#28272c"} />
        
        {viewMode === 'advanced' && (
          <Group top={margin.top} left={margin.left + 10}>
            {data.map((item, i) => (
              <Group key={`legend-${i}`} top={i * 20}>
                <rect 
                  width={12} 
                  height={12} 
                  fill={getItemColor(item.name)}
                  rx={2}
                />
                <text
                  dx={16}
                  dy={10}
                  fontSize={10}
                  fill="white"
                >
                  {item.name} ({getPercentage(item.value)})
                </text>
              </Group>
            ))}
          </Group>
        )}
        
        <Group top={centerY + margin.top} left={centerX + margin.left}>
          <Pie
            data={data}
            pieValue={getValue}
            outerRadius={pieOuterRadius}
            innerRadius={effectiveInnerRadius}
            cornerRadius={cornerRadius}
            padAngle={viewMode === 'advanced' ? 0.02 : 0.005}
          >
            {(pie: any) => {
              return pie.arcs.map((arc: PieArc, i: number) => {
                const { name, value } = arc.data;
                const arcPath = pie.path(arc) || '';
                
                const [centroidX, centroidY] = pie.path.centroid(arc);
                let x = centroidX;
                let y = centroidY;
                let textAnchor: 'start' | 'middle' | 'end' = 'middle';
                
                if (viewMode === 'advanced') {
                  const angle = Math.atan2(centroidY, centroidX);
                  const labelRadius = pieOuterRadius + 20;
                  
                  const adjustedPos = getLabelPosition(name, angle, labelRadius);
                  x = adjustedPos.x;
                  y = adjustedPos.y;
                  
                  // Set text alignment - for In Progress, force center alignment
                  textAnchor = name === "In Progress" ? 'middle' : (x > 0 ? 'start' : 'end');
                }
                
                const arcAngle = arc.endAngle - arc.startAngle;
                const canFitLabel = arcAngle > 0.15;
                
                const displayPercentage = getPercentage(value);
                
                return (
                  <g key={`arc-${name}-${i}`}>
                    <path
                      d={arcPath}
                      fill={getItemColor(name)}
                      stroke={viewMode === 'advanced' ? "white" : "none"}
                      strokeWidth={viewMode === 'advanced' ? 1 : 0}
                    />
                    
                    {canFitLabel && (
                      <>
                        {viewMode === 'normal' ? (
                          <>
                            <text
                              fill="white"
                              x={x}
                              y={y - 3}
                              dy=".33em"
                              fontSize={11}
                              textAnchor={textAnchor}
                              pointerEvents="none"
                              fontWeight="bold"
                            >
                              {name}
                            </text>
                            <text
                              fill="white"
                              x={x}
                              y={y + 12}
                              dy=".33em"
                              fontSize={10}
                              textAnchor={textAnchor}
                              pointerEvents="none"
                              opacity={0.9}
                            >
                              {displayPercentage}
                            </text>
                          </>
                        ) : (
                          <>
                            <line
                              x1={centroidX}
                              y1={centroidY}
                              x2={name === "In Progress" ? 0 : x * 0.85}
                              y2={name === "In Progress" ? -pieOuterRadius - 2 : y * 0.85}
                              stroke="white"
                              strokeWidth={0.5}
                              strokeDasharray="2,2"
                            />
                            <text
                              fill="white"
                              x={x}
                              y={y}
                              dy=".33em"
                              fontSize={8}
                              textAnchor={textAnchor}
                              pointerEvents="none"
                            >
                              {name}: {displayPercentage}
                            </text>
                          </>
                        )}
                      </>
                    )}
                  </g>
                );
              });
            }}
          </Pie>
          
          {viewMode === 'advanced' && (
            <>
              <circle
                r={radius * 0.43}
                fill="#28272c"
                stroke="rgba(255,255,255,0.1)"
                strokeWidth={1}
              />
              <text
                textAnchor="middle"
                x={0}
                y={-15}
                fill="white"
                fontSize={12}
                fontWeight="bold"
              >
                Stats
              </text>
              <text
                textAnchor="middle"
                x={0}
                y={5}
                fill="white"
                fontSize={10}
              >
                Total: {total}
              </text>
              <text
                textAnchor="middle"
                x={0}
                y={20}
                fill="white"
                fontSize={10}
              >
                Highest: {highestItem?.name}
              </text>
              <text
                textAnchor="middle"
                x={0}
                y={35}
                fill="white"
                fontSize={10}
              >
                Avg: {averageValue}
              </text>
            </>
          )}
        </Group>
      </svg>
    </div>
  );
}