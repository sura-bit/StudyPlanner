package org.example.studyplanner;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CourseRepository extends JpaRepository<Course, Long> {

    // P2 with ?minTaskLimit=
    List<Course> findByTaskLimitGreaterThanEqualOrderById(int minTaskLimit);

    // P1: is this code used by any course?
    boolean existsByCode(String code);

    // P4: is this code used by ANOTHER course?
    boolean existsByCodeAndIdNot(String code, Long id);
}