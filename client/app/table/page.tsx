"use client";

import { Course, Priority, PRIORITY_LABELS, STATUS_LABELS, TaskStatus, TaskType } from "@/lib/types";
import { errorMessage, getCourses, getMyTasks } from "@/lib/api";
import { formatDate, isOverdue } from "@/lib/utils";
import { useEffect, useMemo, useState } from "react";

const statusStyles: Record<TaskStatus, string> = {
  TODO: "border-[#0275ff]/40 bg-[#0275ff]/15 text-[#7eb6ff]",
  DOING: "border-amber-400/40 bg-amber-400/15 text-amber-200",
  DONE: "border-emerald-400/40 bg-emerald-400/15 text-emerald-200",
};

const priorityStyles: Record<Priority, string> = {
  LOW: "border-emerald-400/40 bg-emerald-400/15 text-emerald-200",
  MEDIUM: "border-amber-300/40 bg-amber-300/15 text-amber-100",
  HIGH: "border-red-400/40 bg-red-400/15 text-red-200",
};

export default function TaskTable() {
  const [tasks, setTasks] = useState<TaskType[]>([]);
  const [courses, setCourses] = useState<Record<number, Course>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([getMyTasks(), getCourses()])
      .then(([taskList, courseList]) => {
        setTasks(taskList);
        setCourses(Object.fromEntries(courseList.map((c) => [c.id, c])));
      })
      .catch((e) => setError(errorMessage(e)))
      .finally(() => setLoading(false));
  }, []);

  const sorted = useMemo(
    () => [...tasks].sort((a, b) => a.dueDate.localeCompare(b.dueDate)),
    [tasks]
  );

  return (
    <div className="flex h-full flex-col gap-6 overflow-y-auto px-2 md:px-4">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-white">Table</h1>
          <p className="mt-1 text-sm text-neutral-400">All of your tasks in one list.</p>
        </div>
        {!loading && (
          <p className="text-sm tabular-nums text-neutral-500">
            {sorted.length} task{sorted.length === 1 ? "" : "s"}
          </p>
        )}
      </div>

      {error && (
        <p className="rounded-md bg-red-900/40 px-4 py-2 text-sm text-red-200">{error}</p>
      )}

      {loading ? (
        <p className="text-neutral-400">Loading tasks…</p>
      ) : sorted.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-neutral-700 px-6 py-16 text-center">
          <p className="text-neutral-300">No tasks yet</p>
          <p className="mt-1 text-sm text-neutral-500">Create a task from the dashboard.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-neutral-700 bg-neutral-800/60">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-neutral-700 bg-neutral-900/70 text-left text-xs uppercase tracking-wide text-neutral-500">
                  <th className="px-5 py-3.5 font-medium">Title</th>
                  <th className="px-5 py-3.5 font-medium">Course</th>
                  <th className="px-5 py-3.5 font-medium">Status</th>
                  <th className="px-5 py-3.5 font-medium">Priority</th>
                  <th className="px-5 py-3.5 font-medium">Start</th>
                  <th className="px-5 py-3.5 font-medium">Due</th>
                  <th className="px-5 py-3.5 font-medium">Instructor</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((task) => {
                  const course = courses[task.courseId];
                  const overdue = isOverdue(task);

                  return (
                    <tr
                      key={task.id}
                      className="border-b border-neutral-800 last:border-0 transition-colors hover:bg-neutral-900/60">
                      <td className="px-5 py-4 align-top whitespace-nowrap">
                        <p className="text-sm font-medium text-white">{task.title}</p>
                      </td>
                      <td className="px-5 py-4 align-top whitespace-nowrap">
                        {course?.code ? (
                          <span className="inline-block rounded-md border border-neutral-600 px-2 py-0.5 font-mono text-xs tracking-wide text-blue-primary">
                            {course.code}
                          </span>
                        ) : (
                          <span className="text-sm text-neutral-400">{task.courseName}</span>
                        )}
                      </td>
                      <td className="px-5 py-4 align-top whitespace-nowrap">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span
                            className={`inline-flex rounded-md border px-2 py-0.5 text-xs font-medium ${statusStyles[task.status]}`}>
                            {STATUS_LABELS[task.status]}
                          </span>
                          {overdue && (
                            <span className="inline-flex rounded-md border border-red-400/40 bg-red-400/15 px-2 py-0.5 text-xs font-medium text-red-200">
                              Overdue
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-4 align-top whitespace-nowrap">
                        <span
                          className={`inline-flex rounded-md border px-2 py-0.5 text-xs font-medium ${priorityStyles[task.priority]}`}>
                          {PRIORITY_LABELS[task.priority]}
                        </span>
                      </td>
                      <td className="px-5 py-4 align-top whitespace-nowrap text-sm tabular-nums text-neutral-400">
                        {formatDate(task.startDate)}
                      </td>
                      <td className="px-5 py-4 align-top whitespace-nowrap text-sm tabular-nums text-neutral-400">
                        {formatDate(task.dueDate)}
                      </td>
                      <td className="px-5 py-4 align-top text-sm text-neutral-500">
                        {course?.instructor ?? "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
