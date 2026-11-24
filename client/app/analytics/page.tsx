"use client";

import { PRIORITIES, PRIORITY_LABELS, STATUSES, STATUS_LABELS, TaskType } from "@/lib/types";
import { errorMessage, getMyTasks } from "@/lib/api";
import { formatDate, isOverdue, parseDate } from "@/lib/utils";
import { differenceInCalendarDays } from "date-fns";
import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts";

const STATUS_COLORS = ["#0275ff", "#FFBB28", "#00C49F"];
const PRIORITY_COLORS: Record<string, string> = {
  High: "#f87171",
  Medium: "#fbbf24",
  Low: "#34d399",
};

export default function AnalyticsDashboard() {
  const [tasks, setTasks] = useState<TaskType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getMyTasks()
      .then(setTasks)
      .catch((e) => setError(errorMessage(e)))
      .finally(() => setLoading(false));
  }, []);

  const daysPlanned = (task: TaskType) =>
    differenceInCalendarDays(parseDate(task.dueDate), parseDate(task.startDate));

  const completionRate = tasks.length
    ? Math.round((tasks.filter((task) => task.status === "DONE").length / tasks.length) * 100)
    : 0;

  const tasksByStatus = STATUSES.map((status) => ({
    name: STATUS_LABELS[status],
    value: tasks.filter((task) => task.status === status).length,
  }));

  const tasksByPriority = [...PRIORITIES].reverse().map((priority) => ({
    name: PRIORITY_LABELS[priority],
    value: tasks.filter((task) => task.priority === priority).length,
  }));

  const completedTasks = tasks.filter((task) => task.status === "DONE");
  const avgCompletionTime = completedTasks.length
    ? completedTasks.reduce((acc, task) => acc + daysPlanned(task), 0) / completedTasks.length
    : 0;

  const overdueCount = tasks.filter(isOverdue).length;

  const stats = [
    { label: "Total tasks", value: String(tasks.length) },
    { label: "Completion", value: `${completionRate}%` },
    { label: "Avg planned days", value: completedTasks.length ? `${avgCompletionTime.toFixed(1)}d` : "—" },
    { label: "Overdue", value: String(overdueCount), accent: overdueCount > 0 },
  ];

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center px-4">
        <p className="text-neutral-400">Loading analytics…</p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col gap-6 overflow-y-auto px-2 md:px-4">
      <div>
        <h1 className="text-2xl font-semibold text-white">Analytics</h1>
        <p className="mt-1 text-sm text-neutral-400">A quick read on how your tasks are moving.</p>
      </div>

      {error && (
        <p className="rounded-md bg-red-900/40 px-4 py-2 text-sm text-red-200">{error}</p>
      )}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-2xl border border-neutral-700 bg-neutral-800/60 px-5 py-4">
            <p className="text-xs uppercase tracking-wide text-neutral-400">{stat.label}</p>
            <p
              className={`mt-2 text-2xl font-semibold tabular-nums ${
                stat.accent ? "text-red-300" : "text-white"
              }`}>
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <section className="rounded-2xl border border-neutral-700 bg-neutral-800/60 p-5">
          <div className="mb-4">
            <h2 className="text-base font-medium text-white">By status</h2>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={tasksByStatus}
                  cx="50%"
                  cy="50%"
                  innerRadius={58}
                  outerRadius={88}
                  paddingAngle={3}
                  stroke="#262626"
                  dataKey="value"
                  labelLine={false}
                  label={({ name, value }) => (value ? name : "")}>
                  {tasksByStatus.map((entry, index) => (
                    <Cell key={entry.name} fill={STATUS_COLORS[index % STATUS_COLORS.length]} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 flex flex-wrap gap-3">
            {tasksByStatus.map((item, index) => (
              <div key={item.name} className="flex items-center gap-2 text-xs text-neutral-300">
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: STATUS_COLORS[index] }}
                />
                {item.name}
                <span className="tabular-nums text-neutral-500">{item.value}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-neutral-700 bg-neutral-800/60 p-5">
          <div className="mb-4">
            <h2 className="text-base font-medium text-white">By priority</h2>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={tasksByPriority} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#404040" vertical={false} />
                <XAxis
                  dataKey="name"
                  stroke="#a3a3a3"
                  tickLine={false}
                  axisLine={false}
                  fontSize={12}
                />
                <YAxis
                  allowDecimals={false}
                  stroke="#a3a3a3"
                  tickLine={false}
                  axisLine={false}
                  fontSize={12}
                />
                <Bar dataKey="value" name="Tasks" radius={[8, 8, 0, 0]} maxBarSize={48}>
                  {tasksByPriority.map((entry) => (
                    <Cell key={entry.name} fill={PRIORITY_COLORS[entry.name] ?? "#0275ff"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>

      <section className="rounded-2xl border border-neutral-700 bg-neutral-800/60 p-5">
        <div className="mb-4">
          <h2 className="text-base font-medium text-white">Recently completed</h2>
          <p className="mt-0.5 text-sm text-neutral-400">Latest done tasks by due date</p>
        </div>

        {completedTasks.length === 0 ? (
          <p className="py-8 text-center text-sm text-neutral-500">No completed tasks yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-neutral-700 text-left text-xs uppercase tracking-wide text-neutral-500">
                  <th className="pb-3 pr-4 font-medium">Title</th>
                  <th className="pb-3 pr-4 font-medium">Course</th>
                  <th className="pb-3 pr-4 font-medium">Due</th>
                  <th className="pb-3 font-medium">Planned</th>
                </tr>
              </thead>
              <tbody>
                {[...completedTasks]
                  .sort((a, b) => b.dueDate.localeCompare(a.dueDate))
                  .slice(0, 5)
                  .map((task) => (
                    <tr
                      key={task.id}
                      className="border-b border-neutral-800 last:border-0 hover:bg-neutral-900/50">
                      <td className="py-3.5 pr-4 text-sm text-white">{task.title}</td>
                      <td className="py-3.5 pr-4 text-sm text-neutral-400">{task.courseName}</td>
                      <td className="py-3.5 pr-4 text-sm tabular-nums text-neutral-400">
                        {formatDate(task.dueDate)}
                      </td>
                      <td className="py-3.5 text-sm tabular-nums text-neutral-400">
                        {daysPlanned(task)}d
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
