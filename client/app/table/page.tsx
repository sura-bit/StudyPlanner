"use client"
import { Priority, PRIORITY_LABELS, STATUS_LABELS, TaskStatus, TaskType } from "@/lib/types";
import { errorMessage, getMyTasks } from "@/lib/api";
import { formatDate, isOverdue } from "@/lib/utils";
import { useEffect, useState } from "react";

const statusColors: Record<TaskStatus, string> = {
  TODO: "bg-[#0088FE] text-blue-100",
  DOING: "bg-[#FFBB28] text-yellow-100",
  DONE: "bg-[#00C49F] text-green-100",
};

const priorityColors: Record<Priority, string> = {
  LOW: "bg-[#00C49F] text-gray-300",
  MEDIUM: "bg-[#0088FE] text-blue-100",
  HIGH: "bg-[#F7374F] text-red-100",
};

export default function TaskTable() {
  const [tasks, setTasks] = useState<TaskType[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getMyTasks()
      .then(setTasks)
      .catch((e) => setError(errorMessage(e)));
  }, []);

  return (
    <div className="px-4">
      {error && <p className="mb-4 rounded-md bg-red-900/40 px-4 py-2 text-sm text-red-200">{error}</p>}
      <div className="overflow-x-auto rounded-lg border border-neutral-700 shadow-sm">
        <table className="min-w-full divide-y divide-neutral-700">
          <thead className="bg-neutral-900">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                Title
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                Course
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                Description
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                Status
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                Priority
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                Start Date
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                Due Date
              </th>
            </tr>
          </thead>
          <tbody className="bg-neutral-800 divide-y divide-neutral-700">
            {tasks.map((task) => {
              return (
                <tr key={task.id} className="hover:bg-neutral-700 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-white">{task.title}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-[#ccc]">
                    {task.courseName}
                  </td>
                  <td className="px-6 py-4 whitespace-normal max-w-xs">
                    <div className="text-sm text-[#ccc] line-clamp-2">{task.description}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusColors[task.status]}`}>
                      {STATUS_LABELS[task.status]}
                    </span>
                    {isOverdue(task) && (
                      <span className="ml-2 px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-[#F7374F] text-red-100">
                        Overdue
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${priorityColors[task.priority]}`}>
                      {PRIORITY_LABELS[task.priority]}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-[#ccc]">
                    {formatDate(task.startDate)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-[#ccc]">
                    {formatDate(task.dueDate)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex justify-between items-center">
        <div className="text-sm text-[#ccc]">
          Showing <span className="font-medium">1</span> to <span className="font-medium">{tasks.length}</span> of{' '}
          <span className="font-medium">{tasks.length}</span> results
        </div>
      </div>
    </div>
  );
}