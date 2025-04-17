"use client";
import React from 'react';
import Heatmap from './Heatmap';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface UserActivityHeatmapProps {
  userId: string;
  userName?: string;
}

export default function UserActivityHeatmap({ userId, userName }: UserActivityHeatmapProps) {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Activity Heatmap</CardTitle>
        <CardDescription>
          Your activity for the current month
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="w-full flex flex-col items-center">
          <div className="w-full max-w-2xl">
            <Heatmap 
              width={600} 
              height={250} 
              userId={userId} 
              events={true}
            />
          </div>
          <div className="mt-4 text-sm text-muted-foreground flex items-center">
            <div className="flex mr-2">
              <div className="w-3 h-3 mr-1 rounded bg-[#064e3b] opacity-40"></div>
              <span>Less</span>
            </div>
            <div className="w-3 h-3 mx-1 rounded bg-[#064e3b] opacity-55"></div>
            <div className="w-3 h-3 mx-1 rounded bg-[#064e3b] opacity-70"></div>
            <div className="w-3 h-3 mx-1 rounded bg-[#10b981] opacity-85"></div>
            <div className="flex ml-1">
              <div className="w-3 h-3 mr-1 rounded bg-[#10b981] opacity-100"></div>
              <span>More</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 