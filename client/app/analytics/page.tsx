"use client";
import { PRIORITIES, PRIORITY_LABELS, STATUSES, STATUS_LABELS, TaskType } from "@/lib/types";
import { errorMessage, getMyTasks } from "@/lib/api";
import { formatDate, isOverdue, parseDate } from "@/lib/utils";
import { differenceInCalendarDays } from "date-fns";
import { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042"];

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

  // Calculate completion rate
  const completionRate = tasks.length
    ? Math.round(
        (tasks.filter((task) => task.status === "DONE").length /
          tasks.length) *
          100
      )
    : 0;

  // Tasks by status
  const tasksByStatus = STATUSES.map((status) => ({
    name: STATUS_LABELS[status],
    value: tasks.filter((task) => task.status === status).length,
  }));

  // Tasks by priority
  const tasksByPriority = [...PRIORITIES].reverse().map((priority) => ({
    name: PRIORITY_LABELS[priority],
    value: tasks.filter((task) => task.priority === priority).length,
  }));

  // Planned length (start to due) of the finished tasks
  const completedTasks = tasks.filter((task) => task.status === "DONE");
  const avgCompletionTime = completedTasks.length
    ? completedTasks.reduce((acc, task) => acc + daysPlanned(task), 0) / completedTasks.length
    : 0;

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="px-4">
      {error && <p className="mb-4 rounded-md bg-red-900/40 px-4 py-2 text-sm text-red-200">{error}</p>}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-neutral-800 p-6 rounded-lg shadow border border-neutral-700">
          <h3 className="text-gray-400">Total Tasks</h3>
          <p className="text-2xl font-bold text-white">{tasks.length}</p>
        </div>
        <div className="bg-neutral-800 p-6 rounded-lg shadow border border-neutral-700">
          <h3 className="text-gray-400">Completion Rate</h3>
          <p className="text-2xl font-bold text-white">{completionRate}%</p>
        </div>
        <div className="bg-neutral-800 p-6 rounded-lg shadow border border-neutral-700">
          <h3 className="text-gray-400">Avg Planned Days (Done)</h3>
          <p className="text-2xl font-bold text-white">
            {avgCompletionTime.toFixed(1)} days
          </p>
        </div>
        <div className="bg-neutral-800 p-6 rounded-lg shadow border border-neutral-700">
          <h3 className="text-gray-400">Overdue Tasks</h3>
          <p className="text-2xl font-bold text-white">
            {tasks.filter(isOverdue).length}
          </p>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Tasks by Status */}
        <div className="bg-neutral-800 p-6 rounded-lg shadow border border-neutral-700">
          
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={tasksByStatus}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  stroke="#262626"
                  dataKey="value"
                  label={({ name, percent }) =>
                    `${name}: ${(percent * 100).toFixed(0)}%`
                  }
                >
                  {tasksByStatus.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Tasks by Priority */}
        <div className="bg-neutral-800 p-6 rounded-lg shadow border border-neutral-700">
        
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={tasksByPriority}
                margin={{
                  top: 5,
                  right: 30,
                  left: 20,
                  bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#4b5563" />
                <XAxis dataKey="name" stroke="#e5e7eb" />
                <YAxis stroke="#e5e7eb" />
                <Tooltip
                  contentStyle={{ backgroundColor: "#1f2937", borderColor: "#374151" }}
                />
                <Legend />
                <Bar dataKey="value" fill="#8884d8" name="Tasks" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Completed Tasks */}
      <div className="bg-neutral-800 border border-neutral-700 p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold text-white mb-4">
          Recently Completed Tasks
        </h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-neutral-700">
            <thead>
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Title
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Due Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Days Planned
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {[...completedTasks]
                .sort((a, b) => b.dueDate.localeCompare(a.dueDate))
                .slice(0, 5)
                .map((task) => (
                  <tr key={task.id} className="hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                      {task.title}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      {formatDate(task.dueDate)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      {daysPlanned(task)} days
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}