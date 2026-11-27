package com.srhcodeverse.backend.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.srhcodeverse.backend.entity.CertificateDefinition;
import com.srhcodeverse.backend.entity.CertificateQuestion;
import com.srhcodeverse.backend.entity.Course;
import com.srhcodeverse.backend.entity.CourseLesson;
import com.srhcodeverse.backend.entity.Roadmap;
import com.srhcodeverse.backend.entity.RoadmapStage;
import com.srhcodeverse.backend.entity.RoadmapTopic;
import com.srhcodeverse.backend.entity.Role;
import com.srhcodeverse.backend.entity.User;
import com.srhcodeverse.backend.repository.CertificateDefinitionRepository;
import com.srhcodeverse.backend.repository.CertificateQuestionRepository;
import com.srhcodeverse.backend.repository.CourseLessonRepository;
import com.srhcodeverse.backend.repository.CourseRepository;
import com.srhcodeverse.backend.repository.IssuedCertificateRepository;
import com.srhcodeverse.backend.repository.RoadmapRepository;
import com.srhcodeverse.backend.repository.RoadmapStageRepository;
import com.srhcodeverse.backend.repository.RoadmapTopicRepository;
import com.srhcodeverse.backend.repository.RoleRepository;
import com.srhcodeverse.backend.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.TestPropertySource;

import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Integration coverage for the roadmap, learning path, interview arena and
 * certificate features against a real (H2) database and the seeded content.
 */
@SpringBootTest
@TestPropertySource(properties = {
        "spring.datasource.url=jdbc:h2:mem:studentfeatures",
        "spring.datasource.driver-class-name=org.h2.Driver",
        "spring.jpa.database-platform=org.hibernate.dialect.H2Dialect",
        "jwt.secret=test-secret-key-do-not-use-in-production",
        "spring.security.oauth2.client.registration.google.client-id=test-google-client-id",
        "spring.security.oauth2.client.registration.google.client-secret=test-google-client-secret",
        "spring.security.oauth2.client.registration.github.client-id=test-github-client-id",
        "spring.security.oauth2.client.registration.github.client-secret=test-github-client-secret"
})
class StudentFeaturesIntegrationTest {

    @Autowired private RoadmapService roadmapService;
    @Autowired private LearningService learningService;
    @Autowired private InterviewService interviewService;
    @Autowired private CertificateService certificateService;

    @Autowired private UserRepository userRepository;
    @Autowired private RoleRepository roleRepository;
    @Autowired private RoadmapRepository roadmapRepository;
    @Autowired private RoadmapStageRepository roadmapStageRepository;
    @Autowired private RoadmapTopicRepository roadmapTopicRepository;
    @Autowired private CourseRepository courseRepository;
    @Autowired private CourseLessonRepository courseLessonRepository;
    @Autowired private CertificateDefinitionRepository certificateDefinitionRepository;
    @Autowired private CertificateQuestionRepository certificateQuestionRepository;
    @Autowired private IssuedCertificateRepository issuedCertificateRepository;
    @Autowired private ObjectMapper objectMapper;

    private User student(String prefix) {
        Role role = roleRepository.findByName("STUDENT")
                .orElseGet(() -> roleRepository.save(Role.builder().name("STUDENT").build()));
        String suffix = UUID.randomUUID().toString().substring(0, 8);
        return userRepository.save(User.builder()
                .username(prefix + "_" + suffix)
                .email(prefix + "_" + suffix + "@test.dev")
                .passwordHash("not-used-in-tests")
                .role(role)
                .build());
    }

    @SuppressWarnings("unchecked")
    private List<Map<String, Object>> list(Object value) {
        return (List<Map<String, Object>>) value;
    }

