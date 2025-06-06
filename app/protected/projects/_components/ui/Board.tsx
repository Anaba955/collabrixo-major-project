"use client";
import { useState, useEffect, useRef } from "react";
import {
  Calendar,
  PlusCircle,
  X,
  ChevronDown,
  Plus,
  Trash,
} from "lucide-react";
import Image from "next/image";
import { createClient } from "@/utils/supabase/client";
import { usePathname } from "next/navigation";

// Task interface
export interface Task {
  task_id: string;
  project_id: string;
  title: string;
  description: string;
  status: string;
  created_at: string;
  deadline?: string;
  assigned_to?: string;
  created_by?: string;
  deadlineDays?: number | null;
}

// Column interface
interface Column {
  id: string;
  title: string;
  tasks: Task[];
}

// Task Comment interface
interface TaskComment {
  id: string;
  author: string;
  content: string;
  created_at: string;
}

// Task form data interface
interface TaskFormData {
  title: string;
  description: string;
  status: string;
  created_at: string;
  deadline?: string;
  assigned_to?: string;
  created_by?: string;
}

// Board props
interface BoardProps {
  initialTasks?: Task[];
}

const Board: React.FC<BoardProps> = ({ initialTasks = [] }) => {
  // Reference for keeping track of the next task ID counter
  const supabaseClient = createClient();


  const pathname = usePathname();
  const pathParts = pathname.split("/");
  const projectId = pathParts[pathParts.length - 1];
  const [id, setId] = useState<string | null>(null);
  const [userEmails, setUserEmails] = useState<Record<string, string>>({});

  // const [assignedId, setAssignedId] = useState<string | null>(null);

  // const channels = supabaseClient.channel('custom-all-channel')
  // .on(
  //   'postgres_changes',
  //   { event: '*', schema: 'public', table: 'projects' },
  //   (payload) => {
  //     console.log('Change received!', payload)
  //   }
  // )
  // .subscribe()
  const taskIdCounterRef = useRef(initialTasks.length + 1);

  // State to manage the form modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTask, setNewTask] = useState<TaskFormData>({
    title: "",
    description: "",
    status: "todo",
    created_at: new Date().toISOString(),
    created_by: "",
    assigned_to: "",
  });

  // State to manage columns
  const [columns, setColumns] = useState<Record<string, Column>>({
    todo: {
      id: "todo",
      title: "To Do",
      tasks: [],
    },
    inProgress: {
      id: "inProgress",
      title: "In Progress",
      tasks: [],
    },
    done: {
      id: "done",
      title: "Done",
      tasks: [],
    },
  });

  const [draggedTask, setDraggedTask] = useState<Task | null>(null);
  const columnOrder = ["todo", "inProgress", "done"];

  // State for the currently selected column on mobile
  const [selectedColumn, setSelectedColumn] = useState<string>(columnOrder[0]);

  // State for task detail modal
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [editedTask, setEditedTask] = useState<Partial<Task>>({});
  const [newComment, setNewComment] = useState("");
  const [taskComments, setTaskComments] = useState<
    Record<string, TaskComment[]>
  >({});

  // State for mobile dropdown
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Add this near the other state variables (around line 90)
  const [deadlineDays, setDeadlineDays] = useState<number>(7);
  const currentUserId = async () => {
    const { data, error } = await supabaseClient.auth.getUser();
    if (error) {
      console.error("Error fetching user:", error);
      return null;
    }

    return data?.user?.id ?? null;
  };

  const fetchEmail = async (id: string) => {
    const { data, error } = await supabaseClient
      .from("profiles")
      .select("email")
      .eq("id", id)
      .single();
    if (error) {
      console.error("Error fecthing email", error.message);
    }
    return data?.email ?? null;
  };
  // Initialize tasks from props
  useEffect(() => {
    if (initialTasks.length > 0) {
      // Check if we already have tasks added (to prevent duplicate initialization in Strict Mode)
      const totalCurrentTasks = Object.values(columns).reduce(
        (total, column) => total + column.tasks.length,
        0
      );

      // Only initialize if we don't already have tasks
      if (totalCurrentTasks === 0) {
        const updatedColumns = { ...columns };

        initialTasks.forEach((task) => {
          updatedColumns[task.status].tasks.push(task);
        });

        setColumns(updatedColumns);
      }
    }

    const getUserId = async () => {
      const userId = await currentUserId();
      setId(userId);
    };

    getUserId();

    const fetchAllEmails = async () => {
      const userIds = Array.from(
        new Set(
          initialTasks
            .map((task) => task.created_by)
            .filter((id): id is string => typeof id === "string")
        )
      );

      const emailsMap: Record<string, string> = {};

      await Promise.all(
        userIds.map(async (userId) => {
          const email = await fetchEmail(userId);
          if (email) emailsMap[userId] = email;
        })
      );

      setUserEmails(emailsMap);
    };

    if (initialTasks.length > 0) {
      fetchAllEmails();
    }
  }, [initialTasks]);

  // Handle drag start
  const handleDragStart = (e: React.DragEvent, task: Task) => {
    e.dataTransfer.setData("taskId", task.task_id);
    e.dataTransfer.setData("sourceColumnId", task.status);
    setDraggedTask(task);
  };

  // Handle drag over
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  // Handle drop
  const handleDrop = async (e: React.DragEvent, columnId: string) => {
    e.preventDefault();

    if (!draggedTask) return;
    if (!(draggedTask.assigned_to === id || draggedTask.created_by === id)) {
      return;
    }
    // Source column
    const sourceColumn = columns[draggedTask.status];
    // Remove from source column
    const updatedSourceTasks = sourceColumn.tasks.filter(
      (task) => task.task_id !== draggedTask.task_id
    );

    // Update task's status
    const updatedTask = {
      ...draggedTask,
      status: columnId as "todo" | "inProgress" | "done",
    };

    // Add to destination column
    const updatedColumns = {
      ...columns,
      [sourceColumn.id]: {
        ...sourceColumn,
        tasks: updatedSourceTasks,
      },
      [columnId]: {
        ...columns[columnId],
        tasks: [...columns[columnId].tasks, updatedTask],
      },
    };

    setColumns(updatedColumns);
    setDraggedTask(null);

    const { error } = await supabaseClient
      .from("tasks")
      .update({ status: columnId })
      .eq("task_id", draggedTask.task_id);

    if (error) {
      console.error("Error updating task status:", error.message);
      // Optionally show an alert or revert UI change
    }
  };

  // Handle showing the add task modal
  const handleAddTask = () => {
    setIsModalOpen(true);
  };

  // Handle submitting the new task form
  const handleSubmitTask = async (e: any) => {
    e.preventDefault();

    if (!newTask.title) return;

    const { data, error: fetchIdError } = await supabaseClient
      .from("profiles")
      .select("id")
      .eq("email", newTask.assigned_to)
      .single();

    if (fetchIdError || !data) {
      console.error("Error fetching email", fetchIdError?.message || "No data");
      return;
    }

    const assignedId = data.id;
    const { data: insertedTask, error } = await supabaseClient
      .from("tasks")
      .insert([
        {
          project_id: projectId,
          title: newTask.title,
          description: newTask.description,
          status: newTask.status,
          created_by: id,
          assigned_to: assignedId,
          deadline: newTask.deadline,
        },
      ])
      .select("*")
      .single();

    if (error) {
      console.error("Error inserting task:", error.message);
      return;
    }

    setColumns((prev) => {
      const targetColumn = prev[insertedTask.status];
      return {
        ...prev,
        [insertedTask.status]: {
          ...targetColumn,
          tasks: [...targetColumn.tasks, insertedTask],
        },
      };
    });
    // Reset form
    setNewTask({
      title: "",
      description: "",
      status: "todo",
      created_at: new Date().toISOString(),
      assigned_to: "",
    });

    setIsModalOpen(false);
  };

  // Vercel avatars
  const getAvatarUrl = (name: string) => {
    // Using vercel avatar API as requested
    return `https://vercel.com/api/www/avatar/${name}?size=50`;
  };

  // Replace with the avatar display rendering code
  const renderAvatar = (name: string) => {
    // Get random background color based on name
    const getColorFromName = (name: string) => {
      const colors = [
        "bg-blue-500",
        "bg-green-500",
        "bg-yellow-500",
        "bg-red-500",
        "bg-purple-500",
        "bg-pink-500",
        "bg-indigo-500",
        "bg-teal-500",
        "bg-orange-500",
      ];

      // Hash the name to a consistent number
      let hash = 0;
      for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
      }

      // Use the hash to pick a color
      return colors[Math.abs(hash) % colors.length];
    };

    return (
      <div
        className={`w-6 h-6 rounded-full flex items-center justify-center ${getColorFromName(name)} text-white text-xs font-bold border border-black`}
      >
        {name.charAt(0).toUpperCase()}
      </div>
    );
  };

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setNewTask((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Add a new function to handle task deletion
  const handleDeleteTask = async (taskId: string, columnId: string) => {
    console.log(taskId);
    const { data, error } = await supabaseClient
      .from("tasks")
      .delete()
      .eq("task_id", taskId)
      .select();
    if (error) {
      console.log("Error while deleting the task", error.message);
      return;
    }
    console.log("row deleted", data);

    setColumns((prevColumns) => {
      const updatedColumns = { ...prevColumns };
      updatedColumns[columnId].tasks = updatedColumns[columnId].tasks.filter(
        (task) => task.task_id !== taskId
      );
      return updatedColumns;
    });
    setIsDetailModalOpen(false);
  };

  // Handle task click
  const handleTaskClick = async (task: Task) => {
    // Calculate days until deadline if there's a deadline set
    const taskWithDays: Task = { ...task };
    if (task.deadline) {
      taskWithDays.deadlineDays = getDaysUntilDeadline(task.deadline);
    }

    setSelectedTask(taskWithDays);
    setEditedTask(taskWithDays);
    setIsDetailModalOpen(true);

    const { data, error } = await supabaseClient
      .from("tasks")
      .select("comments")
      .eq("task_id", task.task_id)
      .single();

    if (error) {
      console.error("Failed to fetch comments:", error.message);
      return;
    }

    const comments = Array.isArray(data.comments) ? data.comments : [];

    setTaskComments((prev) => ({
      ...prev,
      [task.task_id]: comments,
    }));
  };

  // Handle closing the detail modal
  const handleCloseDetailModal = () => {
    setSelectedTask(null);
    setIsDetailModalOpen(false);
    setEditedTask({});
  };

  // Handle task update
  const handleTaskUpdate = async () => {
    if (!selectedTask) return;

    // If deadlineDays is set, calculate the new deadline date
    if (deadlineDays) {
      const today = new Date();
      const futureDate = new Date();
      futureDate.setDate(today.getDate() + deadlineDays);
      editedTask.deadline = futureDate.toISOString().split("T")[0];
    }

    const updatedTask = { ...selectedTask, ...editedTask } as Task;

    const { error } = await supabaseClient
      .from("tasks")
      .update({
        title: updatedTask.title,
        description: updatedTask.description,
        status: updatedTask.status,
        deadline: updatedTask.deadline,
      })
      .eq("task_id", selectedTask.task_id);

    if (error) {
      console.error("Error updating task:", error.message);
      return;
    }

    const updatedColumns = { ...columns };
    const oldColumnId = selectedTask.status;
    const newColumnId = updatedTask.status || oldColumnId;

    if (oldColumnId !== newColumnId) {
      updatedColumns[oldColumnId].tasks = updatedColumns[
        oldColumnId
      ].tasks.filter((task) => task.task_id !== selectedTask.task_id);
      updatedColumns[newColumnId].tasks.push(updatedTask);
    } else {
      updatedColumns[oldColumnId].tasks = updatedColumns[oldColumnId].tasks.map(
        (task) => (task.task_id === selectedTask.task_id ? updatedTask : task)
      );
    }

    setColumns(updatedColumns);
    setIsDetailModalOpen(false);
    setSelectedTask(null);
    setEditedTask({});
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return "just now";
    if (seconds < 3600) return `${Math.floor(seconds / 60)} min ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hrs ago`;
    if (seconds < 172800) return "Yesterday";

    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  // Handle comment submission
  const handleCommentSubmit = async () => {
    if (!selectedTask || !newComment.trim()) return;

    const commentId = `comment-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const comment: TaskComment = {
      id: commentId,
      author: id || "",
      content: newComment.trim(),
      created_at: new Date().toISOString(),
    };

    setTaskComments((prev) => ({
      ...prev,
      [selectedTask.task_id]: [...(prev[selectedTask.task_id] || []), comment],
    }));

    const { data: taskComments, error } = await supabaseClient
      .from("tasks")
      .select("comments")
      .eq("task_id", selectedTask.task_id)
      .single();

    if (error) {
      console.log("Error fetching comment", error.message);
      return;
    }
    console.log(taskComments);
    const existingComments = Array.isArray(taskComments.comments)
      ? taskComments?.comments
      : [];
    const updatedComments = [...existingComments, comment];
    console.log(updatedComments);

    const { error: updateCommentError } = await supabaseClient
      .from("tasks")
      .update({ comments: updatedComments })
      .eq("task_id", selectedTask.task_id);

    if (updateCommentError) {
      console.log("Error while updating comment", updateCommentError.message);
    }

    setNewComment("");
  };

  // Function to format dates in a more readable way
  const formatDate = (dateString?: string) => {
    if (!dateString) return "No date set";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  // Helper function to calculate days until deadline
  const getDaysUntilDeadline = (deadline?: string) => {
    if (!deadline) return null;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const deadlineDate = new Date(deadline);
    deadlineDate.setHours(0, 0, 0, 0);

    const differenceMs = deadlineDate.getTime() - today.getTime();
    return Math.ceil(differenceMs / (1000 * 60 * 60 * 24));
  };

  // Function to render deadline with appropriate color
  const renderDeadline = (task: Task) => {
    if (!task.deadline) return null;

    const daysUntil = getDaysUntilDeadline(task.deadline);

    let colorClass = "text-gray-500";
    if (daysUntil !== null) {
      if (daysUntil < 0) {
        colorClass = "text-red-600 font-bold";
      } else if (daysUntil <= 3) {
        colorClass = "text-amber-600 font-bold";
      } else if (daysUntil <= 7) {
        colorClass = "text-blue-600";
      }
    }

    return (
      <div className={`text-sm ${colorClass}`}>
        {daysUntil !== null && daysUntil < 0 ? "Overdue by " : "Due in "}
        {daysUntil !== null && Math.abs(daysUntil)}{" "}
        {daysUntil !== null && Math.abs(daysUntil) === 1 ? "day" : "days"}
      </div>
    );
  };

  // Get column name helper
  const getColumnName = (columnId: string): string => {
    return columns[columnId]?.title || columnId;
  };
  const canEditTask =
    selectedTask?.assigned_to === id || selectedTask?.created_by === id;

  return (
    <div className="relative w-full h-full overflow-hidden">
      {/* Background gradient */}
      {/* <div className="absolute inset-0 bg-gradient-to-br from-emerald-300 to-lime-200 dark:from-emerald-900 dark:to-lime-800 opacity-30 dark:opacity-20 -z-10"></div> */}

      {/* Grid pattern overlay */}
      {/* <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] -z-10"></div> */}

      <div className="p-6">
        {/* Header section */}
        <div className="flex justify-between items-center mb-6 ml-auto">
          {/* <h2 className="text-2xl font-bold">Task Board</h2> */}
          <div className="flex items-center gap-4">
            {/* <ModeToggle /> */}
            <button
              onClick={handleAddTask}
              className="flex items-center gap-2 bg-white text-purple-600 border border-purple-300 hover:bg-purple-100 
               dark:bg-gray-900 dark:text-purple-300 dark:border-purple-600 dark:hover:bg-gray-800 px-4 py-2 rounded-lg font-medium transition-colors duration-200 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.3)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0px_0px_rgba(0,0,0,0.3)]"
            >
              <Plus size={18} /> Add Task
            </button>
          </div>
        </div>

        {/* Mobile view with dropdown */}
        <div className="md:hidden w-full">
          <div
            className="flex items-center justify-between p-3 mb-4 bg-white dark:bg-gray-800 rounded-lg shadow-md cursor-pointer border-3 border-black dark:border-gray-700"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          >
            <span className="font-semibold">
              {columns[selectedColumn].title}
            </span>
            <ChevronDown
              size={20}
              className={`transform transition-transform ${isDropdownOpen ? "rotate-180" : ""}`}
            />
          </div>

          {isDropdownOpen && (
            <div className="absolute z-10 w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg border-2 border-black dark:border-gray-700 mb-4">
              {columnOrder.map((columnId) => (
                <div
                  key={columnId}
                  className="p-3 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                  onClick={() => {
                    setSelectedColumn(columnId);
                    setIsDropdownOpen(false);
                  }}
                >
                  {columns[columnId].title}
                </div>
              ))}
            </div>
          )}

          <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm p-4 rounded-lg shadow-md border-2 border-black dark:border-gray-700">
            <div className="font-bold text-lg mb-3">
              {columns[selectedColumn].title} (
              {columns[selectedColumn].tasks.length})
            </div>
            <div className="space-y-3">
              {columns[selectedColumn].tasks.map((task) => (
                <div
                  key={task.task_id}
                  onDragStart={(e) => handleDragStart(e, task)}
                  onClick={() => handleTaskClick(task)}
                  className="bg-white dark:bg-gray-800 p-4 rounded-lg border-3 border-black dark:border-gray-700 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.3)] cursor-grab"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1 overflow-hidden">
                      <div className="flex justify-between">
                        <h3 className="font-semibold text-lg border-b-2 border-black dark:border-gray-600 pb-1">
                          {task.title
                            ?.toLowerCase()
                            .split(" ")
                            .map(
                              (word) =>
                                word.charAt(0).toUpperCase() + word.slice(1)
                            )
                            .join(" ")}
                        </h3>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteTask(task.task_id, task.status);
                          }}
                          disabled={!canEditTask}
                          className="h-6 w-6 flex items-center justify-center bg-red-500 hover:bg-red-600 text-white rounded-full"
                        >
                          <Trash size={14} />
                        </button>
                      </div>

                      <div className="mt-2 p-2 bg-gray-100 dark:bg-gray-700 rounded">
                        <p className="text-sm text-gray-700 dark:text-gray-300">
                          {task.description}
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-2 mt-3 text-xs">
                        <div>
                          <span className="block text-gray-500 dark:text-gray-400">
                            Created
                          </span>
                          <span className="font-medium">
                            {formatDate(task.created_at)}
                          </span>
                        </div>
                        {task.deadline && (
                          <div>
                            <span className="block text-gray-500 dark:text-gray-400">
                              Deadline
                            </span>
                            <span className="font-medium">
                              {renderDeadline(task)}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="mt-3 pt-2 border-t border-gray-200 dark:border-gray-700">
                        {task.created_by && (
                          <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 mb-1">
                            <span className="mr-1">Created by:</span>
                            <span className="font-medium">
                              {userEmails[task.created_by]}
                            </span>
                          </div>
                        )}

                        {task.assigned_to && userEmails[task.assigned_to] && (
                          <div className="flex items-center text-xs">
                            <div className="flex-shrink-0 mr-2">
                              {renderAvatar(userEmails[task.assigned_to])}
                            </div>
                            <span className="font-medium">
                              {userEmails[task.assigned_to]}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Desktop view with grid layout */}
        <div className="hidden md:grid md:grid-cols-3 gap-4">
          {columnOrder.map((columnId) => (
            <div
              key={columnId}
              className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-lg shadow-md border-2 border-black dark:border-gray-700"
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, columnId)}
            >
              <div className="bg-white dark:bg-gray-800 p-3 rounded-t-lg font-bold border-b-2 border-black dark:border-gray-700">
                {columns[columnId].title} ({columns[columnId].tasks.length})
              </div>
              <div className="p-3 h-[calc(100vh-200px)] overflow-y-auto space-y-3">
                {columns[columnId].tasks.map((task) => (
                  <div
                    key={task.task_id}
                    onDragStart={(e) => handleDragStart(e, task)}
                    onClick={() => handleTaskClick(task)}
                    className="bg-white dark:bg-gray-800 p-4 rounded-lg border-3 border-black dark:border-gray-700 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.3)] cursor-grab"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1 overflow-hidden">
                        <div className="flex justify-between">
                          <h3 className="font-semibold text-lg border-b-2 border-black dark:border-gray-600 pb-1">
                            {task.title
                              ?.toLowerCase()
                              .split(" ")
                              .map(
                                (word) =>
                                  word.charAt(0).toUpperCase() + word.slice(1)
                              )
                              .join(" ")}
                          </h3>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteTask(task.task_id, task.status);
                            }}
                            disabled={!canEditTask}
                            className="h-6 w-6 flex items-center justify-center bg-red-500 hover:bg-red-600 text-white rounded-full"
                          >
                            <Trash size={14} />
                          </button>
                        </div>

                        <div className="mt-2 p-2 bg-gray-100 dark:bg-gray-700 rounded">
                          <p className="text-sm text-gray-700 dark:text-gray-300">
                            {task.description}
                          </p>
                        </div>

                        <div className="grid grid-cols-2 gap-2 mt-3 text-xs">
                          <div>
                            <span className="block text-gray-500 dark:text-gray-400">
                              Created
                            </span>
                            <span className="font-medium">
                              {formatDate(task.created_at)}
                            </span>
                          </div>
                          {task.deadline && (
                            <div>
                              <span className="block text-gray-500 dark:text-gray-400">
                                Deadline
                              </span>
                              <span className="font-medium">
                                {renderDeadline(task)}
                              </span>
                            </div>
                          )}
                        </div>

                        <div className="mt-3 pt-2 border-t border-gray-200 dark:border-gray-700">
                          {task.created_by && (
                            <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 mb-1">
                              <span className="mr-1">Created by:</span>
                              <span className="font-medium">
                                {userEmails[task.created_by]}
                              </span>
                            </div>
                          )}

                          {task.assigned_to && userEmails[task.assigned_to] && (
                            <div className="flex items-center text-xs">
                              <div className="flex-shrink-0 mr-2">
                                {renderAvatar(userEmails[task.assigned_to])}
                              </div>
                              <span className="font-medium">
                                {userEmails[task.assigned_to]}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Task detail modal */}
      {isDetailModalOpen && selectedTask && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg max-w-4xl w-full border-3 border-black dark:border-gray-700 shadow-[8px_8px_0px_0px_rgba(0,0,0,0.3)]">
            {/* Header with ID and title */}
            <div className="flex justify-between items-start mb-6">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="bg-purple-100 text-purple-700 px-2 py-0.5 rounded text-xs font-medium">
                    TASK-{selectedTask.task_id.split("-")[1]}
                  </span>
                  {selectedTask.status === "todo" && (
                    <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-xs font-medium">
                      To Do
                    </span>
                  )}
                  {selectedTask.status === "inProgress" && (
                    <span className="bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded text-xs font-medium">
                      In Progress
                    </span>
                  )}
                  {selectedTask.status === "done" && (
                    <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded text-xs font-medium">
                      Done
                    </span>
                  )}
                </div>
                <h2 className="text-xl font-bold">{selectedTask.title}</h2>
              </div>
              <button
                onClick={() => setIsDetailModalOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={20} />
              </button>
            </div>

            {/* Main content area */}
            <div className="flex flex-col md:flex-row gap-6">
              {/* Left side - Description */}
              <div className="flex-1">
                <div className="mb-6">
                  <h3 className="text-base font-medium mb-2">Description</h3>
                  <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
                    <textarea
                      value={editedTask.description || selectedTask.description}
                      onChange={(e) =>
                        setEditedTask({
                          ...editedTask,
                          description: e.target.value,
                        })
                      }
                      disabled={!canEditTask}
                      className="w-full bg-transparent border-0 focus:ring-0 text-sm text-gray-700 dark:text-gray-300 resize-none min-h-[100px]"
                      placeholder="Add a description..."
                    />
                  </div>
                </div>

                <div>
                  <h3 className="text-base font-medium mb-2">Comments</h3>

                  <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg border border-gray-200 dark:border-gray-600 mb-2 h-64 flex flex-col overflow-hidden">
                    <div className="flex-1 overflow-y-auto pr-1 space-y-3">
                      {taskComments[selectedTask.task_id]?.length > 0 ? (
                        taskComments[selectedTask.task_id].map((comment) => (
                          <div
                            key={comment.id}
                            className="border-b border-gray-200 dark:border-gray-600 pb-3"
                          >
                            <div className="flex items-center mb-1">
                              <div className="mr-2">
                                {renderAvatar(
                                  userEmails[comment.author] || comment.author
                                )}
                              </div>
                              <span className="font-medium text-sm">
                                {userEmails[comment.author]}
                              </span>
                              <span className="text-xs text-gray-500 ml-2">
                                {formatTimeAgo(comment.created_at)}
                              </span>
                            </div>
                            <p className="text-sm">{comment.content}</p>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-gray-500">
                          No comments yet.
                        </p>
                      )}
                    </div>

                    <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
                      {selectedTask.assigned_to === id ? (
                        <div className="flex gap-2">
                          <div className="flex-shrink-0">
                            {renderAvatar((userEmails[id ?? ""] || id) ?? "U")}
                          </div>
                          <div className="flex-1">
                            <textarea
                              placeholder="Add a comment..."
                              value={newComment}
                              onChange={(e) => setNewComment(e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm resize-none"
                              rows={2}
                            />
                            <button
                              onClick={handleCommentSubmit}
                              disabled={!newComment.trim()}
                              className="mt-2 px-4 py-1 bg-blue-500 text-white rounded-md text-sm disabled:opacity-50"
                            >
                              Comment
                            </button>
                          </div>
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500 italic">
                          Only the assigned user can comment on this task.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Right sidebar - Details */}
              <div className="md:w-64 space-y-4">
                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
                  <h3 className="text-sm font-medium mb-2">Details</h3>

                  <div className="space-y-3">
                    <div>
                      <span className="block text-xs text-gray-500 dark:text-gray-400">
                        Status
                      </span>
                      <select
                        value={editedTask.status || selectedTask.status}
                        disabled={!canEditTask}
                        onChange={(e) =>
                          setEditedTask({
                            ...editedTask,
                            status: e.target.value,
                          })
                        }
                        className="mt-1 block w-full py-1 px-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm"
                      >
                        <option value="todo">To Do</option>
                        <option value="inProgress">In Progress</option>
                        <option value="done">Done</option>
                      </select>
                    </div>

                    <div>
                      <span className="block text-xs text-gray-500 dark:text-gray-400">
                        Assignee
                      </span>
                      <div className="flex items-center mt-1">
                        {selectedTask.assigned_to &&
                        userEmails[selectedTask.assigned_to] ? (
                          <>
                            {renderAvatar(userEmails[selectedTask.assigned_to])}
                            <span className="ml-2 text-sm">
                              {userEmails[selectedTask.assigned_to]}
                            </span>
                          </>
                        ) : (
                          <span className="text-sm text-gray-500">
                            Unassigned
                          </span>
                        )}
                      </div>
                    </div>

                    <div>
                      <span className="block text-xs text-gray-500 dark:text-gray-400">
                        Created
                      </span>
                      <span className="text-sm">
                        {formatDate(selectedTask.created_at)}
                      </span>
                    </div>

                    <div>
                      <span className="block text-xs text-gray-500 dark:text-gray-400">
                        Deadline
                      </span>
                      <div className="flex items-center space-x-2 mt-1">
                        <div className="flex-1">
                          <label className="text-xs text-gray-500">
                            Days from now:
                          </label>
                          <input
                            type="number"
                            min="0"
                            value={
                              selectedTask.deadlineDays !== undefined
                                ? Math.max(0, selectedTask.deadlineDays || 0)
                                : ""
                            }
                            onChange={(e) => {
                              const days = parseInt(e.target.value);
                              setDeadlineDays(days ?? 0);
                              if (!isNaN(days)) {
                                // Calculate new deadline date based on days from now
                                const date = new Date();
                                date.setDate(date.getDate() + days);
                                const newDeadline = date
                                  .toISOString()
                                  .split("T")[0];
                                setEditedTask({
                                  ...editedTask,
                                  deadline: newDeadline,
                                  deadlineDays: days,
                                });
                                setSelectedTask({
                                  ...selectedTask,
                                  deadlineDays: days,
                                });
                              }
                            }}
                            disabled={!canEditTask}
                            className="mt-1 block w-full py-1 px-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm"
                          />
                        </div>
                      </div>
                      {selectedTask.deadline && (
                        <div className="mt-2">
                          <span className="text-sm font-medium">
                            {formatDate(
                              editedTask.deadline || selectedTask.deadline
                            )}
                          </span>
                          {renderDeadline({ ...selectedTask, ...editedTask })}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="space-y-2">
                  <button
                    disabled={!canEditTask}
                    onClick={handleTaskUpdate}
                    className="w-full bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md font-medium transition-colors duration-200 shadow-[3px_3px_0px_0px_rgba(0,0,0,0.3)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_0px_rgba(0,0,0,0.3)] flex items-center justify-center"
                  >
                    Update
                  </button>

                  <button
                    disabled={!canEditTask}
                    onClick={() =>
                      handleDeleteTask(
                        selectedTask.task_id,
                        selectedTask.status
                      )
                    }
                    className="w-full bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md font-medium transition-colors duration-200 shadow-[3px_3px_0px_0px_rgba(0,0,0,0.3)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_0px_rgba(0,0,0,0.3)] flex items-center justify-center"
                  >
                    <Trash size={16} className="mr-2" /> Delete
                  </button>

                  <button
                    onClick={() => handleCloseDetailModal()}
                    className="w-full bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 px-4 py-2 rounded-md font-medium transition-colors duration-200 shadow-[3px_3px_0px_0px_rgba(0,0,0,0.2)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_0px_rgba(0,0,0,0.2)]"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Task Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg max-w-xl w-full border-3 border-black dark:border-gray-700 shadow-[8px_8px_0px_0px_rgba(0,0,0,0.3)]">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Add New Task</h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium mb-1">Title</label>
                <input
                  type="text"
                  name="title"
                  value={newTask.title}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md"
                  placeholder="Task title"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium mb-1">
                  Description
                </label>
                <textarea
                  name="description"
                  value={newTask.description}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md"
                  rows={3}
                  placeholder="Task description"
                />
              </div>

              {/* Status */}
              <div>
                <label className="block text-sm font-medium mb-1">Status</label>
                <select
                  name="status"
                  value={newTask.status}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md"
                >
                  <option value="todo">To Do</option>
                  <option value="inProgress">In Progress</option>
                  <option value="done">Done</option>
                </select>
              </div>

              {/* Assigned To */}
              <div>
                <label className="block text-sm font-medium mb-1">
                  Assigned To
                </label>
                <input
                  type="text"
                  name="assigned_to"
                  value={newTask.assigned_to || ""}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md"
                  placeholder="User name"
                />
              </div>

              {/* Deadline */}
              <div>
                <label className="block text-sm font-medium mb-1">
                  Deadline
                </label>
                <input
                  min={"0"}
                  type="date"
                  name="deadline"
                  value={newTask.deadline || ""}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmitTask}
                  className="px-4 py-2 bg-emerald-500 text-white rounded-md hover:bg-emerald-600 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.3)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0px_0px_rgba(0,0,0,0.3)]"
                >
                  Add Task
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Board;
