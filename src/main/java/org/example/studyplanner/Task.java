package org.example.studyplanner;

import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "task")
public class Task {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "course_id")
    private Course course;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "owner_id")
    private AppUser owner;

    private LocalDateTime createdAt;

    private String title;
    private String description;


    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.VARCHAR)
    private Priority priority;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.VARCHAR)
    private TaskStatus status;

    private LocalDate startDate;
    private LocalDate dueDate;

    protected Task() { }

    // C1: a new task always starts as TODO
    public Task(Course course, AppUser owner, String title, String description,
                Priority priority, LocalDate startDate, LocalDate dueDate) {
        this.course = course;
        this.owner = owner;
        this.createdAt = LocalDateTime.now();
        this.title = title;
        this.description = description;
        this.priority = priority;
        this.status = TaskStatus.TODO;
        this.startDate = startDate;
        this.dueDate = dueDate;
    }

    // Rule C
    public boolean isOwnedBy(String username) {
        return owner.getUsername().equals(username);
    }

    // Rule A
    public boolean isOpen() {
        return status != TaskStatus.DONE;
    }

    // C5: dirty checking writes the UPDATE when the transaction ends
    public void update(String title, String description, Priority priority, TaskStatus status,
                       LocalDate startDate, LocalDate dueDate) {
        this.title = title;
        this.description = description;
        this.priority = priority;
        this.status = status;
        this.startDate = startDate;
        this.dueDate = dueDate;
    }

    public Long getId() { return id; }
    public Course getCourse() { return course; }
    public AppUser getOwner() { return owner; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public String getTitle() { return title; }
    public String getDescription() { return description; }
    public Priority getPriority() { return priority; }
    public TaskStatus getStatus() { return status; }
    public LocalDate getStartDate() { return startDate; }
    public LocalDate getDueDate() { return dueDate; }
}