    @Test
    void seededContentIsAvailable() {
        assertTrue(roadmapRepository.count() >= 7, "expected the seeded roadmaps");
        assertTrue(courseRepository.count() >= 7, "expected the seeded courses");
        assertTrue(certificateDefinitionRepository.count() >= 7, "expected the seeded certificates");
        assertEquals(7, interviewService.categories().size());
        assertTrue(interviewService.categories().stream()
                .allMatch(category -> ((Number) category.get("questionCount")).intValue() > 0));

        Course fullStack = courseRepository.findBySlug("fullstack-projects").orElseThrow();
        assertTrue(courseLessonRepository
                .findByCourseOrderByModuleOrderAscLessonOrderAsc(fullStack).size() >= 7);
        Course jobPrep = courseRepository.findBySlug("job-preparation").orElseThrow();
        assertTrue(courseLessonRepository
                .findByCourseOrderByModuleOrderAscLessonOrderAsc(jobPrep).size() >= 7);

        CertificateDefinition frontend = certificateDefinitionRepository
                .findBySlug("frontend-development").orElseThrow();
        assertEquals(8, certificateQuestionRepository
                .countByDefinitionAndActiveTrue(frontend));
        CertificateDefinition readiness = certificateDefinitionRepository
                .findBySlug("interview-readiness").orElseThrow();
        assertEquals(8, certificateQuestionRepository
                .countByDefinitionAndActiveTrue(readiness));
    }

    @Test
    void seededLessonsContainCompleteEducationalContent() throws Exception {
        List<Course> courses = courseRepository.findAll();
        assertFalse(courses.isEmpty());

        for (Course course : courses) {
            List<CourseLesson> lessons = courseLessonRepository
                    .findByCourseOrderByModuleOrderAscLessonOrderAsc(course);
            assertFalse(lessons.isEmpty(), course.getSlug() + " should have lessons");
            for (CourseLesson lesson : lessons) {
                String where = course.getSlug() + " / " + lesson.getTitle();
                assertNotNull(lesson.getLessonContent(), where + " content");
                assertFalse(lesson.getLessonContent().isBlank(), where + " content");
                assertNotNull(lesson.getCodeExample(), where + " code example");
                assertNotNull(lesson.getExpectedOutput(), where + " expected output");
                assertNotNull(lesson.getExercise(), where + " exercise");
                assertNotNull(lesson.getLearningObjectives(), where + " objectives");
                assertNotNull(lesson.getCommonMistakes(), where + " common mistakes");
                assertFalse(RoadmapService.split(lesson.getResources()).isEmpty(),
                        where + " resources");
                assertNotNull(lesson.getQuiz(), where + " quiz");
                assertTrue(objectMapper.readTree(lesson.getQuiz()).isArray(),
                        where + " quiz must be a JSON array");
                assertTrue(objectMapper.readTree(lesson.getQuiz()).size() >= 2,
                        where + " quiz should have at least two questions");
            }
        }
    }

    @Test
    void roadmapEnrollmentPersistsAndEnforcesPrerequisites() {
        User user = student("roadmap");

        Map<String, Object> enrolled = roadmapService.enroll("java-full-stack", user.getUsername());
        assertEquals(Boolean.TRUE, enrolled.get("enrolled"));
        assertEquals(0, enrolled.get("completedTopics"));

        Roadmap roadmap = roadmapRepository.findBySlug("java-full-stack").orElseThrow();
        List<RoadmapStage> stages = roadmapStageRepository.findByRoadmapOrderByStageOrderAsc(roadmap);
        RoadmapStage firstStage = stages.get(0);
        RoadmapStage secondStage = stages.get(1);

        RoadmapTopic lockedTopic = roadmapTopicRepository
                .findByStageOrderByTopicOrderAsc(secondStage).get(0);
        IllegalArgumentException locked = assertThrows(IllegalArgumentException.class,
                () -> roadmapService.updateTopic("java-full-stack", lockedTopic.getId(),
                        user.getUsername(), true));
        assertTrue(locked.getMessage().contains("prerequisite"));

        for (RoadmapTopic topic : roadmapTopicRepository
                .findByStageOrderByTopicOrderAsc(firstStage)) {
            roadmapService.updateTopic("java-full-stack", topic.getId(), user.getUsername(), true);
        }

        Map<String, Object> afterFirstStage = roadmapService.detail("java-full-stack", user.getUsername());
        List<Map<String, Object>> stageViews = list(afterFirstStage.get("stages"));
        assertEquals("COMPLETED", stageViews.get(0).get("status"));
        assertEquals("AVAILABLE", stageViews.get(1).get("status"));

        Map<String, Object> afterTopic = roadmapService.updateTopic(
                "java-full-stack", lockedTopic.getId(), user.getUsername(), true);
        assertTrue(((Number) afterTopic.get("progressPercent")).intValue() > 0);
        assertTrue(((Number) afterTopic.get("completedTopics")).intValue() > 0);
        assertNotNull(afterTopic.get("nextTopic"));

        assertEquals(1, roadmapService.my(user.getUsername()).get("total"));
        assertThrows(IllegalArgumentException.class,
                () -> roadmapService.unenroll("java-full-stack", user.getUsername()));
    }

