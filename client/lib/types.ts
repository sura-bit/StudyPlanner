// Shapes of the Spring Boot API (see README "API" and the *Response / *Request records).

export type TaskStatus = 'TODO' | 'DOING' | 'DONE';
export type Priority = 'LOW' | 'MEDIUM' | 'HIGH';

export const STATUSES: TaskStatus[] = ['TODO', 'DOING', 'DONE'];
export const PRIORITIES: Priority[] = ['LOW', 'MEDIUM', 'HIGH'];

export const STATUS_LABELS: Record<TaskStatus, string> = {
  TODO: 'Todo',
  DOING: 'Doing',
  DONE: 'Done',
};

export const PRIORITY_LABELS: Record<Priority, string> = {
  LOW: 'Low',
  MEDIUM: 'Medium',
  HIGH: 'High',
};

// TaskResponse
export interface TaskType {
  id: number;
  courseId: number;
  courseName: string;
  ownerUsername: string;
  title: string;
  description: string | null;
  priority: Priority;
  status: TaskStatus;
  startDate: string; // yyyy-MM-dd
  dueDate: string; // yyyy-MM-dd
  createdAt: string; // ISO date-time
}

// CourseResponse
export interface Course {
  id: number;
  code: string;
  name: string;
  taskLimit: number;
  instructor: string;
  credits: number;
}

// CourseRequest body for P1 / P4
export interface CourseFormData {
  code: string;
  name: string;
  taskLimit: number;
  instructor: string;
  credits: number;
}

// TokenResponse
export interface TokenResponse {
  accessToken: string;
  tokenType: string;
  expiresIn: number;
}

// ApiError
export interface ApiError {
  status: number;
  error: string;
  message: string;
  path: string;
  fieldErrors: { field: string; message: string }[] | null;
}

// What the task form produces. courseId is only used on create (C1).
export interface TaskFormData {
  courseId: number | null;
  title: string;
  description: string;
  startDate: Date | null;
  dueDate: Date | null;
  priority: Priority;
}

export type TaskColumnProps = {
  status: TaskStatus;
  tasks: TaskType[];
  colors: string;
  courses: Record<number, Course>;
  moveTask: (taskId: number, toStatus: TaskStatus) => void;
  handleDelete: (taskId: number) => void;
  onPress: (taskId: number, formData: TaskFormData) => Promise<void>;
};

export type TaskCardProps = {
  task: TaskType;
  course?: Course; // code and instructor; TaskResponse only carries courseName
  handleDelete: (taskId: number) => void;
  onPress: (taskId: number, formData: TaskFormData) => Promise<void>;
};
