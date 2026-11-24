import { Priority, PRIORITY_LABELS, TaskCardProps, TaskFormData, TaskType } from '@/lib/types';
import { formatDate, isOverdue, parseDate } from '@/lib/utils';
import {
  CalendarDays,
  CheckCircle2,
  Clock,
  GraduationCap,
  Pencil,
  Trash2,
} from 'lucide-react';
import { differenceInCalendarDays, startOfToday } from 'date-fns';
import { useEffect, useRef, useState } from 'react';
import { useDrag } from 'react-dnd';
import AddForm from '../AddForm';

const PRIORITY_STYLES: Record<Priority, { pill: string }> = {
  HIGH: { pill: 'bg-red-400 text-white' },
  MEDIUM: { pill: 'bg-amber-300 text-black' },
  LOW: { pill: 'bg-emerald-400 text-black' },
};

// "Due today", "Due in 3 days", "2 days overdue", or "Done".
function dueLabel(task: TaskType): { text: string; className: string; icon: 'clock' | 'done' } {
  if (task.status === 'DONE') {
    return { text: 'Done', className: 'text-emerald-300 bg-emerald-400/10', icon: 'done' };
  }
  const days = differenceInCalendarDays(parseDate(task.dueDate), startOfToday());
  if (days < 0) {
    const n = -days;
    return {
      text: `${n} day${n === 1 ? '' : 's'} overdue`,
      className: 'text-red-300 bg-red-400/15',
      icon: 'clock',
    };
  }
  if (days === 0) return { text: 'Due today', className: 'text-amber-200 bg-amber-300/15', icon: 'clock' };
  if (days <= 3) {
    return {
      text: `Due in ${days} day${days === 1 ? '' : 's'}`,
      className: 'text-amber-200 bg-amber-300/10',
      icon: 'clock',
    };
  }
  return { text: `Due in ${days} days`, className: 'text-white/60 bg-white/5', icon: 'clock' };
}

const TaskCard = ({ task, course, handleDelete, onPress }: TaskCardProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const [{ isDragging }, drag] = useDrag({
    type: 'task',
    item: { id: task.id },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  useEffect(() => {
    if (ref.current) {
      drag(ref);
    }
  }, [ref, drag]);

  const [showForm, setShowForm] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const initialData: TaskFormData = {
    courseId: task.courseId,
    title: task.title,
    description: task.description || '',
    startDate: parseDate(task.startDate),
    dueDate: parseDate(task.dueDate),
    priority: task.priority,
  };

  const handleFormUpdate = (formData: TaskFormData) => onPress(task.id, formData);

  const onConfirmDelete = async () => {
    if (deleting) return;
    setDeleting(true);
    try {
      await handleDelete(task.id);
      setConfirmDelete(false);
    } finally {
      setDeleting(false);
    }
  };

  const done = task.status === 'DONE';
  const overdue = isOverdue(task);
  const priority = PRIORITY_STYLES[task.priority];
  const due = dueLabel(task);
  const courseCode = course?.code ?? task.courseName;

  return (
    <>
      <div
        ref={ref}
        className={`group relative my-3 cursor-grab overflow-hidden rounded-2xl border bg-gradient-to-b from-neutral-800 to-[#1f1f1f] p-5 text-white transition-all duration-200 hover:-translate-y-0.5 active:cursor-grabbing ${
          overdue ? 'border-red-400/40' : 'border-neutral-700/80'
        } ${isDragging ? 'opacity-40 rotate-1' : 'opacity-100'}`}>
        <div className="flex items-start justify-between gap-3">
          <span className="inline-block rounded-md border border-neutral-600 px-2 py-0.5 font-mono text-xs tracking-wide text-blue-primary">
            {courseCode}
          </span>

          <div className="flex shrink-0 gap-1 opacity-70 transition-opacity group-hover:opacity-100">
            <button
              type="button"
              aria-label={`Edit ${task.title}`}
              onClick={(e) => {
                e.stopPropagation();
                setShowForm(true);
              }}
              className="rounded-md p-2 text-neutral-300 hover:bg-neutral-700 hover:text-white">
              <Pencil className="h-4 w-4" strokeWidth={1.75} />
            </button>
            <button
              type="button"
              aria-label={`Delete ${task.title}`}
              onClick={(e) => {
                e.stopPropagation();
                setConfirmDelete(true);
              }}
              className="rounded-md p-2 text-neutral-300 hover:bg-red-950/60 hover:text-red-300">
              <Trash2 className="h-4 w-4" strokeWidth={1.75} />
            </button>
          </div>
        </div>

        <h5
          className={`mt-3 text-[15px] font-semibold leading-snug line-clamp-2 ${
            done ? 'text-white/50 line-through decoration-white/30' : 'text-white'
          }`}>
          {task.title}
        </h5>

        <p className="mt-1 truncate text-xs text-white/50">{task.courseName}</p>
        {course?.instructor && (
          <p className="mt-1 flex items-center gap-1.5 text-xs text-white/40">
            <GraduationCap size={13} className="shrink-0" />
            <span className="truncate">{course.instructor}</span>
          </p>
        )}

        {task.description && (
          <p className="mt-3 text-[12px] leading-relaxed text-white/60 line-clamp-3">{task.description}</p>
        )}

        <p className="mt-4 flex items-center gap-1.5 text-[11px] text-white/45">
          <CalendarDays size={12} />
          {formatDate(task.startDate)} → {formatDate(task.dueDate)}
        </p>

        <div className="mt-4 flex items-center justify-between gap-2">
          <span
            className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] font-medium ${due.className}`}>
            {due.icon === 'done' ? <CheckCircle2 size={12} /> : <Clock size={12} />}
            {due.text}
          </span>

          <span
            className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] font-medium ${priority.pill}`}>
            {PRIORITY_LABELS[task.priority]}
          </span>
        </div>
      </div>

      {showForm && (
        <>
          <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm" />
          <AddForm
            initialData={initialData}
            editMode={true}
            courseName={course ? `${course.code} · ${course.name}` : task.courseName}
            onSubmitForm={handleFormUpdate}
            closeForm={() => setShowForm(false)}
          />
        </>
      )}

      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-neutral-700 bg-neutral-800 p-6 text-white shadow-xl">
            <h2 className="text-lg font-semibold">Delete task?</h2>
            <p className="mt-2 text-sm text-neutral-400">
              This removes <span className="text-neutral-200">{task.title}</span>
              {course?.code ? (
                <>
                  {' '}
                  in{' '}
                  <span className="inline-block rounded-md border border-neutral-600 px-1.5 py-0.5 font-mono text-[11px] tracking-wide text-blue-primary">
                    {course.code}
                  </span>
                </>
              ) : null}
              .
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setConfirmDelete(false)}
                className="rounded-lg px-4 py-2.5 text-sm text-neutral-300 hover:text-white">
                Cancel
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={onConfirmDelete}
                className="rounded-lg bg-red-600 px-5 py-2.5 text-sm font-semibold hover:bg-red-500 disabled:opacity-50">
                {deleting ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default TaskCard;