    @Test
    void roadmapTopicCannotBeMarkedCompleteForAnotherRoadmap() {
        User user = student("crossroadmap");
        roadmapService.enroll("java-full-stack", user.getUsername());
        Roadmap other = roadmapRepository.findBySlug("sql-database").orElseThrow();
        RoadmapTopic foreignTopic = roadmapTopicRepository
                .findByStageOrderByTopicOrderAsc(
                        roadmapStageRepository.findByRoadmapOrderByStageOrderAsc(other).get(0))
                .get(0);

        assertThrows(IllegalArgumentException.class,
                () -> roadmapService.updateTopic("java-full-stack", foreignTopic.getId(),
                        user.getUsername(), true));
    }

    @Test
    void learningProgressBookmarksAndNotesArePerStudent() {
        User owner = student("learn");
        User other = student("learn");

        Map<String, Object> enrolled = learningService.enroll("java-foundations", owner.getUsername());
        assertEquals(Boolean.TRUE, enrolled.get("enrolled"));

        Course course = courseRepository.findBySlug("java-foundations").orElseThrow();
        List<CourseLesson> lessons = courseLessonRepository
                .findByCourseOrderByModuleOrderAscLessonOrderAsc(course);
        Long lessonId = lessons.get(0).getId();

        Map<String, Object> completed = learningService.complete(lessonId, owner.getUsername(), true);
        assertEquals(Boolean.TRUE, completed.get("completed"));

        Map<String, Object> progress = learningService.progress(owner.getUsername());
        assertEquals(1, progress.get("completedLessons"));
        assertEquals(1, progress.get("enrolledCourses"));

        assertEquals(Boolean.TRUE,
                learningService.toggleBookmark(lessonId, owner.getUsername()).get("bookmarked"));
        assertEquals(1, learningService.bookmarks(owner.getUsername()).get("total"));

        learningService.saveNote(lessonId, owner.getUsername(), "revisit collections");
        assertEquals("revisit collections",
                learningService.lesson(lessonId, owner.getUsername()).get("note"));

        Map<String, Object> otherView = learningService.lesson(lessonId, other.getUsername());
        assertEquals("", otherView.get("note"));
        assertEquals(Boolean.FALSE, otherView.get("bookmarked"));
        assertEquals(Boolean.FALSE, otherView.get("completed"));

        Map<String, Object> recommendations = learningService.recommendations(owner.getUsername());
        assertEquals("RULE_BASED", recommendations.get("engine"));
        assertTrue(((Number) recommendations.get("total")).intValue() >= 1);
        List<Map<String, Object>> recommendationItems = list(recommendations.get("items"));
        assertTrue(recommendationItems.stream()
                .filter(item -> "course".equals(item.get("type")))
                .allMatch(item -> String.valueOf(item.get("href"))
                        .startsWith("/learning-path/courses/")));
        assertTrue(recommendationItems.stream()
                .filter(item -> item.get("lessonId") != null)
                .allMatch(item -> String.valueOf(item.get("href"))
                        .startsWith("/learning-path/courses/")));
    }

    @Test
    void learningCatalogSupportsSearchAndReportsProgress() {
        User user = student("catalog");
        learningService.enroll("java-foundations", user.getUsername());

        Map<String, Object> catalog = learningService.catalog(
                user.getUsername(), "java", null, null, 0, 50);
        assertTrue(((Number) catalog.get("total")).intValue() >= 1);
        List<Map<String, Object>> items = list(catalog.get("items"));
        assertTrue(items.stream().anyMatch(item -> "java-foundations".equals(item.get("slug"))));
        assertTrue(items.stream()
                .filter(item -> "java-foundations".equals(item.get("slug")))
                .allMatch(item -> Boolean.TRUE.equals(item.get("enrolled"))));
    }

