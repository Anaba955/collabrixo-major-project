

'use client';

import React, { useEffect, useState } from 'react';
import Calendar from 'react-calendar';
import { useSearchParams } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import 'react-calendar/dist/Calendar.css';

interface Task {
  task_id: string;
  title: string;
  description: string;
  status: string;
  created_at: string;
}

export default function CalendarTasks() {
  const [date, setDate] = useState<Date | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [tasksForDate, setTasksForDate] = useState<Task[]>([]);
  const projectId = useSearchParams().get('project_id');
  const supabase = createClient();

  // Load tasks when projectId changes
  useEffect(() => {
    if (!projectId) return;

    const loadTasks = async () => {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('project_id', projectId)
        .in('status', ['todo', 'InProgress', 'done']);

      if (error) {
        console.error('Fetch error:', error);
        return;
      }

      setTasks(data || []);
    };

    loadTasks();
  }, [projectId]);

  // Filter tasks by selected date
  useEffect(() => {
    if (!date) return;

    const dateStr = date.toISOString().split('T')[0];
    const filtered = tasks.filter(task => task.created_at.startsWith(dateStr));
    setTasksForDate(filtered);
  }, [date, tasks]);

  return (
    <div className="p-4">
      <Calendar onClickDay={setDate} />
      <h2 className="text-lg mt-4 font-semibold">
        Tasks on {date ? date.toDateString() : '...'}
      </h2>

      {tasksForDate.length === 0 ? (
        <p className="text-gray-500 mt-2">No tasks on this date.</p>
      ) : (
        <ul className="mt-3 space-y-3">
          {tasksForDate.map(task => (
            <li key={task.task_id} className="border p-3 rounded shadow">
              <div className="font-medium">{task.title}</div>
              <div className="text-sm text-blue-600">{task.status}</div>
              <div className="text-xs text-gray-500">{task.description || 'No description'}</div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
