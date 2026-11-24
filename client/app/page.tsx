'use client';

import React, { useEffect, useState } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { Alert, Snackbar } from '@mui/material';
import AddButton from '@/components/AddButton';
import { Course, STATUSES, TaskFormData, TaskStatus, TaskType } from '@/lib/types';
import TaskColumn from '@/components/ui/TaskColumn';
import {
  createTask,
  deleteTask,
  errorMessage,
  getCourses,
  getMyTasks,
  updateTask,
  updateTaskStatus,
} from '@/lib/api';

const colors = ['#0088FE', '#FFBB28', '#00C49F'];

const Home = () => {
  const [tasks, setTasks] = useState<TaskType[]>([]);
  const [courses, setCourses] = useState<Record<number, Course>>({});
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getMyTasks()
      .then(setTasks)
      .catch((e) => setError(errorMessage(e)));
    // Course code and instructor for the cards (P2 is public).
    getCourses()
      .then((list) => setCourses(Object.fromEntries(list.map((c) => [c.id, c]))))
      .catch((e) => setError(errorMessage(e)));
  }, []);

  const replaceTask = (updated: TaskType) =>
    setTasks((prev) => prev.map((task) => (task.id === updated.id ? updated : task)));

  // Dragging a card to another column (C5). Rule A can refuse moving a DONE task back.
  const moveTask = async (taskId: number, toStatus: TaskStatus) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task || task.status === toStatus) return;
    try {
      replaceTask(await updateTaskStatus(task, toStatus));
    } catch (e) {
      setError(errorMessage(e));
    }
  };

  // C1. Errors are thrown back to the form so it can show them and stay open.
  const handleNewTask = async (formData: TaskFormData) => {
    const created = await createTask(formData);
    setTasks((prev) => [...prev, created]);
  };

  // C5, keeping the task's current status.
  const handleUpdateTask = async (taskId: number, formData: TaskFormData) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;
    replaceTask(await updateTask(taskId, formData, task.status));
  };

  // C6
  const handleDeleteTask = async (taskId: number) => {
    try {
      await deleteTask(taskId);
      setTasks((prev) => prev.filter((task) => task.id !== taskId));
    } catch (e) {
      setError(errorMessage(e));
    }
  };

  return (
    <>
      <AddButton onPress={handleNewTask} />
      <DndProvider backend={HTML5Backend}>
        <div className="grid grid-cols-1 gap-4 px-4 md:grid-cols-3">
          {STATUSES.map((status, index) => (
            <TaskColumn
              key={status}
              status={status}
              tasks={tasks.filter((task) => task.status === status)}
              courses={courses}
              moveTask={moveTask}
              colors={colors[index]}
              handleDelete={handleDeleteTask}
              onPress={handleUpdateTask}
            />
          ))}
        </div>
      </DndProvider>

      <Snackbar
        open={error !== null}
        autoHideDuration={6000}
        onClose={() => setError(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert severity="error" onClose={() => setError(null)} variant="filled">
          {error}
        </Alert>
      </Snackbar>
    </>
  );
};

export default Home;
