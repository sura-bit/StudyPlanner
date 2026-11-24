package org.example.studyplanner;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
public class TaskService {

    private final TaskRepository taskRepository;
    private final CourseRepository courseRepository;
    private final AppUserRepository userRepository;

    public TaskService(TaskRepository taskRepository, CourseRepository courseRepository,
                       AppUserRepository userRepository) {
        this.taskRepository = taskRepository;
        this.courseRepository = courseRepository;
        this.userRepository = userRepository;
    }

    // C2
    @Transactional(readOnly = true)
    public List<Task> findByCourse(Long courseId) {
        if (!courseRepository.existsById(courseId)) {
            throw new NotFoundException("course " + courseId + " not found");
        }
        return taskRepository.findByCourse(courseId);
    }

    // C3
    @Transactional(readOnly = true)
    public List<Task> findMine(String username) {
        return taskRepository.findMine(username);
    }

    // C1: the owner comes from the login, never from the request body
    @Transactional
    public Task create(Long courseId, String username, TaskCreateRequest request) {
        checkDates(request.startDate(), request.dueDate());                           // Rule B -> 400
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new NotFoundException("course " + courseId + " not found"));  // 404
        checkOpenLimit(courseId, course.getTaskLimit(), username);                     // Rule A -> 409
        AppUser owner = userRepository.findByUsername(username)
                .orElseThrow(() -> new NotFoundException("user " + username + " not found"));
        return taskRepository.save(new Task(course, owner, request.title(), request.description(),
                request.priority(), request.startDate(), request.dueDate()));
    }

    // C4: the owner or an admin
    @Transactional(readOnly = true)
    public Task get(Long id, String username, boolean admin) {
        Task task = find(id);                                                          // 404
        requireOwnerOrAdmin(task, username, admin);                                    // Rule C -> 403
        return task;
    }

    // C5: the owner only (an admin is refused too)
    @Transactional
    public Task update(Long id, String username, TaskUpdateRequest request) {
        checkDates(request.startDate(), request.dueDate());                           // Rule B -> 400
        Task task = find(id);                                                          // 404
        if (!task.isOwnedBy(username)) {                                               // Rule C -> 403
            throw new ForbiddenException("task " + id + " belongs to another user");
        }
        // Rule A again: a DONE task that becomes TODO or DOING is open again
        if (!task.isOpen() && request.status() != TaskStatus.DONE) {
            Course course = task.getCourse();
            checkOpenLimit(course.getId(), course.getTaskLimit(), username);           // 409
        }
        task.update(request.title(), request.description(), request.priority(), request.status(),
                request.startDate(), request.dueDate());
        return task;
    }

    // C6: the owner or an admin
    @Transactional
    public void delete(Long id, String username, boolean admin) {
        Task task = find(id);                                                          // 404
        requireOwnerOrAdmin(task, username, admin);                                    // 403
        taskRepository.delete(task);
    }

    private Task find(Long id) {
        return taskRepository.findDetailed(id)
                .orElseThrow(() -> new NotFoundException("task " + id + " not found"));
    }

    // Rule A
    private void checkOpenLimit(Long courseId, int taskLimit, String username) {
        long open = taskRepository.countOpen(courseId, username, TaskStatus.DONE);
        if (open >= taskLimit) {
            throw new ConflictException("you already have " + open + " open tasks in course "
                    + courseId + " (limit " + taskLimit + ")");
        }
    }

    // Rule B
    private void checkDates(LocalDate startDate, LocalDate dueDate) {
        if (startDate.isAfter(dueDate)) {
            throw new IllegalArgumentException("startDate must be on or before dueDate");
        }
    }

    // Rule C
    private void requireOwnerOrAdmin(Task task, String username, boolean admin) {
        if (!admin && !task.isOwnedBy(username)) {
            throw new ForbiddenException("task " + task.getId() + " belongs to another user");
        }
    }
}