package org.example.studyplanner;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "course")
public class Course {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String code;
    private String name;
    private int taskLimit;
    private String instructor;
    private int credits;

    protected Course() { }

    public Course(String code, String name, int taskLimit, String instructor, int credits) {
        this.code = code;
        this.name = name;
        this.taskLimit = taskLimit;
        this.instructor = instructor;
        this.credits = credits;
    }

    public void update(String code, String name, int taskLimit, String instructor, int credits) {
        this.code = code;
        this.name = name;
        this.taskLimit = taskLimit;
        this.instructor = instructor;
        this.credits = credits;
    }

    public Long getId() { return id; }
    public String getCode() { return code; }
    public String getName() { return name; }
    public int getTaskLimit() { return taskLimit; }
    public String getInstructor() { return instructor; }
    public int getCredits() { return credits; }
}