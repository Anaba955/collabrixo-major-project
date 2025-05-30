"use client";
import React, { useState, useMemo } from 'react';
import { BarStack } from '@visx/shape';
import { Group } from '@visx/group';
import { Grid } from '@visx/grid';
import { AxisBottom, AxisLeft } from '@visx/axis';
import { scaleBand, scaleLinear, scaleOrdinal } from '@visx/scale';
import { useTooltip, useTooltipInPortal, defaultStyles } from '@visx/tooltip';
import { LegendOrdinal } from '@visx/legend';
import { localPoint } from '@visx/event';
import { LinePath } from '@visx/shape';
import { curveMonotoneX } from '@visx/curve';

export interface TaskData {
  week: string;
  todo: number;
  inProgress: number;
  done: number;
  totalTasks: number;
}

export type TaskStatus = 'todo' | 'inProgress' | 'done' | 'all';

interface TooltipData {
  label: string;
  value: number;
  week: string;
  color: string;
  percentChange?: number;
}

export interface BarsWithLineProps {
  width: number;
  height: number;
  data: TaskData[];
  margin?: { top: number; right: number; bottom: number; left: number };
  events?: boolean;
  barColors?: string[];
  lineColor?: string;
  onStatusChange?: (status: TaskStatus) => void;
}

const defaultMargin = { top: 40, right: 40, bottom: 50, left: 60 };
const blueColors = ['#93c5fd', '#60a5fa', '#3b82f6'];
const defaultLineColor = '#ef4444';

const tooltipStyles = {
  ...defaultStyles,
  minWidth: 120,
  backgroundColor: 'rgba(0,0,0,0.9)',
  color: 'white',
  borderRadius: '4px',
  padding: '8px 12px',
};

const calculatePercentChange = (current: number, previous: number): number => {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
};

const getTaskValue = (task: TaskData | undefined, key: string): number => {
  if (!task) return 0;
  
  switch (key) {
    case 'todo':
      return task.todo || 0;
    case 'inProgress':
      return task.inProgress || 0;
    case 'done':
      return task.done || 0;
    case 'totalTasks':
      return task.totalTasks || 0;
    default:
      return 0;
  }
};

