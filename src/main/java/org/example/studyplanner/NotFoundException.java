package org.example.studyplanner;

// Answers 404.
public class NotFoundException extends RuntimeException {
    public NotFoundException(String message) {
        super(message);
    }
}