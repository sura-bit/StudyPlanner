package org.example.studyplanner;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.net.URI;
import java.util.List;

@RestController
@RequestMapping("/api")
public class TaskController {

    private final TaskService taskService;

    public TaskController(TaskService taskService) {
        this.taskService = taskService;
    }

    // C1 (logged in -> owner)
    @PostMapping("/courses/{courseId}/tasks")
    public ResponseEntity<TaskResponse> create(@PathVariable Long courseId,
                                               @Valid @RequestBody TaskCreateRequest request,
                                               Authentication authentication) {
        Task task = taskService.create(courseId, authentication.getName(), request);
        return ResponseEntity.created(URI.create("/api/tasks/" + task.getId()))
                .body(TaskResponse.from(task));
    }

    // C2 (anyone)
    @GetMapping("/courses/{courseId}/tasks")
    public List<TaskResponse> listForCourse(@PathVariable Long courseId) {
        return taskService.findByCourse(courseId).stream()
                .map(TaskResponse::from)
                .toList();
    }

    // C3 (logged in). "/tasks/mine" wins over "/tasks/{id}" because it is more specific.
    @GetMapping("/tasks/mine")
    public List<TaskResponse> mine(Authentication authentication) {
        return taskService.findMine(authentication.getName()).stream()
                .map(TaskResponse::from)
                .toList();
    }

    // C4 (owner or admin)
    @GetMapping("/tasks/{id}")
    public TaskResponse get(@PathVariable Long id, Authentication authentication) {
        return TaskResponse.from(taskService.get(id, authentication.getName(), isAdmin(authentication)));
    }

    // C5 (owner only)
    @PutMapping("/tasks/{id}")
    public TaskResponse update(@PathVariable Long id,
                               @Valid @RequestBody TaskUpdateRequest request,
                               Authentication authentication) {
        return TaskResponse.from(taskService.update(id, authentication.getName(), request));
    }

    // C6 (owner or admin)
    @DeleteMapping("/tasks/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id, Authentication authentication) {
        taskService.delete(id, authentication.getName(), isAdmin(authentication));
    }

    private static boolean isAdmin(Authentication authentication) {
        return authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
    }
}