export default function BarsWithLine({
  width,
  height,
  data,
  events = false,
  margin = defaultMargin,
  barColors = blueColors,
  lineColor = defaultLineColor,
  onStatusChange,
}: BarsWithLineProps) {
  const validData = useMemo(() => {
    return Array.isArray(data) ? data.filter(d => d && typeof d === 'object') : [];
  }, [data]);
  
  const [taskStatus, setTaskStatus] = useState<TaskStatus>('all');
  
  const {
    tooltipOpen,
    tooltipLeft,
    tooltipTop,
    tooltipData,
    hideTooltip,
    showTooltip
  } = useTooltip<TooltipData>();

  const { containerRef, TooltipInPortal } = useTooltipInPortal({
    scroll: true,
  });

  let tooltipTimeout: number;

  if (width < 10) return null;

  if (validData.length === 0) {
    return <div className="p-4 text-center">No task data available</div>;
  }

  const keys = useMemo(() => {
    switch(taskStatus) {
      case 'todo': return ['todo'];
      case 'inProgress': return ['inProgress'];
      case 'done': return ['done'];
      case 'all':
      default: return ['todo', 'inProgress', 'done'];
    }
  }, [taskStatus]);
  
  const xMax = width - margin.left - margin.right;
  const yMax = height - margin.top - margin.bottom;

  const getWeek = (d: TaskData) => d.week;

  const maxY = useMemo(() => {
    const totals = validData.map(item => {
      if (taskStatus === 'all') {
        return (item.todo || 0) + (item.inProgress || 0) + (item.done || 0);
      } else {
        return item[taskStatus] || 0;
      }
    });
    
    const maxBarValue = Math.max(...totals, 0);
    const maxTotalTasks = Math.max(...validData.map(d => d.totalTasks || 0), 0);
    
    return Math.max(maxBarValue, maxTotalTasks) * 1.1;
  }, [validData, taskStatus]);

  const lineData = useMemo(() => {
    return validData.map(d => ({
      x: d.week,
      y: taskStatus === 'all' ? d.totalTasks || 0 : d[taskStatus] || 0,
    }));
  }, [validData, taskStatus]);

  const xScale = scaleBand<string>({
    domain: validData.map(getWeek),
    padding: 0.2,
  }).rangeRound([0, xMax]);
  
  const yScale = scaleLinear<number>({
    domain: [0, maxY],
    nice: true,
  }).range([yMax, 0]);
  
  const colorScale = scaleOrdinal<string, string>({
    domain: keys,
    range: barColors,
  });

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newStatus = e.target.value;
    
    if (newStatus === 'todo' || newStatus === 'inProgress' || newStatus === 'done' || newStatus === 'all') {
      const typedStatus = newStatus as TaskStatus;
      setTaskStatus(typedStatus);
      
      if (onStatusChange) {
        onStatusChange(typedStatus);
      }
    }
  };

  const handleBarTooltip = (bar: any, event: React.MouseEvent) => {
    if (!bar || !bar.data) {
      hideTooltip();
      return;
    }
    
    if (tooltipTimeout) clearTimeout(tooltipTimeout);
    
    const eventSvgCoords = localPoint(event);
    const left = bar.x + (bar.width / 2);
    
    const key = bar.key;
    const currentValue = getTaskValue(bar.data, key);
    const prevWeekData = bar.index > 0 ? validData[bar.index - 1] : undefined;
    const prevValue = getTaskValue(prevWeekData, key);
    
    const percentChange = calculatePercentChange(currentValue, prevValue);
    
    showTooltip({
      tooltipData: {
        label: key,
        value: currentValue,
        week: bar.data.week,
        color: bar.color,
        percentChange,
      },
      tooltipTop: eventSvgCoords?.y || 0,
      tooltipLeft: left,
    });
  };

  const handleLineTooltip = (d: any, i: number, event: React.MouseEvent) => {
    if (tooltipTimeout) clearTimeout(tooltipTimeout);
    
    const eventSvgCoords = localPoint(event);
    if (!eventSvgCoords) {
      hideTooltip();
      return;
    }
    
    const left = (xScale(d.x) || 0) + xScale.bandwidth() / 2;
    
    if (i < 0 || i >= validData.length) {
      hideTooltip();
      return;
    }
    
    const currentValue = d.y;
    const prevWeekData = i > 0 ? validData[i - 1] : undefined;
    const prevValue = taskStatus === 'all' 
      ? prevWeekData?.totalTasks || 0 
      : getTaskValue(prevWeekData, taskStatus);
    
    const percentChange = calculatePercentChange(currentValue, prevValue);
    
    showTooltip({
      tooltipData: {
        label: taskStatus === 'all' ? 'Total Tasks' : 
               taskStatus === 'todo' ? 'Todo Tasks' : 
               taskStatus === 'inProgress' ? 'In Progress Tasks' : 
               'Done Tasks',
        value: currentValue,
        week: d.x,
        color: lineColor,
        percentChange,
      },
      tooltipTop: eventSvgCoords.y,
      tooltipLeft: left,
    });
  };

  return (
    <div style={{ position: 'relative' }}>
      <div className="mb-4 flex justify-end relative z-20">
        <select 
          className="bg-white dark:bg-gray-800 border-2 border-black dark:border-white rounded-md px-3 py-1 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,0.5)] relative cursor-pointer"
          value={taskStatus}
          onChange={handleStatusChange}
        >
          <option value="all">All Tasks</option>
          <option value="todo">Todo</option>
          <option value="inProgress">In Progress</option>
          <option value="done">Done</option>
        </select>
      </div>

      <svg ref={containerRef} width={width} height={height}>
        <rect 
          x={0} 
          y={0} 
          width={width} 
          height={height} 
          fill="var(--chart-bg, #f0f9ff)" 
          rx={14}
          className="dark:fill-slate-800" 
        />
        <Grid
          top={margin.top}
          left={margin.left}
          xScale={xScale}
          yScale={yScale}
          width={xMax}
          height={yMax}
          stroke="currentColor"
          strokeOpacity={0.1}
          xOffset={xScale.bandwidth() / 2}
        />
        <Group top={margin.top} left={margin.left}>
          <BarStack
            data={validData}
            keys={keys}
            x={getWeek}
            xScale={xScale}
            yScale={yScale}
            color={colorScale}
          >
            {(barStacks) =>
              barStacks.map((barStack) =>
                barStack.bars.map((bar) => (
                  <rect
                    key={`bar-stack-${barStack.index}-${bar.index}`}
                    x={bar.x}
                    y={bar.y}
                    height={bar.height}
                    width={bar.width}
                    fill={bar.color}
                    rx={4}
                    onMouseLeave={() => {
                      tooltipTimeout = window.setTimeout(() => {
                        hideTooltip();
                      }, 300);
                    }}
                    onMouseMove={(event) => {
                      handleBarTooltip(bar, event);
                    }}
                  />
                ))
              )
            }
          </BarStack>
          
          <>
            <LinePath
              data={lineData}
              x={(d) => (xScale(d.x) || 0) + xScale.bandwidth() / 2}
              y={(d) => yScale(d.y) || 0}
              stroke={lineColor}
              strokeWidth={3}
              curve={curveMonotoneX}
              shapeRendering="geometricPrecision"
            />
            
            {lineData.map((d, i) => (
              <circle
                key={`line-point-${i}`}
                cx={(xScale(d.x) || 0) + xScale.bandwidth() / 2}
                cy={yScale(d.y) || 0}
                r={5}
                fill="white"
                stroke={lineColor}
                strokeWidth={2}
                onMouseLeave={() => {
                  tooltipTimeout = window.setTimeout(() => {
                    hideTooltip();
                  }, 300);
                }}
                onMouseMove={(event) => {
                  handleLineTooltip(d, i, event);
                }}
              />
            ))}
          </>
        </Group>
        
        <AxisBottom
          top={yMax + margin.top}
          left={margin.left}
          scale={xScale}
          stroke="currentColor"
          tickStroke="currentColor"
          tickLabelProps={{
            fill: 'currentColor',
            fontSize: 11,
            textAnchor: 'middle',
          }}
          label="Weeks"
          labelProps={{
            fill: 'currentColor',
            fontSize: 12,
            textAnchor: 'middle',
            y: 35,
          }}
        />
        
        <AxisLeft
          top={margin.top}
          left={margin.left}
          scale={yScale}
          stroke="currentColor"
          tickStroke="currentColor"
          tickLabelProps={{
            fill: 'currentColor',
            fontSize: 11,
            textAnchor: 'end',
            dx: -4,
          }}
          label="Number of Tasks"
          labelProps={{
            fill: 'currentColor',
            fontSize: 12,
            textAnchor: 'middle',
            transform: 'rotate(-90)',
            x: -yMax / 2,
            y: -40,
          }}
        />
      </svg>
      
      <div
        style={{
          position: 'absolute',
          top: margin.top / 2 - 10,
          width: '100%',
          display: 'flex',
          justifyContent: 'center',
          fontSize: '14px',
          zIndex: 10,
        }}
      >
        <LegendOrdinal scale={colorScale} direction="row" labelMargin="0 15px 0 0" />
        <div style={{ display: 'flex', alignItems: 'center', marginLeft: '10px' }}>
          <div
            style={{
              width: '15px',
              height: '2px',
              backgroundColor: lineColor,
              marginRight: '5px',
            }}
          />
          <span>
            {taskStatus === 'all' ? 'Total Tasks' : 
             taskStatus === 'todo' ? 'Todo Tasks' : 
             taskStatus === 'inProgress' ? 'In Progress Tasks' : 
             'Done Tasks'}
          </span>
        </div>
      </div>

      {tooltipOpen && tooltipData && (
        <TooltipInPortal top={tooltipTop} left={tooltipLeft} style={{...tooltipStyles, zIndex: 30}}>
          <div>
            <strong style={{ color: tooltipData.color }}>
              {tooltipData.label === 'todo' ? 'Todo' : 
               tooltipData.label === 'inProgress' ? 'In Progress' : 
               tooltipData.label === 'done' ? 'Done' : 
               tooltipData.label}
            </strong>
          </div>
          <div>Week: {tooltipData.week}</div>
          <div>Value: {tooltipData.value}</div>
          {tooltipData.percentChange !== undefined && (
            <div className={`text-xs mt-1 ${
              tooltipData.percentChange > 0 
                ? 'text-green-400' 
                : tooltipData.percentChange < 0 
                  ? 'text-red-400' 
                  : 'text-gray-400'
            }`}>
              {tooltipData.percentChange > 0 
                ? `↑ ${tooltipData.percentChange.toFixed(1)}%` 
                : tooltipData.percentChange < 0 
                  ? `↓ ${Math.abs(tooltipData.percentChange).toFixed(1)}%` 
                  : `0%`
              } vs prev week
            </div>
          )}
        </TooltipInPortal>
      )}
    </div>
  );
}