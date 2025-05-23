// BoardContent.tsx (Used in page.tsx)

"use client";
import React, { useMemo } from "react";
import Board, { Task } from "./Board";

// Get current date in YYYY-MM-DD format
const getCurrentDate = () => {
  const today = new Date();
  return today.toISOString().split("T")[0];
};

// Get date a few days from now in YYYY-MM-DD format
const getDateDaysFromNow = (days: number) => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().split("T")[0];
};

// Sample task data templates (without IDs)
const taskTemplates = [
  {
    project_id: "7gadk",
    title: "Review and update sales pitch for new product",
    description: "",
    assigned_to: "Sarah",
    created_by: "Alex",
    deadline: "",
    status: "todo" as const,
  },
  {
    project_id: "7gadk",
    title: "Pay employee salaries",
    description: "",
    assigned_to: "John",
    created_by: "Alex",
    deadline: "",
    status: "todo" as const,
  },

  {
    project_id: "7gadk",
    title: "Research market trends",
    description: "",
    assigned_to: "Emily",
    created_by: "Alex",
    deadline: "",
    status: "inProgress" as const,
  },
  {
    project_id: "7gadk",
    title: "Add AI chatbot for support",
    description: "",
    assigned_to: "John",
    created_by: "Alex",
    deadline: "",
    status: "inProgress" as const,
  },

  {
    project_id: "7gadk",
    title: "Establish mentorship program for junior staff",
    description: "",
    assigned_to: "Maria",
    created_by: "Alex",
    deadline: getDateDaysFromNow(4),
    status: "done" as const,
  },
  {
    project_id: "7gadk",
    title: "Test compatibility on various devices",
    description: "",
    assigned_to: "John",
    created_by: "Alex",
    deadline: getCurrentDate(),
    status: "done" as const,
  },
];

const BoardContent: React.FC = () => {
  // Use useMemo to create tasks only once
  const sampleTasks = useMemo(() => {
    // Generate tasks with truly unique IDs
    return taskTemplates.map((template, index) => ({
      ...template,
      task_id: `task-${index}-${Date.now()}-${Math.random()
        .toString(36)
        .substring(2, 6)}`,
      created_at: new Date().toISOString(),
    }));
  }, []);

  return (
    <div className=" dark:bg-gray-600 p-6 max-w-9xl mx-auto rounded-lg border-3 border-black dark:border-white cursor-move shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] relative ">
      {/* Background with gradient and grid pattern - only visible in light mode */}
      <div className="absolute inset-0 bg-gradient-to-r from-purple-200 to-blue-200 rounded-lg -z-10"></div>
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#a855f710_1px,transparent_1px),linear-gradient(to_bottom,#a855f710_1px,transparent_1px)] bg-[size:24px_24px] rounded-lg -z-10"></div>
      {/* <h1 className="text-4xl font-bold mb-6">Task Board</h1> */}
      <div data-component="Board">
        <Board initialTasks={sampleTasks} />
      </div>
    </div>
  );
};

export default BoardContent;
