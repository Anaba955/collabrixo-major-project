"use client";

import React, { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { DayPicker } from "react-day-picker";
import { Calendar as CalendarIcon, CheckCircle, Clock, Circle, Plus } from "lucide-react";
import "react-day-picker/dist/style.css";

// --- Types ---
type Task = {
  id: string;
  title: string;
  status: string;
  created_at: string;
  updated_at: string;
  priority?: "low" | "medium" | "high";
  assignee?: string;
};

// --- Main Component ---
export default function ProjectCalendarPage({ projectId }: { projectId: string }) {
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  });

  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  // Format full date display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // Fetch tasks when date or project changes
  useEffect(() => {
    if (!selectedDate) return;

    const fetchTasks = async () => {
      setLoading(true);
      try {
        const startOfDay = `${selectedDate} 00:00:00`;
        const endOfDay = `${selectedDate} 23:59:59`;

        const { data, error } = await supabase
          .from("tasks")
          .select("*")
          .eq("project_id", projectId)
          .gte("created_at", startOfDay)
          .lte("created_at", endOfDay)
          .order("created_at", { ascending: true });

        if (error) {
          console.error("Failed to fetch tasks:", error.message);
          setTasks([]);
        } else {
          setTasks(data || []);
        }
      } catch (error) {
        console.error("Unexpected error:", error);
        setTasks([]);
      } finally {
        setLoading(false);
      }
    };

    fetchTasks();
  }, [projectId, selectedDate, supabase]);

  const grouped = {
    todo: tasks.filter((t) => t.status === "todo"),
    "in progress": tasks.filter((t) => t.status === "in progress"),
    done: tasks.filter((t) => t.status === "done"),
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "todo":
        return <Circle className="w-4 h-4 text-gray-400" />;
      case "in progress":
        return <Clock className="w-4 h-4 text-blue-500" />;
      case "done":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      default:
        return <Circle className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "todo":
        return "border-l-gray-300 bg-gray-50";
      case "in progress":
        return "border-l-blue-300 bg-blue-50";
      case "done":
        return "border-l-green-300 bg-green-50";
      default:
        return "border-l-gray-300 bg-gray-50";
    }
  };

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-800";
      case "medium":
        return "bg-yellow-100 text-yellow-800";
      case "low":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      const isoDate = date.toISOString().split("T")[0];
      setSelectedDate(isoDate);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-10 p-4">
      {/* Calendar */}
      <div className="bg-white rounded-md shadow-md p-4">
        <DayPicker
          mode="single"
          selected={new Date(selectedDate)}
          onSelect={handleDateSelect}
          showOutsideDays
          classNames={{
            months: "flex flex-col sm:flex-row gap-4",
            month: "flex flex-col gap-4",
            caption: "flex justify-center items-center relative text-lg font-semibold pb-2",
            nav: "flex justify-between items-center mb-2",
            nav_button: "p-1 opacity-70 hover:opacity-100",
            table: "w-full border-collapse border border-gray-200 rounded-md",
            head_row: "flex",
            head_cell: "flex-1 text-center py-2 font-semibold text-gray-500 text-sm",
            row: "flex w-full",
            cell: "flex-1 aspect-square text-center py-1 cursor-pointer select-none rounded-md transition-colors hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-primary",
            day_selected: "bg-purple-600 text-white font-semibold",
            day_today: "border border-purple-600 text-purple-600 font-semibold",
            day_outside: "text-gray-400",
            day_disabled: "text-gray-300 cursor-not-allowed",
          }}
        />
      </div>

      {/* Tasks */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-purple-600" />
            <h2 className="text-xl font-bold">Tasks for {formatDate(selectedDate)}</h2>
          </div>
          <div className="text-sm text-gray-500">
            {tasks.length} task{tasks.length !== 1 ? "s" : ""}
          </div>
        </div>

        {loading ? (
          <div className="animate-pulse space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        ) : tasks.length === 0 ? (
          <div className="text-center py-12">
            <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <CalendarIcon className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No tasks for this date</h3>
            <p className="text-gray-500 mb-4">Create a new task to get started.</p>
            <button className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
              <Plus className="w-4 h-4" />
              Add Task
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(grouped).map(([status, taskList]) => (
              <div key={status} className="space-y-3">
                <div className="flex items-center gap-2">
                  {getStatusIcon(status)}
                  <h3 className="text-lg font-semibold capitalize">
                    {status} ({taskList.length})
                  </h3>
                </div>

                {taskList.length > 0 ? (
                  <div className="space-y-2">
                    {taskList.map((task) => (
                      <div
                        key={task.id}
                        className={`p-4 rounded-lg border-l-4 ${getStatusColor(status)} transition-all hover:shadow-sm`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900 mb-1">{task.title}</h4>
                            <div className="flex items-center gap-3 text-sm text-gray-500">
                              <span>
                                Created:{" "}
                                {new Date(task.created_at).toLocaleTimeString([], {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </span>
                              {task.updated_at !== task.created_at && (
                                <span>
                                  Updated:{" "}
                                  {new Date(task.updated_at).toLocaleTimeString([], {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {task.priority && (
                              <span
                                className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(
                                  task.priority
                                )}`}
                              >
                                {task.priority}
                              </span>
                            )}
                            {getStatusIcon(status)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 italic pl-6">No {status} tasks</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
