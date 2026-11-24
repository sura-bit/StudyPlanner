package org.example.studyplanner;

// Answers 409.
public class ConflictException extends RuntimeException {
    public ConflictException(String message) {
        super(message);
    }
}