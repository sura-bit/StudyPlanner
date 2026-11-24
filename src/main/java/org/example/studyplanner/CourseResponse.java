package org.example.studyplanner;

public record CourseResponse(Long id, String code, String name, int taskLimit,
                             String instructor, int credits) {

    public static CourseResponse from(Course c) {
        return new CourseResponse(c.getId(), c.getCode(), c.getName(), c.getTaskLimit(),
                c.getInstructor(), c.getCredits());
    }
}