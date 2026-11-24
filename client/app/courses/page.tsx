'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Alert, Snackbar } from '@mui/material';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import CourseForm from '@/components/CourseForm';
import { Course, CourseFormData } from '@/lib/types';
import {
  createCourse,
  currentUser,
  deleteCourse,
  errorMessage,
  getCourses,
  updateCourse,
} from '@/lib/api';

export default function CoursesPage() {
  const router = useRouter();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Course | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Course | null>(null);
  const [deleting, setDeleting] = useState(false);

  const closeForm = useCallback(() => {
    setShowForm(false);
    setEditing(null);
  }, []);

  useEffect(() => {
    const user = currentUser();
    if (!user || user.role !== 'ADMIN') {
      router.replace('/');
      return;
    }

    getCourses()
      .then(setCourses)
      .catch((e) => setError(errorMessage(e)))
      .finally(() => setLoading(false));
  }, [router]);

  const handleCreate = async (form: CourseFormData) => {
    const created = await createCourse(form);
    setCourses((prev) => [...prev, created].sort((a, b) => a.code.localeCompare(b.code)));
  };

  const handleUpdate = async (form: CourseFormData) => {
    if (!editing) return;
    const updated = await updateCourse(editing.id, form);
    setCourses((prev) =>
      prev.map((c) => (c.id === updated.id ? updated : c)).sort((a, b) => a.code.localeCompare(b.code))
    );
  };

  const handleDelete = async () => {
    if (!confirmDelete || deleting) return;
    setDeleting(true);
    try {
      await deleteCourse(confirmDelete.id);
      setCourses((prev) => prev.filter((c) => c.id !== confirmDelete.id));
      setConfirmDelete(null);
    } catch (e) {
      setError(errorMessage(e));
      setConfirmDelete(null);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="relative flex h-full flex-col gap-6 overflow-y-auto px-2 md:px-4">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-white">Courses</h1>
          <p className="mt-1 text-sm text-neutral-400">
            Manage the catalogue students attach their tasks to.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setEditing(null);
            setShowForm(true);
          }}
          className="flex shrink-0 items-center justify-center gap-2 rounded-lg bg-blue-primary px-4 py-1.5 text-white hover:bg-blue-primary/40">
          <Plus size={18} />
          <span className="text-md font-semibold">New Course</span>
        </button>
      </div>

      {loading ? (
        <p className="text-neutral-400">Loading courses…</p>
      ) : courses.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-neutral-700 px-6 py-16 text-center">
          <p className="text-neutral-300">No courses yet</p>
          <p className="mt-1 text-sm text-neutral-500">Create the first course with the + button.</p>
        </div>
      ) : (
        <ul className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {courses.map((course) => (
            <li
              key={course.id}
              className="group flex flex-col gap-4 rounded-2xl border border-neutral-700 bg-neutral-800/60 px-5 py-4 transition-colors hover:border-neutral-500">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <span className="inline-block rounded-md border border-neutral-600 px-2 py-0.5 font-mono text-xs tracking-wide text-blue-primary">
                    {course.code}
                  </span>
                  <h2 className="mt-2 truncate text-base font-medium text-white">{course.name}</h2>
                  <p className="mt-1 truncate text-sm text-neutral-400">{course.instructor}</p>
                </div>
                <div className="flex shrink-0 gap-1 opacity-70 transition-opacity group-hover:opacity-100">
                  <button
                    type="button"
                    aria-label={`Edit ${course.code}`}
                    onClick={() => {
                      setEditing(course);
                      setShowForm(true);
                    }}
                    className="rounded-md p-2 text-neutral-300 hover:bg-neutral-700 hover:text-white">
                    <Pencil className="h-4 w-4" strokeWidth={1.75} />
                  </button>
                  <button
                    type="button"
                    aria-label={`Delete ${course.code}`}
                    onClick={() => setConfirmDelete(course)}
                    className="rounded-md p-2 text-neutral-300 hover:bg-red-950/60 hover:text-red-300">
                    <Trash2 className="h-4 w-4" strokeWidth={1.75} />
                  </button>
                </div>
              </div>

              <div className="mt-auto flex gap-4 border-t border-neutral-700/80 pt-3 text-xs text-neutral-400">
                <span>
                  <span className="text-neutral-200">{course.credits}</span> credits
                </span>
                <span>
                  open limit <span className="text-neutral-200">{course.taskLimit}</span>
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}

      {showForm && (
        <>
          <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm" />
          <CourseForm
            key={editing?.id ?? 'new'}
            initial={editing}
            onSubmitForm={editing ? handleUpdate : handleCreate}
            closeForm={closeForm}
          />
        </>
      )}

      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-neutral-700 bg-neutral-800 p-6 text-white shadow-xl">
            <h2 className="text-lg font-semibold">Delete {confirmDelete.code}?</h2>
            <p className="mt-2 text-sm text-neutral-400">
              This removes <span className="text-neutral-200">{confirmDelete.name}</span>. Courses that
              still have tasks cannot be deleted.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setConfirmDelete(null)}
                className="rounded-lg px-4 py-2.5 text-sm text-neutral-300 hover:text-white">
                Cancel
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={handleDelete}
                className="rounded-lg bg-red-600 px-5 py-2.5 text-sm font-semibold hover:bg-red-500 disabled:opacity-50">
                {deleting ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      <Snackbar
        open={error !== null}
        autoHideDuration={6000}
        onClose={() => setError(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert severity="error" onClose={() => setError(null)} variant="filled">
          {error}
        </Alert>
      </Snackbar>
    </div>
  );
}
