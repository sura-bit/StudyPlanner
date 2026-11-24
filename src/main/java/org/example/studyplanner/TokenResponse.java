package org.example.studyplanner;

public record TokenResponse(String accessToken, String tokenType, long expiresIn) {
}