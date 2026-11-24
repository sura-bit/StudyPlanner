package org.example.studyplanner;

import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class CourseService {

    private final CourseRepository courseRepository;
    private final TaskRepository taskRepository;

    public CourseService(CourseRepository courseRepository, TaskRepository taskRepository) {
        this.courseRepository = courseRepository;
        this.taskRepository = taskRepository;
    }

    // P2
    public List<Course> search(Integer minTaskLimit) {
        if (minTaskLimit == null) {
            return courseRepository.findAll(Sort.by("id"));
        }
        if (minTaskLimit < 1) {
            throw new IllegalArgumentException("minTaskLimit must be at least 1");          // 400
        }
        return courseRepository.findByTaskLimitGreaterThanEqualOrderById(minTaskLimit);
    }

    // P3
    public Course get(Long id) {
        return courseRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("course " + id + " not found"));   // 404
    }

    // P1
    @Transactional
    public Course create(CourseRequest request) {
        if (courseRepository.existsByCode(request.code())) {
            throw new ConflictException("course code " + request.code() + " is taken");     // 409
        }
        return courseRepository.save(new Course(request.code(), request.name(),
                request.taskLimit(), request.instructor(), request.credits()));
    }

    // P4
    @Transactional
    public Course update(Long id, CourseRequest request) {
        Course course = get(id);                                                             // 404
        if (courseRepository.existsByCodeAndIdNot(request.code(), id)) {
            throw new ConflictException("course code " + request.code() + " is taken");     // 409
        }
        course.update(request.code(), request.name(), request.taskLimit(),
                request.instructor(), request.credits());
        return course;
    }

    // P5
    @Transactional
    public void delete(Long id) {
        if (!courseRepository.existsById(id)) {
            throw new NotFoundException("course " + id + " not found");                     // 404
        }
        if (taskRepository.existsByCourseId(id)) {
            throw new ConflictException("course " + id + " has tasks");                     // 409
        }
        courseRepository.deleteById(id);
    }
}