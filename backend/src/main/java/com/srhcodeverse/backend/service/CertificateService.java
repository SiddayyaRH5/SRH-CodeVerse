package com.srhcodeverse.backend.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.srhcodeverse.backend.entity.*;
import com.srhcodeverse.backend.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.Duration;
import java.time.LocalDateTime;
import java.time.Year;
import java.util.*;

@Service
public class CertificateService {

    private static final SecureRandom RANDOM = new SecureRandom();
    private static final String ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

    private final CertificateDefinitionRepository definitionRepository;
    private final CertificateQuestionRepository questionRepository;
    private final CertificateAttemptRepository attemptRepository;
    private final CertificateAttemptAnswerRepository answerRepository;
    private final IssuedCertificateRepository issuedRepository;
    private final CourseRepository courseRepository;
    private final CourseLessonRepository lessonRepository;
    private final CourseProgressRepository courseProgressRepository;
    private final SubmissionRepository submissionRepository;
    private final ProblemRepository problemRepository;
    private final InterviewSessionRepository interviewSessionRepository;
    private final UserRepository userRepository;
    private final CertificatePdfService pdfService;
    private final ObjectMapper objectMapper;

    public CertificateService(CertificateDefinitionRepository definitionRepository,
                              CertificateQuestionRepository questionRepository,
                              CertificateAttemptRepository attemptRepository,
                              CertificateAttemptAnswerRepository answerRepository,
                              IssuedCertificateRepository issuedRepository,
                              CourseRepository courseRepository,
                              CourseLessonRepository lessonRepository,
                              CourseProgressRepository courseProgressRepository,
                              SubmissionRepository submissionRepository,
                              ProblemRepository problemRepository,
                              InterviewSessionRepository interviewSessionRepository,
                              UserRepository userRepository,
                              CertificatePdfService pdfService,
                              ObjectMapper objectMapper) {
        this.definitionRepository = definitionRepository;
        this.questionRepository = questionRepository;
        this.attemptRepository = attemptRepository;
        this.answerRepository = answerRepository;
        this.issuedRepository = issuedRepository;
        this.courseRepository = courseRepository;
        this.lessonRepository = lessonRepository;
        this.courseProgressRepository = courseProgressRepository;
        this.submissionRepository = submissionRepository;
        this.problemRepository = problemRepository;
        this.interviewSessionRepository = interviewSessionRepository;
        this.userRepository = userRepository;
        this.pdfService = pdfService;
        this.objectMapper = objectMapper;
    }

    private User user(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
    }

    private CertificateDefinition definition(String slug) {
        return definitionRepository.findBySlugAndActiveTrue(slug)
                .orElseThrow(() -> new IllegalArgumentException("Certificate not found"));
    }

    private List<String> options(CertificateQuestion q) {
        try {
            return objectMapper.readValue(q.getOptionsJson(), new TypeReference<List<String>>() {});
        } catch (Exception ex) {
            return List.of();
        }
    }

    @Transactional(readOnly = true)
    public Map<String, Object> catalog(String username) {
        User user = user(username);
        List<Map<String, Object>> items = definitionRepository.findByActiveTrueOrderBySortOrderAsc().stream()
                .map(d -> certificateCard(d, user))
                .toList();
        long earned = items.stream().filter(i -> Boolean.TRUE.equals(i.get("issued"))).count();
        return Map.of("items", items, "total", items.size(), "earned", earned);
    }

    @Transactional(readOnly = true)
    public Map<String, Object> detail(String slug, String username) {
        User user = user(username);
        return certificateCard(definition(slug), user);
    }

    @Transactional(readOnly = true)
    public Map<String, Object> my(String username) {
        User user = user(username);
        List<Map<String, Object>> items = issuedRepository.findByUserOrderByIssuedAtDesc(user).stream()
                .map(c -> issuedView(c, true))
                .toList();
        return Map.of("items", items, "total", items.size());
    }

