import { PRIORITY_LABELS, TaskCardProps, TaskFormData } from '@/lib/types';
import { formatDate, isOverdue, parseDate } from '@/lib/utils';
import { Ellipsis, Flag } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useDrag } from 'react-dnd';
import { motion, AnimatePresence } from 'framer-motion';
import AddForm from '../AddForm';

const TaskCard = ({ task, handleDelete, onPress }: TaskCardProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const dropRef = useRef<HTMLDivElement>(null);
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

  const deleteTask = () => {
    handleDelete(task.id);
  };

  const [showMenu, setShowMenu] = useState(false);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropRef.current && !dropRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const initialData: TaskFormData = {
    courseId: task.courseId,
    title: task.title,
    description: task.description || '',
    startDate: parseDate(task.startDate),
    dueDate: parseDate(task.dueDate),
    priority: task.priority,
  };

  const handleFormUpdate = (formData: TaskFormData) => onPress(task.id, formData);

  if (showForm) {
    return (
      <>
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50" />

        <AddForm
          initialData={initialData}
          editMode={true}
          courseName={task.courseName}
          onSubmitForm={handleFormUpdate}
          closeForm={() => setShowForm(false)}
        />
      </>
    );
  }

  return (
    <div
      className={`my-3 p-5 bg-neutral-800 text-white rounded-2xl border border-neutral-700 ${
        isDragging ? 'opacity-50' : 'opacity-100'
      }`} ref={ref}>
      <div className="flex justify-between">
        <h5 className="text-[15px] font-bold line-clamp-2 w-[80%]">
          {task.title}
        </h5>
        <div
          className="cursor-pointer relative"
          onClick={() => setShowMenu((prev) => !prev)}
          ref={dropRef}>
          <Ellipsis />
          <AnimatePresence>
            {showMenu && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="absolute right-0 top-6 z-10 w-28 rounded-md py-2 bg-neutral-700/60 backdrop-blur-md border border-white/20 shadow-lg">
                <button
                  className="block w-full text-left px-4 py-2 rounded-md text-sm hover:bg-neutral-800 hover:text-blue-400 transition-colors duration-200"
                  onClick={() => setShowForm(true)}>
                  Edit
                </button>
                <button
                  className="block w-full text-left px-4 py-2 rounded-md text-sm hover:bg-neutral-800 hover:text-red-400 transition-colors duration-200"
                  onClick={deleteTask}>
                  Delete
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
      <p className="mt-2 text-xs text-blue-300">{task.courseName}</p>
      <div className="flex flex-wrap items-center gap-x-2 text-sm text-gray-300 my-4">
        <Flag color="#0275ff" className="mr-2.5" size={18} />
        <p className="text-sm text-gray-300">{formatDate(task.startDate)}</p>
        <span>-</span>
        <p className="text-sm text-gray-300">{formatDate(task.dueDate)}</p>
        {isOverdue(task) && (
          <span className="ml-1 rounded-full bg-[#F7374F] px-2 text-xs text-white">Overdue</span>
        )}
      </div>
      <div className="my-5">
        {task.description && (
          <p className="text-[12px] text-gray-300 line-clamp-4">
            {task.description}
          </p>
        )}
      </div>

      <div
        className={`text-sm text-black py-2 px-5 w-fit rounded-2xl ${
          task.priority === 'HIGH'
            ? 'bg-red-200'
            : task.priority === 'MEDIUM'
            ? 'bg-yellow-200'
            : 'bg-green-200'
        }`}>
        {PRIORITY_LABELS[task.priority]}
      </div>
    </div>
  );
};

export default TaskCard;

