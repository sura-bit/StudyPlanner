package org.example.studyplanner;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

public record TaskCreateRequest(
        @NotBlank(message = "title is required")
        @Size(max = 100, message = "title must be at most 100 characters")
        String title,

        @Size(max = 500, message = "description must be at most 500 characters")
        String description,

        @NotNull(message = "priority is required")
        Priority priority,

        @NotNull(message = "startDate is required")
        LocalDate startDate,

        @NotNull(message = "dueDate is required")
        LocalDate dueDate) {
}