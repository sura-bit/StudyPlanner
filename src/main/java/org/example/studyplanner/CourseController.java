package org.example.studyplanner;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.net.URI;
import java.util.List;

@RestController
@RequestMapping("/api/courses")
public class CourseController {

    private final CourseService courseService;

    public CourseController(CourseService courseService) {
        this.courseService = courseService;
    }

    // P1 (admin)
    @PostMapping
    public ResponseEntity<CourseResponse> create(@Valid @RequestBody CourseRequest request) {
        Course course = courseService.create(request);
        return ResponseEntity.created(URI.create("/api/courses/" + course.getId()))
                .body(CourseResponse.from(course));
    }

    // P2 (anyone)
    @GetMapping
    public List<CourseResponse> list(@RequestParam(required = false) Integer minTaskLimit) {
        return courseService.search(minTaskLimit).stream()
                .map(CourseResponse::from)
                .toList();
    }

    // P3 (anyone)
    @GetMapping("/{id}")
    public CourseResponse get(@PathVariable Long id) {
        return CourseResponse.from(courseService.get(id));
    }

    // P4 (admin)
    @PutMapping("/{id}")
    public CourseResponse update(@PathVariable Long id, @Valid @RequestBody CourseRequest request) {
        return CourseResponse.from(courseService.update(id, request));
    }

    // P5 (admin)
    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        courseService.delete(id);
    }
}