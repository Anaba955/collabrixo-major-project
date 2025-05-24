"use client";

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Github,
  LayoutDashboard,
  MessageSquare,
  CalendarDays,
  PlusCircle,
} from "lucide-react";
import BoardContent from "./ui/BoardContent";
import { Calendar } from "@/components/calendar";

export default function TabsSection() {
  const handleAddMember = () => {
    // For now, just log to console
    console.log("Add Member button clicked!");
    // You can replace this with a modal or form trigger later
  };

  return (
    <div className="w-full flex flex-col">
     

      {/* --- Tabs Section --- */}
      <Tabs defaultValue="kanban" className="w-full flex flex-col">
        <TabsList className="grid w-full grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 mb-4">
          <TabsTrigger value="kanban" className="flex items-center gap-2">
            <LayoutDashboard className="w-4 h-4 text-purple-600" />
            <span className="sm:inline text-purple-600 md:text-xl lg:text-base">
              Kanban
            </span>
          </TabsTrigger>

          <TabsTrigger value="calendar" className="flex items-center gap-2">
            <CalendarDays className="w-4 h-4 text-purple-600" />
            <span className="sm:inline text-purple-600 md:text-xl lg:text-base">
              Calendar
            </span>
          </TabsTrigger>

          <TabsTrigger value="chat" className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-purple-600" />
            <span className="sm:inline text-purple-600 md:text-xl lg:text-base">
              Team Chat
            </span>
          </TabsTrigger>

          <TabsTrigger value="activity" className="flex items-center gap-2">
            <Github className="w-4 h-4 text-purple-600" />
            <span className="sm:inline text-purple-600 md:text-xl lg:text-base">
              Github Activity
            </span>
          </TabsTrigger>
        </TabsList>

        <div className="w-full">
          <TabsContent
            value="kanban"
            className="w-full min-h-[500px] rounded-lg px-2"
          >
            <BoardContent />
          </TabsContent>

          <TabsContent
            value="calendar"
            className="w-full min-h-[500px] rounded-lg px-2"
          >
            <Calendar />
          </TabsContent>

          <TabsContent
            value="chat"
            className="w-full min-h-[500px] rounded-lg px-2"
          >
            Team chat will go here.
          </TabsContent>

          <TabsContent
            value="activity"
            className="w-full min-h-[500px] rounded-lg px-2"
          >
            Github activity will go here.
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
