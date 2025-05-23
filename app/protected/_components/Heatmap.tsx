"use client";
import React from 'react';
import { Group } from '@visx/group';
import { scaleLinear } from '@visx/scale';

// Define the bin type
export interface HeatmapBin {
  count: number;
  day: string;
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
  weekData: WeekData[];
  events?: boolean;
  margin?: { top: number; right: number; bottom: number; left: number };
}

function Heatmap({
  width,
  height,
  weekData,
  events = false,
  margin = { top: 40, left: 40, right: 20, bottom: 30 },
}: HeatmapProps) {
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
  
  // If no data or invalid width, return empty SVG
  if (width < 10 || !weekData || weekData.length === 0) {
    return <svg width={width} height={height}></svg>;
  }
  
  // Manual rendering approach
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
        {weekData.map((weekData, weekIndex) => (
          <React.Fragment key={`week-${weekIndex}`}>
            {weekData.bins.map((bin, dayIndex) => {
              const cellColor = rectColorScale(bin.count);
              const cellOpacity = opacityScale(bin.count);
              
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
                  stroke="#000"
                  strokeOpacity={0.2}
                  strokeWidth={1}
                  onClick={() => {
                    if (!events) return;
                    alert(JSON.stringify({ 
                      week: weekIndex + 1, 
                      day: dayLabels[dayIndex],
                      activity: bin.count
                    }));
                  }}
                />
              );
            })}
          </React.Fragment>
        ))}
      </Group>
    </svg>
  );
}

export default Heatmap; 