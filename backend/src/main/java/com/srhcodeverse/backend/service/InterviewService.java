package com.srhcodeverse.backend.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.srhcodeverse.backend.entity.*;
import com.srhcodeverse.backend.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class InterviewService {

    public static final List<String> CATEGORIES = List.of(
            "JAVA", "DSA", "SQL", "SPRING", "REACT", "FULLSTACK", "HR");

    private final InterviewQuestionRepository questionRepository;
    private final InterviewSessionRepository sessionRepository;
    private final InterviewSessionQuestionRepository sessionQuestionRepository;
    private final UserRepository userRepository;
    private final ObjectMapper objectMapper;

    public InterviewService(InterviewQuestionRepository questionRepository,
                            InterviewSessionRepository sessionRepository,
                            InterviewSessionQuestionRepository sessionQuestionRepository,
                            UserRepository userRepository,
                            ObjectMapper objectMapper) {
        this.questionRepository = questionRepository;
        this.sessionRepository = sessionRepository;
        this.sessionQuestionRepository = sessionQuestionRepository;
        this.userRepository = userRepository;
        this.objectMapper = objectMapper;
    }

    private User user(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
    }

    private List<String> options(InterviewQuestion q) {
        if (q.getOptionsJson() == null || q.getOptionsJson().isBlank()) return List.of();
        try {
            return objectMapper.readValue(q.getOptionsJson(), new TypeReference<List<String>>() {});
        } catch (Exception ex) {
            return List.of();
        }
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> categories() {
        Map<String, String> labels = Map.of(
                "JAVA", "Java Fundamentals",
                "DSA", "DSA & Problem Solving",
                "SQL", "SQL & Databases",
                "SPRING", "Spring Boot Backend",
                "REACT", "React & Frontend",
                "FULLSTACK", "Full Stack",
                "HR", "HR & Behavioural");
        List<Map<String, Object>> result = new ArrayList<>();
        for (String category : CATEGORIES) {
            Map<String, Object> item = new LinkedHashMap<>();
            item.put("code", category);
            item.put("name", labels.get(category));
            item.put("questionCount", questionRepository.countByActiveTrueAndCategory(category));
            item.put("easy", questionRepository.countByActiveTrueAndCategoryAndDifficulty(category, "EASY"));
            item.put("medium", questionRepository.countByActiveTrueAndCategoryAndDifficulty(category, "MEDIUM"));
            item.put("hard", questionRepository.countByActiveTrueAndCategoryAndDifficulty(category, "HARD"));
            result.add(item);
        }
        return result;
    }

    @Transactional(readOnly = true)
    public Map<String, Object> questions(String category, String difficulty, String search, int page, int size) {
        String term = RoadmapService.normalize(search);
        List<InterviewQuestion> all = questionRepository.findByActiveTrueOrderByIdAsc().stream()
                .filter(q -> category == null || category.isBlank() || "ALL".equalsIgnoreCase(category)
                        || q.getCategory().equalsIgnoreCase(category))
                .filter(q -> difficulty == null || difficulty.isBlank() || "ALL".equalsIgnoreCase(difficulty)
                        || q.getDifficulty().equalsIgnoreCase(difficulty))
                .filter(q -> term.isEmpty() || RoadmapService.normalize(q.getPrompt()).contains(term)
                        || RoadmapService.normalize(q.getTopic()).contains(term))
                .toList();
        int safeSize = Math.max(1, Math.min(size, 50));
        int safePage = Math.max(0, page);
        int from = Math.min(safePage * safeSize, all.size());
        int to = Math.min(from + safeSize, all.size());
        List<Map<String, Object>> items = all.subList(from, to).stream().map(q -> {
            Map<String, Object> item = new LinkedHashMap<>();
            item.put("id", q.getId());
            item.put("category", q.getCategory());
            item.put("topic", q.getTopic());
            item.put("difficulty", q.getDifficulty());
            item.put("type", q.getType());
            item.put("prompt", q.getPrompt());
            item.put("points", q.getPoints());
            return item;
        }).toList();
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("items", items);
        result.put("total", all.size());
        result.put("page", safePage);
        result.put("size", safeSize);
        return result;
    }

    @Transactional
    public Map<String, Object> start(String username, String category, String difficulty,
                                     Integer questionCount, Integer durationMinutes, String mode) {
        User user = user(username);
        String cat = category == null ? "" : category.toUpperCase(Locale.ROOT);
        if (!CATEGORIES.contains(cat)) throw new IllegalArgumentException("Unsupported interview category");
        String diff = difficulty == null || difficulty.isBlank() ? "MIXED" : difficulty.toUpperCase(Locale.ROOT);
        if (!List.of("EASY", "MEDIUM", "HARD", "MIXED").contains(diff))
            throw new IllegalArgumentException("Difficulty must be EASY, MEDIUM, HARD or MIXED");
        int count = questionCount == null ? 10 : questionCount;
        if (count < 5 || count > 30) throw new IllegalArgumentException("Question count must be between 5 and 30");
        int minutes = durationMinutes == null ? 20 : durationMinutes;
        if (minutes < 5 || minutes > 120) throw new IllegalArgumentException("Duration must be between 5 and 120 minutes");
        String sessionMode = mode == null || mode.isBlank() ? "TIMED" : mode.toUpperCase(Locale.ROOT);
        if (!List.of("PRACTICE", "TIMED").contains(sessionMode))
            throw new IllegalArgumentException("Mode must be PRACTICE or TIMED");

        List<InterviewQuestion> pool = "MIXED".equals(diff)
                ? questionRepository.findByActiveTrueAndCategoryOrderByIdAsc(cat)
                : questionRepository.findByActiveTrueAndCategoryAndDifficultyOrderByIdAsc(cat, diff);
        if (pool.size() < count) {
            pool = questionRepository.findByActiveTrueAndCategoryOrderByIdAsc(cat);
        }
        if (pool.size() < count) {
            throw new IllegalArgumentException("Not enough questions are available for this category yet ("
                    + pool.size() + " available, " + count + " requested)");
        }
        List<InterviewQuestion> selected = new ArrayList<>(pool);
        Collections.shuffle(selected);
        selected = selected.subList(0, count);

        LocalDateTime now = LocalDateTime.now();
        InterviewSession session = sessionRepository.save(InterviewSession.builder()
                .user(user)
                .category(cat)
                .difficulty(diff)
                .mode(sessionMode)
                .questionCount(count)
                .durationMinutes(minutes)
                .status("IN_PROGRESS")
                .startedAt(now)
                .expiresAt(now.plusMinutes(minutes))
                .totalQuestions(count)
                .build());

        int order = 1;
        for (InterviewQuestion q : selected) {
            sessionQuestionRepository.save(InterviewSessionQuestion.builder()
                    .session(session)
                    .question(q)
                    .orderIndex(order++)
                    .flagged(false)
                    .reviewStatus("UNANSWERED")
                    .build());
        }
        return sessionView(session);
    }

    @Transactional
    public Map<String, Object> session(Long id, String username) {
        User user = user(username);
        InterviewSession session = sessionRepository.findByIdAndUser(id, user)
                .orElseThrow(() -> new IllegalArgumentException("Interview session not found"));
        return sessionView(session);
    }

    @Transactional
    public Map<String, Object> saveAnswer(Long sessionId, Long sessionQuestionId, String username,
                                          Integer selectedOption, String answerText, Boolean flagged) {
        User user = user(username);
        InterviewSession session = sessionRepository.findByIdAndUser(sessionId, user)
                .orElseThrow(() -> new IllegalArgumentException("Interview session not found"));
        if (!"IN_PROGRESS".equals(session.getStatus()))
            throw new IllegalArgumentException("This interview session is already submitted");
        if (LocalDateTime.now().isAfter(session.getExpiresAt())) {
            session.setStatus("EXPIRED");
            sessionRepository.save(session);
            throw new IllegalArgumentException("Time is up for this interview session");
        }
        InterviewSessionQuestion sq = sessionQuestionRepository
                .findBySessionOrderByOrderIndexAsc(session).stream()
                .filter(q -> q.getId().equals(sessionQuestionId))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("Question does not belong to this session"));
        if (answerText != null && answerText.length() > 10000)
            throw new IllegalArgumentException("Answer is too long");
        if (selectedOption != null) {
            List<String> options = options(sq.getQuestion());
            if (options.isEmpty() || selectedOption < 0 || selectedOption >= options.size())
                throw new IllegalArgumentException("Selected option is invalid");
        }
        sq.setSelectedOption(selectedOption);
        sq.setAnswerText(answerText);
        if (flagged != null) sq.setFlagged(flagged);
        boolean answered = selectedOption != null || (answerText != null && !answerText.isBlank());
        sq.setAnsweredAt(answered ? LocalDateTime.now() : null);
        sq.setReviewStatus(answered ? "SAVED" : "UNANSWERED");
        sessionQuestionRepository.save(sq);
        return Map.of("saved", true, "sessionQuestionId", sq.getId(), "answered", answered);
    }

    @Transactional
    public Map<String, Object> submit(Long id, String username) {
        User user = user(username);
        InterviewSession session = sessionRepository.findByIdAndUser(id, user)
                .orElseThrow(() -> new IllegalArgumentException("Interview session not found"));
        if (!"IN_PROGRESS".equals(session.getStatus()))
            throw new IllegalArgumentException("This interview session has already been submitted");
        boolean timedOut = LocalDateTime.now().isAfter(session.getExpiresAt());
        return scoreAndSave(session, timedOut);
    }

    @Transactional
    public Map<String, Object> result(Long id, String username) {
        User user = user(username);
        InterviewSession session = sessionRepository.findByIdAndUser(id, user)
                .orElseThrow(() -> new IllegalArgumentException("Interview session not found"));
        if ("IN_PROGRESS".equals(session.getStatus())) {
            if (LocalDateTime.now().isAfter(session.getExpiresAt())) {
                scoreAndSave(session, true);
            } else {
                throw new IllegalArgumentException("Submit the interview before viewing the result");
            }
        }
        return resultView(session);
    }

    @Transactional(readOnly = true)
    public Map<String, Object> history(String username, int page, int size) {
        User user = user(username);
        List<InterviewSession> all = sessionRepository.findByUserOrderByStartedAtDesc(user);
        int safeSize = Math.max(1, Math.min(size, 50));
        int safePage = Math.max(0, page);
        int from = Math.min(safePage * safeSize, all.size());
        int to = Math.min(from + safeSize, all.size());
        List<Map<String, Object>> items = all.subList(from, to).stream().map(s -> {
            Map<String, Object> item = new LinkedHashMap<>();
            item.put("id", s.getId());
            item.put("category", s.getCategory());
            item.put("difficulty", s.getDifficulty());
            item.put("mode", s.getMode());
            item.put("status", s.getStatus());
            item.put("questionCount", s.getQuestionCount());
            item.put("durationMinutes", s.getDurationMinutes());
            item.put("startedAt", s.getStartedAt());
            item.put("submittedAt", s.getSubmittedAt());
            item.put("scorePercent", s.getScorePercent());
            item.put("correctCount", s.getCorrectCount());
            return item;
        }).toList();
        return Map.of("items", items, "total", all.size(), "page", safePage, "size", safeSize);
    }

    @Transactional(readOnly = true)
    public Map<String, Object> analytics(String username) {
        User user = user(username);
        List<InterviewSession> sessions = sessionRepository.findByUserOrderByStartedAtDesc(user).stream()
                .filter(s -> !"IN_PROGRESS".equals(s.getStatus()))
                .toList();
        Map<String, List<Integer>> byCategory = new LinkedHashMap<>();
        for (InterviewSession s : sessions) {
            if (s.getScorePercent() != null) {
                byCategory.computeIfAbsent(s.getCategory(), k -> new ArrayList<>()).add(s.getScorePercent());
            }
        }
        List<Map<String, Object>> categories = byCategory.entrySet().stream().map(e -> Map.<String, Object>of(
                "category", e.getKey(),
                "attempts", e.getValue().size(),
                "bestScore", e.getValue().stream().mapToInt(Integer::intValue).max().orElse(0),
                "averageScore", (int) Math.round(e.getValue().stream().mapToInt(Integer::intValue).average().orElse(0))
        )).toList();
        int average = (int) Math.round(sessions.stream()
                .filter(s -> s.getScorePercent() != null)
                .mapToInt(InterviewSession::getScorePercent).average().orElse(0));
        return Map.of(
                "submittedSessions", sessions.size(),
                "averageScore", average,
                "bestScore", sessions.stream().filter(s -> s.getScorePercent() != null)
                        .mapToInt(InterviewSession::getScorePercent).max().orElse(0),
                "categories", categories);
    }

    private Map<String, Object> scoreAndSave(InterviewSession session, boolean timedOut) {
        List<InterviewSessionQuestion> questions = sessionQuestionRepository
                .findBySessionOrderByOrderIndexAsc(session);
        int earned = 0;
        int max = 0;
        int correct = 0;
        int scored = 0;
        for (InterviewSessionQuestion sq : questions) {
            InterviewQuestion q = sq.getQuestion();
            String type = q.getType() == null ? "SHORT" : q.getType();
            if ("HR".equals(type)) {
                sq.setCorrect(null);
                sq.setAwardedPoints(0);
                sq.setReviewStatus("SELF_REVIEW");
                sessionQuestionRepository.save(sq);
                continue;
            }
            max += q.getPoints() == null ? 1 : q.getPoints();
            scored++;
            if ("MCQ".equals(type)) {
                boolean isCorrect = sq.getSelectedOption() != null
                        && Objects.equals(sq.getSelectedOption(), q.getCorrectOption());
                sq.setCorrect(isCorrect);
                sq.setAwardedPoints(isCorrect ? (q.getPoints() == null ? 1 : q.getPoints()) : 0);
                sq.setReviewStatus(isCorrect ? "CORRECT" : "INCORRECT");
                if (isCorrect) {
                    correct++;
                    earned += sq.getAwardedPoints();
                }
            } else {
                if (sq.getAnswerText() == null || sq.getAnswerText().isBlank()) {
                    sq.setCorrect(false);
                    sq.setAwardedPoints(0);
                    sq.setReviewStatus("UNANSWERED");
                } else {
                    List<String> keywords = RoadmapService.split(q.getRubric());
                    long matched = keywords.stream()
                            .filter(k -> RoadmapService.normalize(sq.getAnswerText())
                                    .contains(RoadmapService.normalize(k)))
                            .count();
                    double ratio = keywords.isEmpty() ? 1.0 : (double) matched / keywords.size();
                    int awarded = (int) Math.round((q.getPoints() == null ? 1 : q.getPoints()) * ratio);
                    sq.setAwardedPoints(awarded);
                    sq.setCorrect(ratio >= 0.5);
                    sq.setReviewStatus(ratio >= 0.5 ? "RUBRIC_PASSED" : "RUBRIC_PARTIAL");
                    if (ratio >= 0.5) correct++;
                    earned += awarded;
                }
            }
            sessionQuestionRepository.save(sq);
        }
        session.setStatus("SUBMITTED");
        session.setSubmittedAt(LocalDateTime.now());
        session.setEarnedPoints(earned);
        session.setMaxPoints(max);
        session.setScoredQuestions(scored);
        session.setCorrectCount(correct);
        session.setTotalQuestions(questions.size());
        // Behavioural-only rounds have nothing auto-scorable. Reporting 0% would
        // be misleading, so the score stays null and the UI shows a self review.
        session.setScorePercent(max == 0 ? null : (int) Math.round(earned * 100.0 / max));
        sessionRepository.save(session);
        Map<String, Object> result = resultView(session);
        result.put("timedOut", timedOut);
        return result;
    }

    private Map<String, Object> sessionView(InterviewSession session) {
        List<InterviewSessionQuestion> questions = sessionQuestionRepository
                .findBySessionOrderByOrderIndexAsc(session);
        long remaining = Math.max(0, Duration.between(LocalDateTime.now(), session.getExpiresAt()).getSeconds());
        List<Map<String, Object>> items = questions.stream().map(sq -> {
            InterviewQuestion q = sq.getQuestion();
            Map<String, Object> item = new LinkedHashMap<>();
            item.put("sessionQuestionId", sq.getId());
            item.put("questionId", q.getId());
            item.put("order", sq.getOrderIndex());
            item.put("category", q.getCategory());
            item.put("topic", q.getTopic());
            item.put("difficulty", q.getDifficulty());
            item.put("type", q.getType());
            item.put("prompt", q.getPrompt());
            item.put("options", options(q));
            item.put("points", q.getPoints());
            item.put("selectedOption", sq.getSelectedOption());
            item.put("answerText", sq.getAnswerText());
            item.put("flagged", sq.getFlagged());
            item.put("answered", sq.getAnsweredAt() != null);
            return item;
        }).toList();

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("id", session.getId());
        result.put("category", session.getCategory());
        result.put("difficulty", session.getDifficulty());
        result.put("mode", session.getMode());
        result.put("status", session.getStatus());
        result.put("questionCount", session.getQuestionCount());
        result.put("durationMinutes", session.getDurationMinutes());
        result.put("startedAt", session.getStartedAt());
        result.put("expiresAt", session.getExpiresAt());
        result.put("remainingSeconds", remaining);
        result.put("questions", items);
        return result;
    }

    private Map<String, Object> resultView(InterviewSession session) {
        List<InterviewSessionQuestion> questions = sessionQuestionRepository
                .findBySessionOrderByOrderIndexAsc(session);
        Map<String, int[]> topicStats = new LinkedHashMap<>();
        List<Map<String, Object>> items = new ArrayList<>();
        for (InterviewSessionQuestion sq : questions) {
            InterviewQuestion q = sq.getQuestion();
            Map<String, Object> item = new LinkedHashMap<>();
            item.put("sessionQuestionId", sq.getId());
            item.put("order", sq.getOrderIndex());
            item.put("topic", q.getTopic());
            item.put("type", q.getType());
            item.put("prompt", q.getPrompt());
            item.put("options", options(q));
            item.put("selectedOption", sq.getSelectedOption());
            item.put("answerText", sq.getAnswerText());
            item.put("correctOption", q.getCorrectOption());
            item.put("correct", sq.getCorrect());
            item.put("points", q.getPoints());
            item.put("awardedPoints", sq.getAwardedPoints());
            item.put("reviewStatus", sq.getReviewStatus());
            item.put("referenceAnswer", q.getReferenceAnswer());
            item.put("explanation", q.getExplanation());
            items.add(item);
            if (sq.getCorrect() != null) {
                int[] stat = topicStats.computeIfAbsent(q.getTopic(), k -> new int[2]);
                stat[0]++;
                if (Boolean.TRUE.equals(sq.getCorrect())) stat[1]++;
            }
        }
        List<Map<String, Object>> strengths = new ArrayList<>();
        List<Map<String, Object>> weaknesses = new ArrayList<>();
        for (Map.Entry<String, int[]> entry : topicStats.entrySet()) {
            int total = entry.getValue()[0];
            int correct = entry.getValue()[1];
            int percent = RoadmapService.percent(correct, total);
            Map<String, Object> topic = Map.of(
                    "topic", entry.getKey(),
                    "correct", correct,
                    "total", total,
                    "percent", percent);
            if (percent >= 70) strengths.add(topic);
            else weaknesses.add(topic);
        }

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("id", session.getId());
        result.put("category", session.getCategory());
        result.put("difficulty", session.getDifficulty());
        result.put("mode", session.getMode());
        result.put("status", session.getStatus());
        result.put("startedAt", session.getStartedAt());
        result.put("submittedAt", session.getSubmittedAt());
        result.put("scorePercent", session.getScorePercent());
        result.put("correctCount", session.getCorrectCount());
        result.put("totalQuestions", session.getTotalQuestions());
        result.put("scoredQuestions", session.getScoredQuestions());
        result.put("earnedPoints", session.getEarnedPoints());
        result.put("maxPoints", session.getMaxPoints());
        result.put("strengths", strengths);
        result.put("weaknesses", weaknesses);
        result.put("recommendations", weaknesses.stream()
                .map(w -> "Revise " + w.get("topic") + " and try a focused practice round.")
                .toList());
        result.put("questions", items);
        return result;
    }
}