    @Transactional
    public Map<String, Object> startAttempt(String slug, String username) {
        User user = user(username);
        CertificateDefinition d = definition(slug);
        if (issuedRepository.existsByUserAndDefinition(user, d)) {
            throw new IllegalArgumentException("This certificate has already been issued");
        }
        Map<String, Object> card = certificateCard(d, user);
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> checklist = (List<Map<String, Object>>) card.get("requirements");
        boolean preparationMet = checklist.stream()
                .filter(r -> !"assessment".equals(r.get("key")))
                .allMatch(r -> Boolean.TRUE.equals(r.get("met")));
        if (!preparationMet) {
            throw new IllegalArgumentException("Complete all preparation requirements before starting the assessment");
        }
        Optional<CertificateAttempt> active = attemptRepository
                .findFirstByUserAndDefinitionAndStatusOrderByAttemptNumberDesc(user, d, "IN_PROGRESS");
        if (active.isPresent()) return attemptView(active.get());

        long attempts = attemptRepository.countByUserAndDefinition(user, d);
        if (attempts >= d.getAttemptLimit()) {
            throw new IllegalArgumentException("Attempt limit reached for this certificate assessment");
        }
        List<CertificateQuestion> pool = new ArrayList<>(questionRepository.findByDefinitionAndActiveTrue(d));
        if (pool.isEmpty()) throw new IllegalArgumentException("This assessment has no questions configured");
        Collections.shuffle(pool);
        int count = Math.min(d.getAssessmentQuestionCount(), pool.size());
        LocalDateTime now = LocalDateTime.now();
        CertificateAttempt attempt = attemptRepository.save(CertificateAttempt.builder()
                .user(user)
                .definition(d)
                .attemptNumber((int) attempts + 1)
                .status("IN_PROGRESS")
                .startedAt(now)
                .expiresAt(now.plusMinutes(d.getAssessmentDurationMinutes()))
                .totalQuestions(count)
                .build());
        for (CertificateQuestion q : pool.subList(0, count)) {
            answerRepository.save(CertificateAttemptAnswer.builder()
                    .attempt(attempt)
                    .question(q)
                    .build());
        }
        return attemptView(attempt);
    }

    @Transactional
    public Map<String, Object> attempt(Long attemptId, String username) {
        User user = user(username);
        CertificateAttempt attempt = attemptRepository.findByIdAndUser(attemptId, user)
                .orElseThrow(() -> new IllegalArgumentException("Assessment attempt not found"));
        return attemptView(attempt);
    }

