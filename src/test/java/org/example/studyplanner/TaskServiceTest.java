package org.example.studyplanner;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

class TaskServiceTest {

    private TaskRepository taskRepository;
    private CourseRepository courseRepository;
    private AppUserRepository userRepository;
    private TaskService service;

    private final Course asp = new Course("ASP101", "Advanced Server Programming", 3, "Professor Lee", 3);
    private final AppUser sura = new AppUser("sura", "hash", "USER");
    private final AppUser kenny = new AppUser("kenny", "hash", "USER");

    private static final LocalDate DEC_1 = LocalDate.of(2026, 12, 1);
    private static final LocalDate DEC_5 = LocalDate.of(2026, 12, 5);

    @BeforeEach
    void setUp() {
        taskRepository = mock(TaskRepository.class);
        courseRepository = mock(CourseRepository.class);
        userRepository = mock(AppUserRepository.class);
        service = new TaskService(taskRepository, courseRepository, userRepository);
    }

    private TaskCreateRequest createRequest(LocalDate start, LocalDate due) {
        return new TaskCreateRequest("Lab G", "Docker", Priority.HIGH, start, due);
    }

    private TaskUpdateRequest updateRequest(TaskStatus status) {
        return new TaskUpdateRequest("Lab G", "Docker", Priority.LOW, status, DEC_1, DEC_5);
    }

    @Test
    void create_belowLimit_savesTodoTaskOwnedByLogin() {
        when(courseRepository.findById(1L)).thenReturn(Optional.of(asp));
        when(taskRepository.countOpen(1L, "sura", TaskStatus.DONE)).thenReturn(2L);
        when(userRepository.findByUsername("sura")).thenReturn(Optional.of(sura));
        when(taskRepository.save(any(Task.class))).thenAnswer(call -> call.getArgument(0));

        Task task = service.create(1L, "sura", createRequest(DEC_1, DEC_5));

        assertEquals(TaskStatus.TODO, task.getStatus());
        assertEquals("sura", task.getOwner().getUsername());
        assertEquals("ASP101", task.getCourse().getCode());
    }

    @Test
    void create_ruleA_atLimit_throwsConflict() {
        when(courseRepository.findById(1L)).thenReturn(Optional.of(asp));
        when(taskRepository.countOpen(1L, "sura", TaskStatus.DONE)).thenReturn(3L);

        ConflictException e = assertThrows(ConflictException.class,
                () -> service.create(1L, "sura", createRequest(DEC_1, DEC_5)));

        assertEquals("you already have 3 open tasks in course 1 (limit 3)", e.getMessage());
        verify(taskRepository, never()).save(any());
    }

    @Test
    void create_ruleB_startAfterDue_throwsBeforeTouchingTheDatabase() {
        IllegalArgumentException e = assertThrows(IllegalArgumentException.class,
                () -> service.create(1L, "sura", createRequest(DEC_5, DEC_1)));

        assertEquals("startDate must be on or before dueDate", e.getMessage());
        verifyNoInteractions(courseRepository, taskRepository, userRepository);
    }

    @Test
    void create_sameStartAndDueDate_isAllowed() {
        when(courseRepository.findById(1L)).thenReturn(Optional.of(asp));
        when(taskRepository.countOpen(1L, "sura", TaskStatus.DONE)).thenReturn(0L);
        when(userRepository.findByUsername("sura")).thenReturn(Optional.of(sura));
        when(taskRepository.save(any(Task.class))).thenAnswer(call -> call.getArgument(0));

        Task task = service.create(1L, "sura", createRequest(DEC_1, DEC_1));

        assertEquals(DEC_1, task.getDueDate());
    }

    @Test
    void create_unknownCourse_throwsNotFound() {
        when(courseRepository.findById(99L)).thenReturn(Optional.empty());

        NotFoundException e = assertThrows(NotFoundException.class,
                () -> service.create(99L, "sura", createRequest(DEC_1, DEC_5)));

        assertEquals("course 99 not found", e.getMessage());
    }

    @Test
    void update_ruleC_notTheOwner_throwsForbidden() {
        Task kennysTask = new Task(asp, kenny, "Lab E", null, Priority.MEDIUM, DEC_1, DEC_5);
        when(taskRepository.findDetailed(6L)).thenReturn(Optional.of(kennysTask));

        ForbiddenException e = assertThrows(ForbiddenException.class,
                () -> service.update(6L, "sura", updateRequest(TaskStatus.DOING)));

        assertEquals("task 6 belongs to another user", e.getMessage());
        assertEquals(TaskStatus.TODO, kennysTask.getStatus());          // nothing changed
    }

    @Test
    void update_ruleA_doneTaskReopenedAtLimit_throwsConflict() {
        Task doneTask = new Task(asp, sura, "Midterm revision", null, Priority.LOW, DEC_1, DEC_5);
        doneTask.update("Midterm revision", null, Priority.LOW, TaskStatus.DONE, DEC_1, DEC_5);
        when(taskRepository.findDetailed(4L)).thenReturn(Optional.of(doneTask));
        when(taskRepository.countOpen(any(), eq("sura"), eq(TaskStatus.DONE))).thenReturn(3L);

        assertThrows(ConflictException.class,
                () -> service.update(4L, "sura", updateRequest(TaskStatus.TODO)));

        assertEquals(TaskStatus.DONE, doneTask.getStatus());          // still DONE
    }

    @Test
    void update_owner_changesTheTaskWithoutCountingAgain() {
        Task surasTask = new Task(asp, sura, "Lab F", null, Priority.HIGH, DEC_1, DEC_5);
        when(taskRepository.findDetailed(1L)).thenReturn(Optional.of(surasTask));

        Task updated = service.update(1L, "sura", updateRequest(TaskStatus.DOING));

        assertEquals(TaskStatus.DOING, updated.getStatus());
        assertEquals(Priority.LOW, updated.getPriority());
        verify(taskRepository, never()).countOpen(any(), any(), any());   // open -> open
    }

    @Test
    void delete_admin_mayDeleteAnotherUsersTask() {
        Task kennysTask = new Task(asp, kenny, "Lab E", null, Priority.MEDIUM, DEC_1, DEC_5);
        when(taskRepository.findDetailed(6L)).thenReturn(Optional.of(kennysTask));

        service.delete(6L, "admin", true);

        verify(taskRepository).delete(kennysTask);
    }

    @Test
    void delete_otherUser_throwsForbidden() {
        Task kennysTask = new Task(asp, kenny, "Lab E", null, Priority.MEDIUM, DEC_1, DEC_5);
        when(taskRepository.findDetailed(6L)).thenReturn(Optional.of(kennysTask));

        assertThrows(ForbiddenException.class, () -> service.delete(6L, "sura", false));

        verify(taskRepository, never()).delete(any());
    }
}