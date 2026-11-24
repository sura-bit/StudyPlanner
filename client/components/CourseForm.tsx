'use client';

import React, { useEffect, useRef, useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Course, CourseFormData } from '@/lib/types';
import { errorMessage } from '@/lib/api';

interface CourseFormProps {
  initial?: Course | null;
  onSubmitForm: (formData: CourseFormData) => Promise<void>;
  closeForm: () => void;
}

interface FormErrors {
  code?: string;
  name?: string;
  instructor?: string;
  taskLimit?: string;
  credits?: string;
}

const CODE_PATTERN = /^[A-Z0-9]{2,20}$/;

const fieldClass =
  'w-full rounded-lg border border-neutral-700 bg-neutral-900 px-4 py-3 text-white outline-none focus:border-blue-primary';

function NumberStepper({
  value,
  min,
  max,
  onChange,
}: {
  value: number;
  min: number;
  max: number;
  onChange: (next: number) => void;
}) {
  const dec = () => onChange(Math.max(min, value - 1));
  const inc = () => onChange(Math.min(max, value + 1));

  return (
    <div className="flex items-stretch overflow-hidden rounded-lg border border-neutral-700 bg-neutral-900">
      <div className="flex min-w-0 flex-1 items-center px-4 py-3">
        <span className="tabular-nums text-white">{value}</span>
      </div>
      <div className="flex w-9 flex-col border-l border-neutral-700">
        <button
          type="button"
          aria-label="Increase"
          disabled={value >= max}
          onClick={inc}
          className="flex flex-1 items-center justify-center text-neutral-400 transition-colors hover:bg-neutral-800 hover:text-white disabled:cursor-not-allowed disabled:opacity-30">
          <ChevronUp className="h-3 w-3" strokeWidth={2.25} />
        </button>
        <button
          type="button"
          aria-label="Decrease"
          disabled={value <= min}
          onClick={dec}
          className="flex flex-1 items-center justify-center border-t border-neutral-700 text-neutral-400 transition-colors hover:bg-neutral-800 hover:text-white disabled:cursor-not-allowed disabled:opacity-30">
          <ChevronDown className="h-3 w-3" strokeWidth={2.25} />
        </button>
      </div>
    </div>
  );
}

export default function CourseForm({ initial, onSubmitForm, closeForm }: CourseFormProps) {
  const editMode = !!initial;
  const [code, setCode] = useState(initial?.code ?? '');
  const [name, setName] = useState(initial?.name ?? '');
  const [instructor, setInstructor] = useState(initial?.instructor ?? '');
  const [taskLimit, setTaskLimit] = useState(initial?.taskLimit ?? 3);
  const [credits, setCredits] = useState(initial?.credits ?? 3);
  const [errors, setErrors] = useState<FormErrors>({});
  const [alert, setAlert] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (formRef.current && !formRef.current.contains(event.target as Node)) {
        closeForm();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [closeForm]);

  const validate = (): boolean => {
    const next: FormErrors = {};
    const trimmedCode = code.trim().toUpperCase();

    if (!trimmedCode) next.code = 'code is required';
    else if (!CODE_PATTERN.test(trimmedCode)) {
      next.code = 'code must be 2 to 20 capital letters or digits';
    }

    if (!name.trim()) next.name = 'name is required';
    else if (name.trim().length > 100) next.name = 'name must be at most 100 characters';

    if (!instructor.trim()) next.instructor = 'instructor is required';
    else if (instructor.trim().length > 100) {
      next.instructor = 'instructor must be at most 100 characters';
    }

    if (!Number.isInteger(taskLimit) || taskLimit < 1 || taskLimit > 20) {
      next.taskLimit = 'taskLimit must be between 1 and 20';
    }

    if (!Number.isInteger(credits) || credits < 1 || credits > 6) {
      next.credits = 'credits must be between 1 and 6';
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate() || submitting) return;

    setSubmitting(true);
    setAlert(null);
    try {
      await onSubmitForm({
        code: code.trim().toUpperCase(),
        name: name.trim(),
        instructor: instructor.trim(),
        taskLimit,
        credits,
      });
      closeForm();
    } catch (error) {
      setAlert(errorMessage(error));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form
      ref={formRef}
      onSubmit={handleSubmit}
      className="absolute left-1/2 top-16 z-50 w-full max-w-lg -translate-x-1/2 rounded-2xl border border-neutral-700 bg-neutral-800 p-6 text-white shadow-xl">
      <div className="mb-5">
        <h2 className="text-lg font-semibold">{editMode ? 'Edit course' : 'New course'}</h2>
        <p className="mt-1 text-sm text-neutral-400">
          {editMode ? 'Update the course details.' : 'Add a course students can attach tasks to.'}
        </p>
      </div>

      {alert && (
        <p className="mb-4 rounded-md bg-red-900/40 px-3 py-2 text-sm text-red-200">{alert}</p>
      )}

      <div className="flex flex-col gap-4">
        <label className="flex flex-col gap-1.5">
          <span className="text-xs uppercase tracking-wide text-neutral-400">Code</span>
          <input
            className={fieldClass}
            value={code}
            onChange={(e) => {
              setCode(e.target.value.toUpperCase());
              if (errors.code) setErrors({ ...errors, code: undefined });
            }}
            placeholder="ASP101"
            maxLength={20}
            autoComplete="off"
          />
          {errors.code && <span className="text-xs text-red-400">{errors.code}</span>}
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-xs uppercase tracking-wide text-neutral-400">Name</span>
          <input
            className={fieldClass}
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (errors.name) setErrors({ ...errors, name: undefined });
            }}
            placeholder="Advanced Server Programming"
            maxLength={100}
          />
          {errors.name && <span className="text-xs text-red-400">{errors.name}</span>}
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-xs uppercase tracking-wide text-neutral-400">Instructor</span>
          <input
            className={fieldClass}
            value={instructor}
            onChange={(e) => {
              setInstructor(e.target.value);
              if (errors.instructor) setErrors({ ...errors, instructor: undefined });
            }}
            placeholder="Professor Lee"
            maxLength={100}
          />
          {errors.instructor && <span className="text-xs text-red-400">{errors.instructor}</span>}
        </label>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <span className="text-xs uppercase tracking-wide text-neutral-400">Task limit</span>
            <NumberStepper
              value={taskLimit}
              min={1}
              max={20}
              onChange={(next) => {
                setTaskLimit(next);
                if (errors.taskLimit) setErrors({ ...errors, taskLimit: undefined });
              }}
            />
            {errors.taskLimit && <span className="text-xs text-red-400">{errors.taskLimit}</span>}
          </div>

          <div className="flex flex-col gap-1.5">
            <span className="text-xs uppercase tracking-wide text-neutral-400">Credits</span>
            <NumberStepper
              value={credits}
              min={1}
              max={6}
              onChange={(next) => {
                setCredits(next);
                if (errors.credits) setErrors({ ...errors, credits: undefined });
              }}
            />
            {errors.credits && <span className="text-xs text-red-400">{errors.credits}</span>}
          </div>
        </div>

        <div className="mt-2 flex justify-end gap-3">
          <button
            type="button"
            onClick={closeForm}
            className="rounded-lg px-4 py-2.5 text-sm text-neutral-300 hover:text-white">
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="rounded-lg bg-blue-primary px-5 py-2.5 text-sm font-semibold hover:bg-blue-primary/70 disabled:opacity-50">
            {submitting ? 'Saving' : editMode ? 'Save' : 'Create'}
          </button>
        </div>
      </div>
    </form>
  );
}
