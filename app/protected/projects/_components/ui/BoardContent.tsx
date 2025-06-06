// BoardContent.tsx (Used in page.tsx)

"use client";
import React, { useEffect, useMemo, useState } from "react";
import Board, { Task } from "./Board";
import { usePathname } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

// Sample task data templates (without IDs)

const BoardContent: React.FC = () => {
  const supabaseClient = createClient();
  const pathname = usePathname()
  const pathParts = pathname.split("/");
  const projectId = pathParts[pathParts.length - 1];
  const [tasks, setTasks] = useState<any[]>([]);

  useEffect(() => {
    const fetchTasks = async () => {
      const { data, error } = await supabaseClient
        .from("tasks") // your tasks table
        .select("*")
        .eq("project_id", projectId);

      if (error) {
        console.error("Error fetching tasks:", error);
        return;
      }

      if (data) {
        const formattedTasks = data.map((task) => ({
          ...task,
        }));
        setTasks(formattedTasks);
      }
    };

    fetchTasks(); // ✅ Call the function here
  }, [supabaseClient]);
  return (
    <div className=" dark:bg-gray-600 p-6 max-w-9xl mx-auto rounded-lg border-3 border-black dark:border-white cursor-move shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] relative ">
      {/* Background with gradient and grid pattern - only visible in light mode */}
      <div className="absolute inset-0 bg-gradient-to-r from-purple-200 to-blue-200 rounded-lg -z-10"></div>
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#a855f710_1px,transparent_1px),linear-gradient(to_bottom,#a855f710_1px,transparent_1px)] bg-[size:24px_24px] rounded-lg -z-10"></div>
      {/* <h1 className="text-4xl font-bold mb-6">Task Board</h1> */}
      <div data-component="Board">
        <Board initialTasks={tasks} />
      </div>
    </div>
  );
};

export default BoardContent;