    @Transactional
    public Map<String, Object> saveAnswer(Long attemptId, Long questionId, String username, Integer selectedOption) {
        User user = user(username);
        CertificateAttempt attempt = attemptRepository.findByIdAndUser(attemptId, user)
                .orElseThrow(() -> new IllegalArgumentException("Assessment attempt not found"));
        if (!"IN_PROGRESS".equals(attempt.getStatus()))
            throw new IllegalArgumentException("This assessment has already been submitted");
        if (LocalDateTime.now().isAfter(attempt.getExpiresAt())) {
            attempt.setStatus("EXPIRED");
            attemptRepository.save(attempt);
            throw new IllegalArgumentException("Time is up for this assessment");
        }
        CertificateAttemptAnswer answer = answerRepository.findByAttempt(attempt).stream()
                .filter(a -> a.getQuestion().getId().equals(questionId))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("Question does not belong to this attempt"));
        List<String> opts = options(answer.getQuestion());
        if (selectedOption != null && (selectedOption < 0 || selectedOption >= opts.size()))
            throw new IllegalArgumentException("Selected option is invalid");
        answer.setSelectedOption(selectedOption);
        answerRepository.save(answer);
        return Map.of("saved", true, "questionId", questionId, "selectedOption",
                selectedOption == null ? -1 : selectedOption);
    }

    @Transactional
    public Map<String, Object> submitAttempt(Long attemptId, String username) {
        User user = user(username);
        CertificateAttempt attempt = attemptRepository.findByIdAndUser(attemptId, user)
                .orElseThrow(() -> new IllegalArgumentException("Assessment attempt not found"));
        if (!"IN_PROGRESS".equals(attempt.getStatus()))
            throw new IllegalArgumentException("This assessment has already been submitted");
        return scoreAttempt(attempt, LocalDateTime.now().isAfter(attempt.getExpiresAt()));
    }

    @Transactional
    public Map<String, Object> attemptResult(Long attemptId, String username) {
        User user = user(username);
        CertificateAttempt attempt = attemptRepository.findByIdAndUser(attemptId, user)
                .orElseThrow(() -> new IllegalArgumentException("Assessment attempt not found"));
        if ("IN_PROGRESS".equals(attempt.getStatus())) {
            if (LocalDateTime.now().isAfter(attempt.getExpiresAt())) {
                scoreAttempt(attempt, true);
            } else {
                throw new IllegalArgumentException("Submit the assessment before viewing the result");
            }
        }
        return resultView(attempt);
    }

    @Transactional
    public Map<String, Object> claim(String slug, String username) {
        User user = user(username);
        CertificateDefinition d = definition(slug);
        if (issuedRepository.existsByUserAndDefinition(user, d)) {
            return issuedView(issuedRepository.findByUserAndDefinition(user, d).orElseThrow(), true);
        }
        Map<String, Object> card = certificateCard(d, user);
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> requirements = (List<Map<String, Object>>) card.get("requirements");
        if (requirements.stream().anyMatch(r -> !Boolean.TRUE.equals(r.get("met")))) {
            throw new IllegalArgumentException("You are not eligible for this certificate yet");
        }
        Optional<CertificateAttempt> passed = attemptRepository
                .findFirstByUserAndDefinitionAndPassedTrueOrderBySubmittedAtDesc(user, d);
        if (passed.isEmpty()) {
            throw new IllegalArgumentException("Pass the certificate assessment before claiming");
        }
        IssuedCertificate certificate = issuedRepository.save(IssuedCertificate.builder()
                .user(user)
                .definition(d)
                .certificateNumber(uniqueCertificateNumber(d))
                .verificationCode(uniqueVerificationCode())
                .issuedAt(LocalDateTime.now())
                .scorePercent(passed.get().getScorePercent())
                .status("ACTIVE")
                .build());
        return issuedView(certificate, true);
    }

    @Transactional(readOnly = true)
    public Map<String, Object> issued(String certificateNumber, String username) {
        User user = user(username);
        IssuedCertificate certificate = issuedRepository.findByCertificateNumber(certificateNumber)
                .filter(c -> c.getUser().getId().equals(user.getId()))
                .orElseThrow(() -> new IllegalArgumentException("Certificate not found"));
        return issuedView(certificate, true);
    }

    @Transactional(readOnly = true)
    public byte[] download(String certificateNumber, String username) {
        User user = user(username);
        IssuedCertificate certificate = issuedRepository.findByCertificateNumber(certificateNumber)
                .filter(c -> c.getUser().getId().equals(user.getId()))
                .orElseThrow(() -> new IllegalArgumentException("Certificate not found"));
        return pdfService.generate(certificate);
    }

    /**
     * Public verification. Only certificate-safe fields are returned; no email,
     * password, user id or other account data is exposed.
     */
    @Transactional(readOnly = true)
    public Map<String, Object> verify(String verificationCode) {
        IssuedCertificate certificate = issuedRepository.findByVerificationCode(verificationCode)
                .orElseThrow(() -> new IllegalArgumentException("Certificate not found"));
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("valid", "ACTIVE".equals(certificate.getStatus()));
        result.put("status", certificate.getStatus());
        result.put("certificateNumber", certificate.getCertificateNumber());
        result.put("studentName", certificate.getUser().getUsername());
        result.put("title", certificate.getDefinition().getTitle());
        result.put("category", certificate.getDefinition().getCategory());
        result.put("issuedAt", certificate.getIssuedAt());
        result.put("scorePercent", certificate.getScorePercent());
        result.put("issuer", "SRH CodeVerse");
        return result;
    }

    @Transactional(readOnly = true)
    public Map<String, Object> attempts(String slug, String username) {
        User user = user(username);
        CertificateDefinition d = definition(slug);
        List<Map<String, Object>> items = attemptRepository
                .findByUserAndDefinitionOrderByAttemptNumberDesc(user, d).stream()
                .map(a -> Map.<String, Object>of(
                        "id", a.getId(),
                        "attemptNumber", a.getAttemptNumber(),
                        "status", a.getStatus(),
                        "scorePercent", a.getScorePercent() == null ? -1 : a.getScorePercent(),
                        "passed", a.getPassed(),
                        "startedAt", a.getStartedAt(),
                        "submittedAt", a.getSubmittedAt() == null ? "" : a.getSubmittedAt()))
                .toList();
        return Map.of("items", items, "total", items.size(),
                "attemptLimit", d.getAttemptLimit(),
                "usedAttempts", attemptRepository.countByUserAndDefinition(user, d));
    }

    private Map<String, Object> scoreAttempt(CertificateAttempt attempt, boolean timedOut) {
        List<CertificateAttemptAnswer> answers = answerRepository.findByAttempt(attempt);
        int correct = 0;
        for (CertificateAttemptAnswer a : answers) {
            boolean isCorrect = a.getSelectedOption() != null
                    && Objects.equals(a.getSelectedOption(), a.getQuestion().getCorrectOption());
            a.setCorrect(isCorrect);
            answerRepository.save(a);
            if (isCorrect) correct++;
        }
        int total = answers.size();
        int score = total == 0 ? 0 : (int) Math.round(correct * 100.0 / total);
        attempt.setCorrectCount(correct);
        attempt.setTotalQuestions(total);
        attempt.setScorePercent(score);
        attempt.setPassed(score >= attempt.getDefinition().getAssessmentPassScore());
        attempt.setStatus("SUBMITTED");
        attempt.setSubmittedAt(LocalDateTime.now());
        attemptRepository.save(attempt);
        Map<String, Object> result = resultView(attempt);
        result.put("timedOut", timedOut);
        return result;
    }

    private Map<String, Object> resultView(CertificateAttempt attempt) {
        List<CertificateAttemptAnswer> answers = answerRepository.findByAttempt(attempt);
        List<Map<String, Object>> items = answers.stream().map(a -> {
            Map<String, Object> item = new LinkedHashMap<>();
            item.put("questionId", a.getQuestion().getId());
            item.put("prompt", a.getQuestion().getPrompt());
            item.put("options", options(a.getQuestion()));
            item.put("selectedOption", a.getSelectedOption());
            item.put("correctOption", a.getQuestion().getCorrectOption());
            item.put("correct", a.getCorrect());
            item.put("explanation", a.getQuestion().getExplanation());
            return item;
        }).toList();
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("id", attempt.getId());
        result.put("certificateSlug", attempt.getDefinition().getSlug());
        result.put("certificateTitle", attempt.getDefinition().getTitle());
        result.put("status", attempt.getStatus());
        result.put("scorePercent", attempt.getScorePercent());
        result.put("passScore", attempt.getDefinition().getAssessmentPassScore());
        result.put("passed", attempt.getPassed());
        result.put("correctCount", attempt.getCorrectCount());
        result.put("totalQuestions", attempt.getTotalQuestions());
        result.put("startedAt", attempt.getStartedAt());
        result.put("submittedAt", attempt.getSubmittedAt());
        result.put("questions", items);
        return result;
    }

    private Map<String, Object> attemptView(CertificateAttempt attempt) {
        List<CertificateAttemptAnswer> answers = answerRepository.findByAttempt(attempt);
        List<Map<String, Object>> items = answers.stream().map(a -> {
            Map<String, Object> item = new LinkedHashMap<>();
            item.put("questionId", a.getQuestion().getId());
            item.put("prompt", a.getQuestion().getPrompt());
            item.put("options", options(a.getQuestion()));
            item.put("selectedOption", a.getSelectedOption());
            return item;
        }).toList();
        long remaining = Math.max(0, Duration.between(LocalDateTime.now(), attempt.getExpiresAt()).getSeconds());
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("id", attempt.getId());
        result.put("certificateSlug", attempt.getDefinition().getSlug());
        result.put("certificateTitle", attempt.getDefinition().getTitle());
        result.put("status", attempt.getStatus());
        result.put("attemptNumber", attempt.getAttemptNumber());
        result.put("durationMinutes", attempt.getDefinition().getAssessmentDurationMinutes());
        result.put("startedAt", attempt.getStartedAt());
        result.put("expiresAt", attempt.getExpiresAt());
        result.put("remainingSeconds", remaining);
        result.put("questions", items);
        return result;
    }

    private Map<String, Object> certificateCard(CertificateDefinition d, User user) {
        List<Map<String, Object>> requirements = new ArrayList<>();

        List<String> courseSlugs = RoadmapService.split(d.getRequiredCourseSlugs());
        int totalLessons = 0;
        int completedLessons = 0;
        for (String slug : courseSlugs) {
            Optional<Course> course = courseRepository.findBySlug(slug);
            if (course.isEmpty()) continue;
            List<CourseLesson> lessons = lessonRepository
                    .findByCourseOrderByModuleOrderAscLessonOrderAsc(course.get());
            totalLessons += lessons.size();
            CourseProgress progress = courseProgressRepository.findByUserAndCourse(user, course.get()).orElse(null);
            if (progress != null && progress.getCompletedLessonIds() != null
                    && !progress.getCompletedLessonIds().isBlank()) {
                completedLessons += progress.getCompletedLessonIds().split(",").length;
            }
        }
        int lessonPercent = RoadmapService.percent(completedLessons, totalLessons);
        requirements.add(requirement("lessons",
                "Complete at least " + d.getRequiredLessonPercent() + "% of the required lessons",
                lessonPercent, d.getRequiredLessonPercent(),
                totalLessons > 0 && lessonPercent >= d.getRequiredLessonPercent(),
                completedLessons + "/" + totalLessons + " lessons completed"));

        Set<Long> solvedIds = new HashSet<>(submissionRepository.findDistinctSolvedProblemIds(user));
        int solved = solvedIds.size();
        requirements.add(requirement("problems",
                "Solve at least " + d.getRequiredSolvedProblems() + " coding problems",
                solved, d.getRequiredSolvedProblems(),
                solved >= d.getRequiredSolvedProblems(),
                solved + " unique problems solved"));

        List<String> topics = RoadmapService.split(d.getRequiredProblemTopics());
        if (!topics.isEmpty()) {
            long topicSolved = problemRepository.findAll().stream()
                    .filter(p -> solvedIds.contains(p.getId()))
                    .filter(p -> topics.stream().anyMatch(t ->
                            RoadmapService.normalize(p.getTopic()).contains(RoadmapService.normalize(t))))
                    .count();
            requirements.add(requirement("topics",
                    "Solve problems in: " + String.join(", ", topics),
                    (int) topicSolved, 1, topicSolved > 0,
                    topicSolved + " solved in the required topics"));
        }

        if (d.getRequiredInterviewCategory() != null && !d.getRequiredInterviewCategory().isBlank()) {
            int best = interviewSessionRepository.bestScore(user, d.getRequiredInterviewCategory());
            requirements.add(requirement("interview",
                    "Score at least " + d.getRequiredInterviewScore() + "% in a "
                            + d.getRequiredInterviewCategory() + " interview",
                    best, d.getRequiredInterviewScore(),
                    best >= d.getRequiredInterviewScore(),
                    best == 0 ? "No submitted interview yet" : "Best score: " + best + "%"));
        }

        Optional<CertificateAttempt> passedAttempt = attemptRepository
                .findFirstByUserAndDefinitionAndPassedTrueOrderBySubmittedAtDesc(user, d);
        int bestAssessment = attemptRepository.findByUserAndDefinitionOrderByAttemptNumberDesc(user, d).stream()
                .filter(a -> a.getScorePercent() != null)
                .mapToInt(CertificateAttempt::getScorePercent).max().orElse(0);
        requirements.add(requirement("assessment",
                "Pass the certificate assessment with " + d.getAssessmentPassScore() + "% or higher",
                bestAssessment, d.getAssessmentPassScore(),
                passedAttempt.isPresent(),
                passedAttempt.isPresent() ? "Passed with " + passedAttempt.get().getScorePercent() + "%"
                        : (bestAssessment > 0 ? "Best attempt: " + bestAssessment + "%" : "Not attempted")));

        boolean eligible = requirements.stream().allMatch(r -> Boolean.TRUE.equals(r.get("met")));
        boolean preparationMet = requirements.stream()
                .filter(r -> !"assessment".equals(r.get("key")))
                .allMatch(r -> Boolean.TRUE.equals(r.get("met")));
        IssuedCertificate issued = issuedRepository.findByUserAndDefinition(user, d).orElse(null);

        Map<String, Object> card = new LinkedHashMap<>();
        card.put("id", d.getId());
        card.put("slug", d.getSlug());
        card.put("title", d.getTitle());
        card.put("description", d.getDescription());
        card.put("category", d.getCategory());
        card.put("icon", d.getIcon());
        card.put("accent", d.getAccent());
        card.put("skills", RoadmapService.split(d.getSkills()));
        card.put("assessmentPassScore", d.getAssessmentPassScore());
        card.put("assessmentQuestionCount", d.getAssessmentQuestionCount());
        card.put("assessmentDurationMinutes", d.getAssessmentDurationMinutes());
        card.put("attemptLimit", d.getAttemptLimit());
        card.put("usedAttempts", attemptRepository.countByUserAndDefinition(user, d));
        card.put("requirements", requirements);
        card.put("preparationMet", preparationMet);
        card.put("eligible", eligible);
        card.put("issued", issued != null);
        card.put("certificate", issued == null ? null : issuedView(issued, true));
        card.put("bestAssessmentScore", bestAssessment);
        return card;
    }

    private Map<String, Object> requirement(String key, String label, int current, int required,
                                            boolean met, String detail) {
        Map<String, Object> item = new LinkedHashMap<>();
        item.put("key", key);
        item.put("label", label);
        item.put("current", current);
        item.put("required", required);
        item.put("met", met);
        item.put("detail", detail);
        return item;
    }

    private Map<String, Object> issuedView(IssuedCertificate c, boolean includeVerification) {
        Map<String, Object> item = new LinkedHashMap<>();
        item.put("certificateNumber", c.getCertificateNumber());
        item.put("title", c.getDefinition().getTitle());
        item.put("category", c.getDefinition().getCategory());
        item.put("studentName", c.getUser().getUsername());
        item.put("issuedAt", c.getIssuedAt());
        item.put("scorePercent", c.getScorePercent());
        item.put("status", c.getStatus());
        item.put("skills", RoadmapService.split(c.getDefinition().getSkills()));
        item.put("accent", c.getDefinition().getAccent());
        if (includeVerification) {
            item.put("verificationCode", c.getVerificationCode());
            item.put("verificationUrl", "/verify/" + c.getVerificationCode());
        }
        return item;
    }

    private String uniqueCertificateNumber(CertificateDefinition d) {
        String prefix = d.getSlug().replaceAll("[^A-Za-z0-9]", "").toUpperCase(Locale.ROOT);
        if (prefix.length() > 8) prefix = prefix.substring(0, 8);
        for (int i = 0; i < 20; i++) {
            String number = "SRH-CV-" + Year.now().getValue() + "-" + prefix + "-" + random(6);
            if (!issuedRepository.existsByCertificateNumber(number)) return number;
        }
        throw new IllegalStateException("Unable to allocate a certificate number");
    }

    private String uniqueVerificationCode() {
        for (int i = 0; i < 20; i++) {
            String code = random(24);
            if (!issuedRepository.existsByVerificationCode(code)) return code;
        }
        throw new IllegalStateException("Unable to allocate a verification code");
    }

    private String random(int length) {
        StringBuilder builder = new StringBuilder(length);
        for (int i = 0; i < length; i++) {
            builder.append(ALPHABET.charAt(RANDOM.nextInt(ALPHABET.length())));
        }
        return builder.toString();
    }
}
