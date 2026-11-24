USE studyplanner;

DROP TABLE IF EXISTS task;
DROP TABLE IF EXISTS course;
DROP TABLE IF EXISTS app_user;

CREATE TABLE app_user (
                          id            BIGINT       NOT NULL AUTO_INCREMENT,
                          username      VARCHAR(20)  NOT NULL,
                          password_hash VARCHAR(100) NOT NULL,
                          role          VARCHAR(20)  NOT NULL,
                          PRIMARY KEY (id),
                          CONSTRAINT uq_app_user_username UNIQUE (username)
);

CREATE TABLE course (
                        id         BIGINT       NOT NULL AUTO_INCREMENT,
                        code       VARCHAR(20)  NOT NULL,
                        name       VARCHAR(100) NOT NULL,
                        task_limit INT          NOT NULL,
                        instructor VARCHAR(100) NOT NULL,
                        credits    INT          NOT NULL,
                        PRIMARY KEY (id),
                        CONSTRAINT uq_course_code UNIQUE (code),
                        CONSTRAINT chk_course_task_limit CHECK (task_limit BETWEEN 1 AND 20),
                        CONSTRAINT chk_course_credits CHECK (credits BETWEEN 1 AND 6)
);

CREATE TABLE task (
                      id          BIGINT       NOT NULL AUTO_INCREMENT,
                      course_id   BIGINT       NOT NULL,
                      owner_id    BIGINT       NOT NULL,
                      created_at  DATETIME     NOT NULL,
                      title       VARCHAR(100) NOT NULL,
                      description VARCHAR(500) NULL,
                      priority    VARCHAR(10)  NOT NULL,
                      status      VARCHAR(10)  NOT NULL,
                      start_date  DATE         NOT NULL,
                      due_date    DATE         NOT NULL,
                      PRIMARY KEY (id),
                      CONSTRAINT fk_task_course FOREIGN KEY (course_id) REFERENCES course (id),
                      CONSTRAINT fk_task_owner  FOREIGN KEY (owner_id)  REFERENCES app_user (id),
                      CONSTRAINT chk_task_dates CHECK (start_date <= due_date)
);

INSERT INTO app_user (id, username, password_hash, role) VALUES
                                                             (1, 'admin', '$2a$10$8GIuHc2cp55HDtQXKnmAIeCe96sDjVCRtFkrfR2LbwFzvt5k507ze', 'ADMIN'),
                                                             (2, 'sura',  '$2a$10$mZe7GwqENjXDKE4gAxA8de660Jo1S4.IVX126YwJFfEPqF2NhIwpC', 'USER'),
                                                             (3, 'kenny',  '$2a$10$.MpgoHWkr0QAdNT5k2T0oOnKHkEWk.PrTtpfrvdbMCqc4pwoCRPt.', 'USER');

INSERT INTO course (id, code, name, task_limit, instructor, credits) VALUES
                                                                         (1, 'ASP101', 'Advanced Server Programming', 3, 'Professor Lee',  3),
                                                                         (2, 'DB101',  'Databases',                   5, 'Professor Malik',  3),
                                                                         (3, 'WEB101', 'Web Basics',                  5, 'Professor Seo', 2);


INSERT INTO task (id, course_id, owner_id, created_at, title, description, priority, status, start_date, due_date) VALUES
                                                                                                                       (1, 1, 2, '2026-11-20 09:00:00', 'Lab F: JWT login',       'Finish the login endpoint and the token check', 'HIGH',   'TODO',  '2026-11-20', '2026-11-27'),
                                                                                                                       (2, 1, 2, '2026-11-21 10:30:00', 'Week 12 tests',          'Five service tests and five controller tests',  'MEDIUM', 'DOING', '2026-11-21', '2026-12-01'),
                                                                                                                       (3, 1, 2, '2026-11-16 14:00:00', 'Final project proposal', NULL,                                            'HIGH',   'DOING', '2026-11-16', '2026-11-29'),
                                                                                                                       (4, 1, 2, '2026-10-12 08:15:00', 'Midterm revision',       'Weeks 1 to 7',                                  'LOW',    'DONE',  '2026-10-12', '2026-10-20'),
                                                                                                                       (5, 2, 2, '2026-11-23 11:00:00', 'ER diagram homework',    NULL,                                            'MEDIUM', 'TODO',  '2026-11-23', '2026-11-30'),
                                                                                                                       (6, 1, 3, '2026-11-18 16:45:00', 'Lab E: security',        'Roles and owners',                              'MEDIUM', 'TODO',  '2026-11-18', '2026-11-25'),
                                                                                                                       (7, 2, 3, '2026-11-21 09:20:00', 'SQL joins practice',     NULL,                                            'LOW',    'TODO',  '2026-11-21', '2026-11-28'),
                                                                                                                       (8, 2, 3, '2026-11-02 13:00:00', 'Normalization quiz',     'Up to 3NF',                                     'MEDIUM', 'DONE',  '2026-11-02', '2026-11-09');