    @Test
    void interviewSessionIsScoredOwnedAndListedInHistory() {
        User owner = student("interview");
        User other = student("interview");

        Map<String, Object> session = interviewService.start(
                owner.getUsername(), "JAVA", "MIXED", 5, 10, "TIMED");
        Long sessionId = ((Number) session.get("id")).longValue();
        List<Map<String, Object>> questions = list(session.get("questions"));
        assertEquals(5, questions.size());

        Map<String, Object> first = questions.get(0);
        Long sessionQuestionId = ((Number) first.get("sessionQuestionId")).longValue();
        assertThrows(IllegalArgumentException.class, () -> interviewService.saveAnswer(
                sessionId, sessionQuestionId, owner.getUsername(), 99, null, null));

        @SuppressWarnings("unchecked")
        List<String> options = (List<String>) first.get("options");
        if (options != null && !options.isEmpty()) {
            interviewService.saveAnswer(sessionId, sessionQuestionId,
                    owner.getUsername(), 0, null, null);
        } else {
            interviewService.saveAnswer(sessionId, sessionQuestionId,
                    owner.getUsername(), null, "array index and lookup", null);
        }

        Map<String, Object> result = interviewService.submit(sessionId, owner.getUsername());
        assertEquals("SUBMITTED", result.get("status"));
        assertNotNull(result.get("scorePercent"));
        assertTrue(((Number) result.get("totalQuestions")).intValue() == 5);

        assertThrows(IllegalArgumentException.class,
                () -> interviewService.submit(sessionId, owner.getUsername()));
        assertThrows(IllegalArgumentException.class,
                () -> interviewService.session(sessionId, other.getUsername()));
        assertThrows(IllegalArgumentException.class,
                () -> interviewService.result(sessionId, other.getUsername()));

        assertEquals(1, interviewService.history(owner.getUsername(), 0, 10).get("total"));
        assertEquals(0, interviewService.history(other.getUsername(), 0, 10).get("total"));
    }

    @Test
    void behaviouralRoundIsSelfReviewedInsteadOfFakeScored() {
        User user = student("hr");
        Map<String, Object> session = interviewService.start(
                user.getUsername(), "HR", "MIXED", 5, 10, "PRACTICE");
        Long sessionId = ((Number) session.get("id")).longValue();

        Map<String, Object> result = interviewService.submit(sessionId, user.getUsername());
        assertEquals(0, result.get("maxPoints"));
        assertNull(result.get("scorePercent"));
        assertTrue(list(result.get("questions")).stream()
                .allMatch(question -> "SELF_REVIEW".equals(question.get("reviewStatus"))));
    }

    @Test
    void interviewStartValidatesRequestedSize() {
        User user = student("invalid");
        assertThrows(IllegalArgumentException.class,
                () -> interviewService.start(user.getUsername(), "JAVA", "MIXED", 2, 10, "TIMED"));
        assertThrows(IllegalArgumentException.class,
                () -> interviewService.start(user.getUsername(), "JAVA", "MIXED", 5, 1, "TIMED"));
        assertThrows(IllegalArgumentException.class,
                () -> interviewService.start(user.getUsername(), "UNKNOWN", "MIXED", 5, 10, "TIMED"));
    }

    @Test
    void interviewStartCapsRequestToAvailableQuestions() {
        User user = student("cap");
        Map<String, Object> session = interviewService.start(
                user.getUsername(), "JAVA", "MIXED", 10, 20, "TIMED");
        int served = ((Number) session.get("questionCount")).intValue();
        assertTrue(served >= 5 && served <= 10);
        assertEquals(served, list(session.get("questions")).size());
    }

