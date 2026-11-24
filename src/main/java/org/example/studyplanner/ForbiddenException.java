package org.example.studyplanner;

// Answers 403, not owner.
public class ForbiddenException extends RuntimeException {
    public ForbiddenException(String message) {
        super(message);
    }
}