import axios from "axios";
import {
  ApiError,
  Course,
  CourseFormData,
  TaskFormData,
  TaskStatus,
  TaskType,
  TokenResponse,
} from "./types";
import { toApiDate } from "./utils";

const TOKEN_KEY = "accessToken";

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080",
});

// ---- token storage -------------------------------------------------------

export const getToken = (): string | null =>
  typeof window === "undefined" ? null : localStorage.getItem(TOKEN_KEY);

export const setToken = (token: string) => localStorage.setItem(TOKEN_KEY, token);

export const clearToken = () => localStorage.removeItem(TOKEN_KEY);

// Reads the JWT payload: sub is the username, role is USER or ADMIN.
export function currentUser(): { username: string; role: string } | null {
  const token = getToken();
  if (!token) return null;
  try {
    const payload = JSON.parse(atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
    if (payload.exp && payload.exp * 1000 < Date.now()) return null;
    return { username: payload.sub, role: payload.role };
  } catch {
    return null;
  }
}

api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// A 401 on anything but login means the token is missing or expired: go back to the login page.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const url: string = error.config?.url ?? "";
    if (error.response?.status === 401 && !url.startsWith("/api/auth/")) {
      clearToken();
      if (typeof window !== "undefined" && window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

// Turns any failure into the message to show: the ApiError message plus any field errors.
export function errorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const body = error.response?.data as ApiError | undefined;
    if (body?.message) {
      const fields = body.fieldErrors?.map((f) => `${f.field}: ${f.message}`).join(", ");
      return fields ? `${body.message} (${fields})` : body.message;
    }
    if (!error.response) return "Cannot reach the server. Is the Spring app running?";
  }
  return "Something went wrong";
}

// ---- auth (A1, A2) -------------------------------------------------------

export async function login(username: string, password: string): Promise<void> {
  const { data } = await api.post<TokenResponse>("/api/auth/login", { username, password });
  setToken(data.accessToken);
}

export async function signup(username: string, password: string): Promise<void> {
  await api.post("/api/auth/signup", { username, password });
}

// ---- courses (P1, P2, P4, P5) ---------------------------------------------

export async function getCourses(): Promise<Course[]> {
  const { data } = await api.get<Course[]>("/api/courses");
  return data;
}

const courseBody = (form: CourseFormData) => ({
  code: form.code.trim().toUpperCase(),
  name: form.name.trim(),
  taskLimit: form.taskLimit,
  instructor: form.instructor.trim(),
  credits: form.credits,
});

// P1 (admin)
export async function createCourse(form: CourseFormData): Promise<Course> {
  const { data } = await api.post<Course>("/api/courses", courseBody(form));
  return data;
}

// P4 (admin)
export async function updateCourse(id: number, form: CourseFormData): Promise<Course> {
  const { data } = await api.put<Course>(`/api/courses/${id}`, courseBody(form));
  return data;
}

// P5 (admin); 409 when the course still has tasks
export async function deleteCourse(id: number): Promise<void> {
  await api.delete(`/api/courses/${id}`);
}

// ---- tasks (C1, C3, C5, C6) ----------------------------------------------

export async function getMyTasks(): Promise<TaskType[]> {
  const { data } = await api.get<TaskType[]>("/api/tasks/mine");
  return data;
}

const taskBody = (form: TaskFormData) => ({
  title: form.title.trim(),
  description: form.description.trim() || null,
  priority: form.priority,
  startDate: form.startDate ? toApiDate(form.startDate) : null,
  dueDate: form.dueDate ? toApiDate(form.dueDate) : null,
});

export async function createTask(form: TaskFormData): Promise<TaskType> {
  const { data } = await api.post<TaskType>(`/api/courses/${form.courseId}/tasks`, taskBody(form));
  return data;
}

// PUT replaces the whole task, so the status has to be sent along with the other fields.
export async function updateTask(id: number, form: TaskFormData, status: TaskStatus): Promise<TaskType> {
  const { data } = await api.put<TaskType>(`/api/tasks/${id}`, { ...taskBody(form), status });
  return data;
}

// Moving a card only changes the status; the rest is copied from the task as it is.
export async function updateTaskStatus(task: TaskType, status: TaskStatus): Promise<TaskType> {
  const { data } = await api.put<TaskType>(`/api/tasks/${task.id}`, {
    title: task.title,
    description: task.description,
    priority: task.priority,
    startDate: task.startDate,
    dueDate: task.dueDate,
    status,
  });
  return data;
}

export async function deleteTask(id: number): Promise<void> {
  await api.delete(`/api/tasks/${id}`);
}
