package org.example.studyplanner;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

class CourseServiceTest {

    private CourseRepository courseRepository;
    private TaskRepository taskRepository;
    private CourseService service;

    @BeforeEach
    void setUp() {
        courseRepository = mock(CourseRepository.class);
        taskRepository = mock(TaskRepository.class);
        service = new CourseService(courseRepository, taskRepository);
    }

    private CourseRequest request(String code) {
        return new CourseRequest(code, "Advanced Server Programming", 4, "Professor Lee", 3);
    }

    @Test
    void delete_courseWithTasks_throwsConflict() {
        when(courseRepository.existsById(1L)).thenReturn(true);
        when(taskRepository.existsByCourseId(1L)).thenReturn(true);

        ConflictException e = assertThrows(ConflictException.class, () -> service.delete(1L));

        assertEquals("course 1 has tasks", e.getMessage());
        verify(courseRepository, never()).deleteById(any());
    }

    @Test
    void delete_courseWithoutTasks_deletesIt() {
        when(courseRepository.existsById(3L)).thenReturn(true);
        when(taskRepository.existsByCourseId(3L)).thenReturn(false);

        service.delete(3L);

        verify(courseRepository).deleteById(3L);
    }

    @Test
    void create_takenCode_throwsConflict() {
        when(courseRepository.existsByCode("ASP101")).thenReturn(true);

        ConflictException e = assertThrows(ConflictException.class, () -> service.create(request("ASP101")));

        assertEquals("course code ASP101 is taken", e.getMessage());
        verify(courseRepository, never()).save(any());
    }

    @Test
    void update_courseKeepsItsOwnCode_isAllowed() {
        Course asp = new Course("ASP101", "Old name", 3, "Professor Lee", 3);
        when(courseRepository.findById(1L)).thenReturn(Optional.of(asp));
        when(courseRepository.existsByCodeAndIdNot("ASP101", 1L)).thenReturn(false);

        Course updated = service.update(1L, request("ASP101"));

        assertEquals("Advanced Server Programming", updated.getName());
        assertEquals(4, updated.getTaskLimit());
    }

    @Test
    void search_minTaskLimitBelowOne_throwsBadRequest() {
        IllegalArgumentException e = assertThrows(IllegalArgumentException.class, () -> service.search(0));

        assertEquals("minTaskLimit must be at least 1", e.getMessage());
        verifyNoInteractions(courseRepository);
    }
}