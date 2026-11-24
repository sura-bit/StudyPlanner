
'use client';

import React, { useEffect, useRef, useState } from 'react';
import {
  TextField,
  Button,
  Box,
  Stack,
  MenuItem,
  Select,
  InputLabel,
  FormControl,
  AlertColor,
  Collapse,
  Alert,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { Course, PRIORITIES, PRIORITY_LABELS, Priority, TaskFormData } from '@/lib/types';
import { errorMessage, getCourses } from '@/lib/api';

interface AddFormProps {
  // Rejects with the server's error when the API refuses the task; the form then stays open.
  onSubmitForm: (formData: TaskFormData) => Promise<void>;
  initialData?: TaskFormData;
  // In edit mode the course is shown but cannot change (the API has no way to move a task).
  editMode: boolean;
  courseName?: string;
  closeForm: () => void; 
}

interface FormErrors {
  title?: string;
  course?: string;
  description?: string;
  dates?: string;
}


export default function AddForm({ onSubmitForm, initialData, editMode, courseName, closeForm }: AddFormProps) {
  const [courses, setCourses] = useState<Course[]>([]);
  const [courseId, setCourseId] = useState<number | null>(initialData?.courseId ?? null);
  const [submitting, setSubmitting] = useState(false);
  const [title, setTitle] = useState(initialData?.title || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [startDate, setStartDate] = useState<Date | null>(initialData?.startDate || null);
  const [dueDate, setDueDate] = useState<Date | null>(initialData?.dueDate || null);
  const [priority, setPriority] = useState<Priority>(initialData?.priority || 'MEDIUM');
  const [errors, setErrors] = useState<FormErrors>({});
  const [alert, setAlert] = useState<{ show: boolean; message: string; severity: AlertColor }>({
    show: false,
    message: '',
    severity: 'error',
  });


  useEffect(() => {
    if (editMode) return;
    getCourses()
      .then(setCourses)
      .catch((error) => setAlert({ show: true, message: errorMessage(error), severity: 'error' }));
  }, [editMode]);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!title.trim()) {
      newErrors.title = 'Title is required';
    } else if (title.trim().length > 100) {
      newErrors.title = 'Title must be at most 100 characters';
    }

    if (description.length > 500) {
      newErrors.description = 'Description must be at most 500 characters';
    }

    if (!editMode && courseId == null) {
      newErrors.course = 'Choose a course';
    }

    if (!startDate || !dueDate) {
      newErrors.dates = 'Start date and due date are required';
    } else if (startDate > dueDate) {
      newErrors.dates = 'Start date must be on or before the due date';
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      setAlert({
        show: true,
        message: 'Please fix the errors in the form',
        severity: 'error',
      });
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm() || submitting) return;

    setSubmitting(true);
    try {
      await onSubmitForm({ courseId, title, description, startDate, dueDate, priority });
      closeForm();
    } catch (error) {
      // e.g. 409 "you already have 3 open tasks in course 1 (limit 3)"
      setAlert({ show: true, message: errorMessage(error), severity: 'error' });
    } finally {
      setSubmitting(false);
    }
  };


  const formRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const datePickerPopper = document.querySelector('.MuiPopper-root');
      const selectMenu = document.querySelector('.MuiMenu-root');
      const popover = document.querySelector('.MuiPopover-root');
  
      if (
        (datePickerPopper && datePickerPopper.contains(event.target as Node)) ||
        (selectMenu && selectMenu.contains(event.target as Node)) ||
        (popover && popover.contains(event.target as Node))
      ) {
        return;
      }
  
      if (formRef.current && !formRef.current.contains(event.target as Node)) {
        closeForm();
      }
    };
  
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [closeForm]);




  return (
    <div className="absolute left-1/2 top-20 transform -translate-x-1/2 w-full max-w-3xl z-50" ref={formRef}>
      <Box
        component="form"
        onSubmit={handleSubmit}
        sx={{
          p: 3,
          borderRadius: 2,
          backgroundColor: '#1e1e1e',
          color: 'white',
        }}>

          <Collapse in={alert.show}>
          <Alert
            severity={alert.severity}
            onClose={() => setAlert({ ...alert, show: false })}
            sx={{ mb: 2 }}
          >
            {alert.message}
          </Alert>
        </Collapse>


        <Stack spacing={2}>
          {editMode ? (
            <TextField
              label="Course"
              value={courseName ?? ''}
              disabled
              fullWidth
              InputLabelProps={{ style: { color: '#ccc' } }}
              sx={{ '& .MuiInputBase-input.Mui-disabled': { WebkitTextFillColor: '#aaa' }, '& fieldset': { borderColor: '#404040' } }}
            />
          ) : (
            <FormControl fullWidth variant="outlined" error={!!errors.course}>
              <InputLabel id="course-label" sx={{ color: '#ccc' }}>
                Course
              </InputLabel>
              <Select
                labelId="course-label"
                id="course-select"
                value={courseId ?? ''}
                onChange={(e) => {
                  setCourseId(Number(e.target.value));
                  if (errors.course) setErrors({ ...errors, course: undefined });
                }}
                label="Course"
                sx={{
                  color: 'white',
                  '& .MuiSelect-icon': { color: 'white' },
                  '& .MuiOutlinedInput-notchedOutline': { borderColor: '#404040' },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': { border: 0.2, borderColor: '#4c98f5' },
                }}>
                {courses.map((course) => (
                  <MenuItem key={course.id} value={course.id}>
                    {course.code} · {course.name} (max {course.taskLimit} open)
                  </MenuItem>
                ))}
              </Select>
              {errors.course && <p className="text-xs text-red-400 mt-1 ml-3">{errors.course}</p>}
            </FormControl>
          )}

          <TextField
            label="Title"
            variant="outlined"
            fullWidth
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              if (errors.title) setErrors({ ...errors, title: undefined });
            }}
            error={!!errors.title}
            helperText={errors.title}
            InputLabelProps={{ style: { color: '#ccc' } }}
            InputProps={{ style: { color: 'white' } }}
            style={{ border: 1, borderColor: '#404040' }}
            sx={{
              '& .MuiOutlinedInput-root': {
                '& fieldset': {
                  borderColor: '#404040',
                },
               
                '&.Mui-focused fieldset': {
                  border: 0.2,
                  borderColor: '#4c98f5',
                },
              },
            }}
          />

          <TextField
            label="Description"
            multiline
            rows={4}
            variant="outlined"
            fullWidth
            value={description}
            onChange={(e) => {
              setDescription(e.target.value);
              if (errors.description) setErrors({ ...errors, description: undefined });
            }}
            error={!!errors.description}
            helperText={errors.description}
            InputLabelProps={{ style: { color: '#ccc' } }}
            InputProps={{ style: { color: 'white' } }}
            sx={{
              '& .MuiOutlinedInput-root': {
                '& fieldset': {
                  borderColor: '#404040',
                },
             
                '&.Mui-focused fieldset': {
                  border: 0.2,
                  borderColor: '#4c98f5',
                },
              },
            }}
          />
          

          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <div className="flex gap-4">
              <DatePicker
                label="Start Date"
                value={startDate}
                onChange={(newValue) => {
                  setStartDate(newValue);
                  if (errors.dates) setErrors({ ...errors, dates: undefined });
                }}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    InputLabelProps: { style: { color: '#ccc' } },
                    InputProps: { style: { color: 'white' } },
                    sx: {
                        '& .MuiSvgIcon-root': {
                          color: '#ccc',
                        },
                        '& fieldset': {
                          borderColor: '#404040',
                        },
                       
                        '&.Mui-focused fieldset': {
                          border: 0.2,
                          borderColor: '#4c98f5',
                        },
                      },
                  },
                }}
              />

              <DatePicker
                label="Due Date"
                value={dueDate}
                onChange={(newValue) => {
                  setDueDate(newValue);
                  if (errors.dates) setErrors({ ...errors, dates: undefined });
                }}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    InputLabelProps: { style: { color: '#ccc' } },
                    InputProps: { style: { color: 'white' } },
                    sx: {
                      '& .MuiSvgIcon-root': {
                        color: '#ccc',
                      },
                      '& fieldset': {
                        borderColor: '#404040',
                      },
                      '&:hover fieldset': {
                        borderColor: '#404040',
                      },
                      '&.Mui-focused fieldset': {
                        border: 0.2,
                        borderColor: '#4c98f5',
                      },
                    },
                  },
                }}
              />
            </div>
          </LocalizationProvider>
          {errors.dates && <p className="text-xs text-red-400 -mt-1 ml-3">{errors.dates}</p>}

          <FormControl fullWidth variant="outlined">
            <InputLabel id="priority-label" sx={{ color: '#ccc' }}>
              Priority
            </InputLabel>
            <Select
              labelId="priority-label"
              id="priority-select"
              value={priority}
              onChange={(e) => setPriority(e.target.value as Priority)}
              label="Priority"
              sx={{
                color: 'white',
                '& .MuiSelect-icon': {
                  color: 'white',
                },
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#404040',
                },
                '&:hover .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#404040',
                },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                  border: 0.2,
                  borderColor: '#4c98f5',
                },
              }}>
              {PRIORITIES.map((p) => (
                <MenuItem key={p} value={p}>
                  {PRIORITY_LABELS[p]}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Button
            type="submit"
            disabled={submitting}
            variant="contained"
            sx={{ mt: 1, backgroundColor: '#1976d2' }}>
              {editMode ? "Update Task" : "Add Task"}
          </Button>
        </Stack>
      </Box>
    </div>
  );
}
