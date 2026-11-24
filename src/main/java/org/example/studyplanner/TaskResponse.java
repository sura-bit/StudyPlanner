package org.example.studyplanner;

import java.time.LocalDate;
import java.time.LocalDateTime;

public record TaskResponse(Long id, Long courseId, String courseName, String ownerUsername,
                           String title, String description, Priority priority, TaskStatus status,
                           LocalDate startDate, LocalDate dueDate, LocalDateTime createdAt) {

    public static TaskResponse from(Task t) {
        return new TaskResponse(t.getId(), t.getCourse().getId(), t.getCourse().getName(),
                t.getOwner().getUsername(), t.getTitle(), t.getDescription(), t.getPriority(),
                t.getStatus(), t.getStartDate(), t.getDueDate(), t.getCreatedAt());
    }
}