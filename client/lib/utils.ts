import { ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, parseISO, startOfToday } from "date-fns";
import { TaskType } from "./types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// The API sends and expects dates as "yyyy-MM-dd" (LocalDate). parseISO reads them as
// local dates, so they don't shift by a day the way new Date("2026-12-01") (UTC) can.
export const parseDate = (value: string): Date => parseISO(value);

export const toApiDate = (date: Date): string => format(date, "yyyy-MM-dd");

export const formatDate = (value: string): string => format(parseISO(value), "MMM d, yyyy");

// The API has no "expired" status: a task is overdue when it is not DONE and its due date has passed.
export const isOverdue = (task: TaskType): boolean =>
  task.status !== "DONE" && parseISO(task.dueDate) < startOfToday();
