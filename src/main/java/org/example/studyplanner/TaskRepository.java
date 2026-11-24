package org.example.studyplanner;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface TaskRepository extends JpaRepository<Task, Long> {

    // C2: "join fetch" loads course and owner in the same SELECT
    @Query("""
            select t from Task t
            join fetch t.course c
            join fetch t.owner
            where c.id = :courseId
            order by t.dueDate, t.id
            """)
    List<Task> findByCourse(@Param("courseId") Long courseId);

    // C3
    @Query("""
            select t from Task t
            join fetch t.course
            join fetch t.owner o
            where o.username = :username
            order by t.dueDate, t.id
            """)
    List<Task> findMine(@Param("username") String username);

    // C4, C5, C6: one task with its course and owner, in one SELECT
    @Query("""
            select t from Task t
            join fetch t.course
            join fetch t.owner
            where t.id = :id
            """)
    Optional<Task> findDetailed(@Param("id") Long id);

    // Rule A: the database counts; we never load the tasks into Java to count them
    @Query("""
            select count(t) from Task t
            where t.course.id = :courseId
              and t.owner.username = :username
              and t.status <> :done
            """)
    long countOpen(@Param("courseId") Long courseId,
                   @Param("username") String username,
                   @Param("done") TaskStatus done);

    // P5: a course with tasks cannot be deleted
    boolean existsByCourseId(Long courseId);
}