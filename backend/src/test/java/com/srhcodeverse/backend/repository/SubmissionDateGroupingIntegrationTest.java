package com.srhcodeverse.backend.repository;

import com.srhcodeverse.backend.entity.Problem;
import com.srhcodeverse.backend.entity.Role;
import com.srhcodeverse.backend.entity.Submission;
import com.srhcodeverse.backend.entity.User;
import com.srhcodeverse.backend.service.AnalyticsDates;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.TestPropertySource;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

@SpringBootTest
@TestPropertySource(properties = {
        "spring.datasource.url=jdbc:h2:mem:submissiondates;DB_CLOSE_DELAY=-1",
        "spring.datasource.driver-class-name=org.h2.Driver",
        "spring.jpa.database-platform=org.hibernate.dialect.H2Dialect",
        "jwt.secret=submission-dates-test-secret-key"
})
class SubmissionDateGroupingIntegrationTest {

    @Autowired private JdbcTemplate jdbc;
    @Autowired private SubmissionRepository submissions;
    @Autowired private UserRepository users;
    @Autowired private RoleRepository roles;

    private User studentA;
    private User studentB;
    private Problem problem;

    @BeforeEach
    void setUp() {
        Role studentRole = roles.findByName("STUDENT")
                .orElseGet(() -> roles.save(Role.builder().name("STUDENT").build()));
        Role trainerRole = roles.findByName("TRAINER")
                .orElseGet(() -> roles.save(Role.builder().name("TRAINER").build()));
        String suffix = UUID.randomUUID().toString().substring(0, 8);
        User trainer = users.save(User.builder()
                .username("trainer_" + suffix).email("trainer_" + suffix + "@test.dev")
                .passwordHash("x").role(trainerRole).build());
        studentA = users.save(User.builder()
                .username("a_" + suffix).email("a_" + suffix + "@test.dev")
                .passwordHash("x").role(studentRole).build());
        studentB = users.save(User.builder()
                .username("b_" + suffix).email("b_" + suffix + "@test.dev")
                .passwordHash("x").role(studentRole).build());
        problem = problemRepository.save(Problem.builder()
                .title("P").description("P").difficulty(Problem.Difficulty.EASY)
                .topic("topic").createdBy(trainer).build());
    }

    @Autowired private ProblemRepository problemRepository;

    private void addSubmission(User student, Submission.Status status, LocalDateTime when) {
        jdbc.update("INSERT INTO submissions (student_id, problem_id, code, language, status, submitted_at) "
                        + "VALUES (?, ?, ?, ?, ?, ?)",
                student.getId(), problem.getId(), "code", "java", status.name(), when);
    }

    @Test
    void aggregatesByDayAcrossH2WithoutDatabaseDateFunction() {
        LocalDateTime day1 = LocalDateTime.of(2026, 1, 10, 9, 0);
        LocalDateTime day1Late = LocalDateTime.of(2026, 1, 10, 23, 59, 59);
        LocalDateTime midnight = LocalDateTime.of(2026, 1, 11, 0, 0);
        LocalDateTime afterMidnight = LocalDateTime.of(2026, 1, 11, 0, 0, 1);

        addSubmission(studentA, Submission.Status.PASSED, day1);
        addSubmission(studentA, Submission.Status.PASSED, day1Late);
        addSubmission(studentA, Submission.Status.PASSED, midnight);
        addSubmission(studentA, Submission.Status.FAILED, afterMidnight);
        addSubmission(studentB, Submission.Status.PASSED, day1);

        LocalDateTime since = LocalDateTime.of(2026, 1, 9, 0, 0);
        ZoneId zone = ZoneId.systemDefault();
        Map<LocalDate, Long> global = AnalyticsDates.countByDay(submissions.findSubmissionTimesAfter(since), zone);
        assertEquals(3L, global.get(LocalDate.of(2026, 1, 10)));
        assertEquals(2L, global.get(LocalDate.of(2026, 1, 11)));

        Map<LocalDate, Long> forA = AnalyticsDates.countByDay(
                submissions.findSubmissionTimesForStudentAfter(studentA, since), zone);
        assertEquals(2L, forA.get(LocalDate.of(2026, 1, 10)));
        assertEquals(2L, forA.get(LocalDate.of(2026, 1, 11)));

        List<Object> accepted = submissions.findDistinctAcceptedSubmissionDatesByStudent(studentA);
        assertEquals(3, accepted.size());
        assertEquals(2, accepted.stream().map(v -> AnalyticsDates.toLocalDate(v, zone)).distinct().count());
    }

    @Test
    void returnsEmptyListsForEmptyRanges() {
        LocalDateTime future = LocalDateTime.of(2030, 1, 1, 0, 0);
        assertTrue(submissions.findSubmissionTimesAfter(future).isEmpty());
        assertTrue(submissions.findSubmissionTimesForStudentAfter(studentA, future).isEmpty());
        assertTrue(submissions.findDistinctAcceptedSubmissionDatesByStudent(studentA).isEmpty());
    }
}