    @Test
    void certificateAssessmentIssuanceAndVerificationAreBackendControlled() {
        User user = student("cert");

        assertThrows(IllegalArgumentException.class,
                () -> certificateService.startAttempt("java-foundations", user.getUsername()));

        String slug = "test-certificate-" + UUID.randomUUID().toString().substring(0, 8);
        CertificateDefinition definition = certificateDefinitionRepository.save(
                CertificateDefinition.builder()
                        .slug(slug)
                        .title("Test Certificate")
                        .description("Integration test certificate")
                        .category("Test")
                        .requiredCourseSlugs("java-foundations")
                        .requiredLessonPercent(0)
                        .requiredSolvedProblems(0)
                        .assessmentPassScore(50)
                        .assessmentQuestionCount(1)
                        .assessmentDurationMinutes(10)
                        .attemptLimit(2)
                        .sortOrder(99)
                        .active(true)
                        .build());
        certificateQuestionRepository.save(CertificateQuestion.builder()
                .definition(definition)
                .prompt("What is 2 + 2?")
                .optionsJson("[\"3\",\"4\",\"5\",\"6\"]")
                .correctOption(1)
                .explanation("2 + 2 is 4")
                .active(true)
                .build());

        assertThrows(IllegalArgumentException.class,
                () -> certificateService.claim(slug, user.getUsername()));

        Map<String, Object> attempt = certificateService.startAttempt(slug, user.getUsername());
        assertEquals("IN_PROGRESS", attempt.get("status"));
        Long attemptId = ((Number) attempt.get("id")).longValue();
        Long questionId = ((Number) list(attempt.get("questions")).get(0).get("questionId")).longValue();

        assertThrows(IllegalArgumentException.class, () -> certificateService.saveAnswer(
                attemptId, questionId, user.getUsername(), 9));
        certificateService.saveAnswer(attemptId, questionId, user.getUsername(), 1);

        Map<String, Object> result = certificateService.submitAttempt(attemptId, user.getUsername());
        assertEquals(Boolean.TRUE, result.get("passed"));
        assertEquals(100, result.get("scorePercent"));

        Map<String, Object> issued = certificateService.claim(slug, user.getUsername());
        String certificateNumber = (String) issued.get("certificateNumber");
        String verificationCode = (String) issued.get("verificationCode");
        assertNotNull(certificateNumber);
        assertNotNull(verificationCode);

        Map<String, Object> verified = certificateService.verify(verificationCode);
        assertEquals(Boolean.TRUE, verified.get("valid"));
        assertEquals(certificateNumber, verified.get("certificateNumber"));
        assertEquals(user.getUsername(), verified.get("studentName"));

        Map<String, Object> duplicate = certificateService.claim(slug, user.getUsername());
        assertEquals(certificateNumber, duplicate.get("certificateNumber"));
        assertTrue(issuedCertificateRepository.findByVerificationCode(verificationCode).isPresent());
        assertEquals(1, certificateService.my(user.getUsername()).get("total"));

        assertThrows(IllegalArgumentException.class,
                () -> certificateService.startAttempt(slug, user.getUsername()));
        assertThrows(IllegalArgumentException.class,
                () -> certificateService.verify("DOES-NOT-EXIST"));
    }

    @Test
    void certificateDownloadProducesPdfBytes() {
        User user = student("pdf");
        String slug = "test-pdf-" + UUID.randomUUID().toString().substring(0, 8);
        CertificateDefinition definition = certificateDefinitionRepository.save(
                CertificateDefinition.builder()
                        .slug(slug)
                        .title("PDF Certificate")
                        .description("Download test")
                        .category("Test")
                        .requiredCourseSlugs("java-foundations")
                        .requiredLessonPercent(0)
                        .requiredSolvedProblems(0)
                        .assessmentPassScore(50)
                        .assessmentQuestionCount(1)
                        .assessmentDurationMinutes(10)
                        .attemptLimit(1)
                        .sortOrder(98)
                        .active(true)
                        .build());
        certificateQuestionRepository.save(CertificateQuestion.builder()
                .definition(definition)
                .prompt("Pick A")
                .optionsJson("[\"A\",\"B\"]")
                .correctOption(0)
                .explanation("A is correct")
                .active(true)
                .build());

        Map<String, Object> attempt = certificateService.startAttempt(slug, user.getUsername());
        Long attemptId = ((Number) attempt.get("id")).longValue();
        Long questionId = ((Number) list(attempt.get("questions")).get(0).get("questionId")).longValue();
        certificateService.saveAnswer(attemptId, questionId, user.getUsername(), 0);
        certificateService.submitAttempt(attemptId, user.getUsername());
        Map<String, Object> issued = certificateService.claim(slug, user.getUsername());

        byte[] pdf = certificateService.download(
                (String) issued.get("certificateNumber"), user.getUsername());
        assertTrue(pdf.length > 200);
        assertEquals("%PDF", new String(pdf, 0, 4, java.nio.charset.StandardCharsets.ISO_8859_1));
        assertFalse(issuedCertificateRepository.findAll().isEmpty());
    }
}
