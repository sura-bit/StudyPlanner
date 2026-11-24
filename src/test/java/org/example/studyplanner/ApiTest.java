package org.example.studyplanner;

import com.jayway.jsonpath.JsonPath;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import static org.hamcrest.Matchers.everyItem;
import static org.hamcrest.Matchers.is;
import static org.hamcrest.Matchers.startsWith;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class ApiTest {

    @Autowired
    private MockMvc mvc;

    private static final String NEW_TASK = """
            { "title": "Lab G: Docker", "description": "compose file", "priority": "HIGH",
              "startDate": "2026-12-01", "dueDate": "2026-12-08" }
            """;

    private static final String NEW_COURSE = """
            { "code": "NET101", "name": "Networks", "taskLimit": 4,
              "instructor": "Professor Choi", "credits": 3 }
            """;

    // Logs in through A2 and returns "Bearer <token>". Sample passwords are name + "1234".
    private String bearer(String username) throws Exception {
        String body = mvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                { "username": "%s", "password": "%s1234" }
                                """.formatted(username, username)))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        String token = JsonPath.read(body, "$.accessToken");
        return "Bearer " + token;
    }


    @Test
    void noToken_createTask_401() throws Exception {
        mvc.perform(post("/api/courses/1/tasks")
                        .contentType(MediaType.APPLICATION_JSON).content(NEW_TASK))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.message").value("login required"));
    }

    @Test
    void ruleD_userCreatesCourse_403() throws Exception {
        mvc.perform(post("/api/courses").header("Authorization", bearer("sura"))
                        .contentType(MediaType.APPLICATION_JSON).content(NEW_COURSE))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.message").value("admin role required"));
    }

    @Test
    void ruleA_fourthOpenTaskInCourse_409() throws Exception {
        mvc.perform(post("/api/courses/1/tasks").header("Authorization", bearer("sura"))
                        .contentType(MediaType.APPLICATION_JSON).content(NEW_TASK))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").value("you already have 3 open tasks in course 1 (limit 3)"));
    }

    @Test
    void ruleB_startAfterDue_400() throws Exception {
        mvc.perform(post("/api/courses/1/tasks").header("Authorization", bearer("kenny"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                { "title": "Backwards", "priority": "LOW",
                                  "startDate": "2026-12-08", "dueDate": "2026-12-01" }
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("startDate must be on or before dueDate"));
    }

    @Test
    void ruleC_userChangesAnotherUsersTask_403() throws Exception {
        mvc.perform(put("/api/tasks/6").header("Authorization", bearer("sura"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                { "title": "Lab E: security", "priority": "HIGH", "status": "DONE",
                                  "startDate": "2026-11-18", "dueDate": "2026-11-25" }
                                """))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.message").value("task 6 belongs to another user"));
    }

    @Test
    void deleteCourseWithTasks_409() throws Exception {
        mvc.perform(delete("/api/courses/1").header("Authorization", bearer("admin")))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").value("course 1 has tasks"));
    }

    @Test
    void validation_blankTitle_400() throws Exception {
        mvc.perform(post("/api/courses/1/tasks").header("Authorization", bearer("kenny"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                { "title": "", "priority": "LOW",
                                  "startDate": "2026-12-01", "dueDate": "2026-12-08" }
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("request has invalid fields"))
                .andExpect(jsonPath("$.fieldErrors[0].field").value("title"));
    }


    @Test
    void takenCourseCode_409() throws Exception {
        mvc.perform(post("/api/courses").header("Authorization", bearer("admin"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(NEW_COURSE.replace("NET101", "ASP101")))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").value("course code ASP101 is taken"));
    }

    @Test
    void minTaskLimitBelowOne_400() throws Exception {
        mvc.perform(get("/api/courses").param("minTaskLimit", "0"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("minTaskLimit must be at least 1"));
    }

    @Test
    void brokenToken_401() throws Exception {
        mvc.perform(get("/api/tasks/mine").header("Authorization", "Bearer abc.def.ghi"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.message").value("token is invalid or expired"));
    }


    @Test
    void ownerCreatesTask_201WithLocation() throws Exception {
        mvc.perform(post("/api/courses/1/tasks").header("Authorization", bearer("kenny"))
                        .contentType(MediaType.APPLICATION_JSON).content(NEW_TASK))
                .andExpect(status().isCreated())
                .andExpect(header().string("Location", startsWith("/api/tasks/")))
                .andExpect(jsonPath("$.status").value("TODO"))
                .andExpect(jsonPath("$.ownerUsername").value("kenny"))
                .andExpect(jsonPath("$.courseName").value("Advanced Server Programming"));
    }

    @Test
    void adminCreatesCourse_201WithLocation() throws Exception {
        mvc.perform(post("/api/courses").header("Authorization", bearer("admin"))
                        .contentType(MediaType.APPLICATION_JSON).content(NEW_COURSE))
                .andExpect(status().isCreated())
                .andExpect(header().string("Location", startsWith("/api/courses/")))
                .andExpect(jsonPath("$.code").value("NET101"));
    }

    @Test
    void myTasks_onlyMine_200() throws Exception {
        mvc.perform(get("/api/tasks/mine").header("Authorization", bearer("sura")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(5))
                .andExpect(jsonPath("$[*].ownerUsername", everyItem(is("sura"))));
    }

    @Test
    void anyoneListsCourses_200() throws Exception {
        mvc.perform(get("/api/courses").param("minTaskLimit", "5"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2));
    }

    @Test
    void adminDeletesEmptyCourse_204() throws Exception {
        mvc.perform(delete("/api/courses/3").header("Authorization", bearer("admin")))
                .andExpect(status().isNoContent());
    }
}