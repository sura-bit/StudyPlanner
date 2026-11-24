package org.example.studyplanner;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record CourseRequest(
        @NotBlank(message = "code is required")
        @Pattern(regexp = "[A-Z0-9]{2,20}", message = "code must be 2 to 20 capital letters or digits")
        String code,

        @NotBlank(message = "name is required")
        @Size(max = 100, message = "name must be at most 100 characters")
        String name,

        @NotNull(message = "taskLimit is required")
        @Min(value = 1, message = "taskLimit must be between 1 and 20")
        @Max(value = 20, message = "taskLimit must be between 1 and 20")
        Integer taskLimit,

        @NotBlank(message = "instructor is required")
        @Size(max = 100, message = "instructor must be at most 100 characters")
        String instructor,

        @NotNull(message = "credits is required")
        @Min(value = 1, message = "credits must be between 1 and 6")
        @Max(value = 6, message = "credits must be between 1 and 6")
        Integer credits) {
}