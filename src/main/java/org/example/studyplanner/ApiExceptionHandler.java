package org.example.studyplanner;

import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.oauth2.server.resource.InvalidBearerTokenException;
import org.springframework.web.ErrorResponse;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;

import java.util.List;

// Turns every exception into one ApiError body. A client mistake never answers 500.
@RestControllerAdvice
public class ApiExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(ApiExceptionHandler.class);

    // 400: Bean Validation failed on a request record
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiError> invalidFields(MethodArgumentNotValidException e,
                                                  HttpServletRequest request) {
        List<ApiError.FieldMessage> fields = e.getBindingResult().getFieldErrors().stream()
                .map(f -> new ApiError.FieldMessage(f.getField(), f.getDefaultMessage()))
                .toList();
        return respond(HttpStatus.BAD_REQUEST, "request has invalid fields", request, fields);
    }

    // 400: a service refused the values (minTaskLimit below 1)
    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ApiError> badRequest(IllegalArgumentException e, HttpServletRequest request) {
        return respond(HttpStatus.BAD_REQUEST, e.getMessage(), request, List.of());
    }

    // 400: no body, broken JSON, a wrong date or an unknown enum value such as "URGENT"
    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<ApiError> unreadableBody(HttpMessageNotReadableException e,
                                                   HttpServletRequest request) {
        return respond(HttpStatus.BAD_REQUEST, "request body is missing or is not valid JSON",
                request, List.of());
    }

    // 400: /api/tasks/abc or ?minTaskLimit=abc
    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ResponseEntity<ApiError> wrongParameterType(MethodArgumentTypeMismatchException e,
                                                       HttpServletRequest request) {
        return respond(HttpStatus.BAD_REQUEST, "'" + e.getName() + "' has the wrong type",
                request, List.of());
    }

    // 401: no login, wrong password, or a bad token
    @ExceptionHandler(AuthenticationException.class)
    public ResponseEntity<ApiError> unauthorized(AuthenticationException e, HttpServletRequest request) {
        String message = "login required";
        if (e instanceof BadCredentialsException) {
            message = "wrong username or password";
        } else if (e instanceof InvalidBearerTokenException) {
            message = "token is invalid or expired";
        }
        return respond(HttpStatus.UNAUTHORIZED, message, request, List.of());
    }

    // 403: thrown by TaskService
    @ExceptionHandler(ForbiddenException.class)
    public ResponseEntity<ApiError> forbidden(ForbiddenException e, HttpServletRequest request) {
        return respond(HttpStatus.FORBIDDEN, e.getMessage(), request, List.of());
    }

    // 403: refused by the URL rules in SecurityConfig
    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ApiError> accessDenied(AccessDeniedException e, HttpServletRequest request) {
        return respond(HttpStatus.FORBIDDEN, "admin role required", request, List.of());
    }

    // 404
    @ExceptionHandler(NotFoundException.class)
    public ResponseEntity<ApiError> notFound(NotFoundException e, HttpServletRequest request) {
        return respond(HttpStatus.NOT_FOUND, e.getMessage(), request, List.of());
    }

    // 409: a taken course code, a course that still has tasks, a taken username
    @ExceptionHandler(ConflictException.class)
    public ResponseEntity<ApiError> conflict(ConflictException e, HttpServletRequest request) {
        return respond(HttpStatus.CONFLICT, e.getMessage(), request, List.of());
    }

    // 409: the database refused a row (a safety net behind the service checks)
    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<ApiError> dataConflict(DataIntegrityViolationException e,
                                                 HttpServletRequest request) {
        return respond(HttpStatus.CONFLICT, "request conflicts with existing data", request, List.of());
    }

    // Everything else: keep Spring's own status (404 for an unknown URL, 405, ...), otherwise 500
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiError> other(Exception e, HttpServletRequest request) {
        if (e instanceof ErrorResponse springError) {
            HttpStatus status = HttpStatus.valueOf(springError.getStatusCode().value());
            String message = springError.getBody().getDetail();
            if (message == null || message.isBlank()) {
                message = status.getReasonPhrase();
            }
            return respond(status, message, request, List.of());
        }
        log.error("Unexpected error on {} {}", request.getMethod(), request.getRequestURI(), e);
        return respond(HttpStatus.INTERNAL_SERVER_ERROR, "unexpected server error", request, List.of());
    }

    private ResponseEntity<ApiError> respond(HttpStatus status, String message,
                                             HttpServletRequest request,
                                             List<ApiError.FieldMessage> fieldErrors) {
        return ResponseEntity.status(status)
                .body(ApiError.of(status, message, request.getRequestURI(), fieldErrors));
    }
}