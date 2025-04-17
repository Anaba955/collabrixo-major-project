"use client";
import React, { useEffect, useState } from 'react';
import { Group } from '@visx/group';
import { scaleLinear } from '@visx/scale';
import { createClient } from "@/utils/supabase/client";

const cool1 = '#064e3b'; 
const cool2 = '#10b981'; 
export const background = '#28272c';

interface BinData {
  count: number;
  day: string;
}

interface WeekData {
  week_number: number;
  bins: BinData[];
}

interface HeatmapProps {
  width: number;
  height: number;
  userId: string;
  events?: boolean;
  margin?: { top: number; right: number; bottom: number; left: number };
}

// Component for loading state
const LoadingHeatmap = ({ width, height }: { width: number; height: number }) => {
  return (
    <svg width={width} height={height}>
      <rect x={0} y={0} width={width} height={height} rx={14} fill={background} />
      <text x={width/2} y={height/2} fill="#fff" textAnchor="middle">Loading activity data...</text>
    </svg>
  );
};

function Heatmap({
  width,
  height,
  userId,
  events = false,
  margin = { top: 40, left: 40, right: 20, bottom: 30 },
}: HeatmapProps) {
  const [data, setData] = useState<WeekData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchHeatmapData = async () => {
      try {
        setLoading(true);
        const supabase = createClient();
        
        // Get current month and year
        const now = new Date();
        const currentMonth = now.getMonth() + 1; // JavaScript months are 0-based
        const currentYear = now.getFullYear();
        
        // Fetch activity data from the heatmap view
        const { data, error } = await supabase
          .from('vw_heatmap_data')
          .select('*')
          .eq('user_id', userId)
          .eq('month', currentMonth)
          .eq('year', currentYear)
          .order('week_number');
          
        if (error) throw error;
        
        // Transform data for the heatmap component
        setData(data || []);
      } catch (err: any) {
        console.error('Error fetching heatmap data:', err);
        setError(err.message || 'Failed to load heatmap data');
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchHeatmapData();
    }
  }, [userId]);

  // If still loading, show loading state
  if (loading) {
    return <LoadingHeatmap width={width} height={height} />;
  }

  // If error, show error message
  if (error) {
    return (
      <svg width={width} height={height}>
        <rect x={0} y={0} width={width} height={height} rx={14} fill={background} />
        <text x={width/2} y={height/2} fill="#fff" textAnchor="middle">Error: {error}</text>
      </svg>
    );
  }

  // If no data, show empty state
  if (data.length === 0) {
    return (
      <svg width={width} height={height}>
        <rect x={0} y={0} width={width} height={height} rx={14} fill={background} />
        <text x={width/2} y={height/2} fill="#fff" textAnchor="middle">No activity data for this month</text>
      </svg>
    );
  }
  
  const bins = (d: WeekData) => d.bins;
  const count = (d: BinData) => d.count;
  
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
  
  // Manual rendering approach instead of using HeatmapRect component
  return (
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
      
      <Group top={margin.top} left={10}>
        {[1, 2, 3, 4, 5].map((week, i) => (
          <text
            key={week}
            x={15}
            y={i * binHeight + binHeight / 2}
            fontSize={10}
            fill="#fff"
            textAnchor="middle"
          >
            {week}
          </text>
        ))}
      </Group>
      <Group top={margin.top} left={margin.left}>
        {data.map((weekData, weekIndex) => {
          // Create a lookup for the bins by day
          const dayToBin = new Map();
          weekData.bins.forEach(bin => {
            const dayAbbr = bin.day.slice(0, 3); // Convert to 'Sun', 'Mon', etc.
            dayToBin.set(dayAbbr, bin);
          });
          
          return (
            <React.Fragment key={`week-${weekData.week_number}`}>
              {dayLabels.map((day, dayIndex) => {
                // Get bin for this day, or default to count 0
                const bin = dayToBin.get(day) || { count: 0, day };
                const cellColor = rectColorScale(bin.count);
                const cellOpacity = opacityScale(bin.count);
                
                return (
                  <rect
                    key={`cell-${weekData.week_number}-${day}`}
                    x={dayIndex * binWidth}
                    y={(weekData.week_number - 1) % 5 * binHeight} // Ensure we wrap at 5 weeks
                    width={binWidth - 2}
                    height={binHeight - 2}
                    fill={cellColor}
                    fillOpacity={cellOpacity}
                    rx={4}
                    stroke="#000"
                    strokeOpacity={0.2}
                    strokeWidth={1}
                    onClick={() => {
                      if (!events) return;
                      alert(JSON.stringify({ 
                        week: weekData.week_number, 
                        day: day,
                        activity: bin.count
                      }));
                    }}
                  />
                );
              })}
            </React.Fragment>
          );
        })}
      </Group>
    </svg>
  );
}

export default Heatmap; 