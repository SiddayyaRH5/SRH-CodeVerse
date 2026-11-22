package com.srhcodeverse.backend.service;

import com.srhcodeverse.backend.entity.*;
import com.srhcodeverse.backend.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class RoadmapService {

    private final RoadmapRepository roadmapRepository;
    private final RoadmapStageRepository stageRepository;
    private final RoadmapTopicRepository topicRepository;
    private final RoadmapEnrollmentRepository enrollmentRepository;
    private final RoadmapTopicProgressRepository progressRepository;
    private final UserRepository userRepository;

    public RoadmapService(RoadmapRepository roadmapRepository,
                          RoadmapStageRepository stageRepository,
                          RoadmapTopicRepository topicRepository,
                          RoadmapEnrollmentRepository enrollmentRepository,
                          RoadmapTopicProgressRepository progressRepository,
                          UserRepository userRepository) {
        this.roadmapRepository = roadmapRepository;
        this.stageRepository = stageRepository;
        this.topicRepository = topicRepository;
        this.enrollmentRepository = enrollmentRepository;
        this.progressRepository = progressRepository;
        this.userRepository = userRepository;
    }

    private User user(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
    }

    private Roadmap roadmap(String slug) {
        return roadmapRepository.findBySlug(slug)
                .filter(Roadmap::getActive)
                .orElseThrow(() -> new IllegalArgumentException("Roadmap not found"));
    }

    @Transactional(readOnly = true)
    public Map<String, Object> catalog(String username, String search, String category,
                                       String difficulty, int page, int size) {
        User user = user(username);
        String term = normalize(search);
        List<Roadmap> all = roadmapRepository.findByActiveTrueOrderBySortOrderAsc().stream()
                .filter(r -> term.isEmpty()
                        || normalize(r.getTitle()).contains(term)
                        || normalize(r.getShortDescription()).contains(term)
                        || normalize(r.getSkills()).contains(term))
                .filter(r -> category == null || category.isBlank() || "ALL".equalsIgnoreCase(category)
                        || r.getCategory().equalsIgnoreCase(category))
                .filter(r -> difficulty == null || difficulty.isBlank() || "ALL".equalsIgnoreCase(difficulty)
                        || r.getDifficulty().equalsIgnoreCase(difficulty))
                .toList();

        int safeSize = Math.max(1, Math.min(size, 50));
        int safePage = Math.max(0, page);
        int from = Math.min(safePage * safeSize, all.size());
        int to = Math.min(from + safeSize, all.size());
        List<Map<String, Object>> items = all.subList(from, to).stream()
                .map(r -> catalogItem(r, user))
                .toList();

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("items", items);
        result.put("page", safePage);
        result.put("size", safeSize);
        result.put("total", all.size());
        result.put("categories", categories());
        return result;
    }

    @Transactional(readOnly = true)
    public Map<String, Object> my(String username) {
        User user = user(username);
        List<Map<String, Object>> items = enrollmentRepository.findByUserOrderByEnrolledAtDesc(user).stream()
                .map(e -> detail(e.getRoadmap(), user, e))
                .toList();
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("items", items);
        result.put("total", items.size());
        return result;
    }

    @Transactional(readOnly = true)
    public Map<String, Object> detail(String slug, String username) {
        User user = user(username);
        Roadmap r = roadmap(slug);
        RoadmapEnrollment enrollment = enrollmentRepository.findByUserAndRoadmap(user, r).orElse(null);
        return detail(r, user, enrollment);
    }

    @Transactional
    public Map<String, Object> enroll(String slug, String username) {
        User user = user(username);
        Roadmap r = roadmap(slug);
        RoadmapEnrollment enrollment = enrollmentRepository.findByUserAndRoadmap(user, r)
                .orElseGet(() -> enrollmentRepository.save(RoadmapEnrollment.builder()
                        .user(user)
                        .roadmap(r)
                        .status("ACTIVE")
                        .enrolledAt(LocalDateTime.now())
                        .build()));
        return detail(r, user, enrollment);
    }

    @Transactional
    public Map<String, Object> unenroll(String slug, String username) {
        User user = user(username);
        Roadmap r = roadmap(slug);
        RoadmapEnrollment enrollment = enrollmentRepository.findByUserAndRoadmap(user, r)
                .orElseThrow(() -> new IllegalArgumentException("You are not enrolled in this roadmap"));
        long completed = progressRepository.countByEnrollmentAndCompletedTrue(enrollment);
        if (completed > 0) {
            throw new IllegalArgumentException(
                    "Progress already exists. Complete or keep this roadmap instead of removing it.");
        }
        progressRepository.deleteByEnrollment(enrollment);
        enrollmentRepository.delete(enrollment);
        return Map.of("unenrolled", true, "roadmap", r.getSlug());
    }

    @Transactional
    public Map<String, Object> updateTopic(String slug, Long topicId, String username, boolean completed) {
        User user = user(username);
        Roadmap r = roadmap(slug);
        RoadmapEnrollment enrollment = enrollmentRepository.findByUserAndRoadmap(user, r)
                .orElseThrow(() -> new IllegalArgumentException("Enroll in this roadmap first"));
        RoadmapTopic topic = topicRepository.findById(topicId)
                .orElseThrow(() -> new IllegalArgumentException("Topic not found"));
        if (!topic.getStage().getRoadmap().getId().equals(r.getId())) {
            throw new IllegalArgumentException("Topic does not belong to this roadmap");
        }

        Map<String, Object> before = detail(r, user, enrollment);
        String stageStatus = stageStatusFromDetail(before, topic.getStage().getId());
        if (completed && "LOCKED".equals(stageStatus)) {
            throw new IllegalArgumentException("Complete the prerequisite stages before starting this stage");
        }

        RoadmapTopicProgress progress = progressRepository.findByEnrollmentAndTopic(enrollment, topic)
                .orElseGet(() -> RoadmapTopicProgress.builder()
                        .enrollment(enrollment)
                        .topic(topic)
                        .completed(false)
                        .build());
        progress.setCompleted(completed);
        progress.setCompletedAt(completed ? LocalDateTime.now() : null);
        progressRepository.save(progress);

        List<RoadmapStage> stages = stageRepository.findByRoadmapOrderByStageOrderAsc(r);
        List<RoadmapTopic> allTopics = topicRepository.findByStageInOrderByStageStageOrderAscTopicOrderAsc(stages);
        long done = progressRepository.findByEnrollment(enrollment).stream()
                .filter(p -> Boolean.TRUE.equals(p.getCompleted()))
                .count();
        if (!allTopics.isEmpty() && done == allTopics.size()) {
            enrollment.setStatus("COMPLETED");
            enrollment.setCompletedAt(LocalDateTime.now());
        } else {
            enrollment.setStatus("ACTIVE");
            enrollment.setCompletedAt(null);
        }
        enrollmentRepository.save(enrollment);
        return detail(r, user, enrollment);
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> categories() {
        return roadmapRepository.findByActiveTrueOrderBySortOrderAsc().stream()
                .collect(Collectors.groupingBy(Roadmap::getCategory, LinkedHashMap::new, Collectors.counting()))
                .entrySet().stream()
                .map(e -> Map.<String, Object>of("name", e.getKey(), "count", e.getValue()))
                .toList();
    }

    private Map<String, Object> catalogItem(Roadmap r, User user) {
        List<RoadmapStage> stages = stageRepository.findByRoadmapOrderByStageOrderAsc(r);
        long topicCount = stages.stream().mapToLong(topicRepository::countByStage).sum();
        RoadmapEnrollment enrollment = enrollmentRepository.findByUserAndRoadmap(user, r).orElse(null);
        long completed = enrollment == null ? 0 : progressRepository.countByEnrollmentAndCompletedTrue(enrollment);

        Map<String, Object> item = new LinkedHashMap<>();
        item.put("id", r.getId());
        item.put("slug", r.getSlug());
        item.put("title", r.getTitle());
        item.put("shortDescription", r.getShortDescription());
        item.put("category", r.getCategory());
        item.put("difficulty", r.getDifficulty());
        item.put("estimatedHours", r.getEstimatedHours());
        item.put("skills", split(r.getSkills()));
        item.put("icon", r.getIcon());
        item.put("accent", r.getAccent());
        item.put("stageCount", stages.size());
        item.put("topicCount", topicCount);
        item.put("enrolled", enrollment != null);
        item.put("status", enrollment == null ? "NOT_STARTED" : enrollment.getStatus());
        item.put("progressPercent", percent(completed, topicCount));
        item.put("completedTopics", completed);
        return item;
    }

    private Map<String, Object> detail(Roadmap r, User user, RoadmapEnrollment enrollment) {
        List<RoadmapStage> stages = stageRepository.findByRoadmapOrderByStageOrderAsc(r);
        Map<Long, List<RoadmapTopic>> topicsByStage = topicRepository
                .findByStageInOrderByStageStageOrderAscTopicOrderAsc(stages).stream()
                .collect(Collectors.groupingBy(t -> t.getStage().getId(), LinkedHashMap::new, Collectors.toList()));
        Map<Long, Boolean> completedByTopic = new HashMap<>();
        if (enrollment != null) {
            for (RoadmapTopicProgress p : progressRepository.findByEnrollment(enrollment)) {
                completedByTopic.put(p.getTopic().getId(), Boolean.TRUE.equals(p.getCompleted()));
            }
        }

        Map<Long, Boolean> stageCompleted = new LinkedHashMap<>();
        List<Map<String, Object>> stageDtos = new ArrayList<>();
        Map<String, Object> nextTopic = null;
        int totalTopics = 0;
        int completedTopics = 0;

        for (RoadmapStage stage : stages) {
            List<RoadmapTopic> topics = topicsByStage.getOrDefault(stage.getId(), List.of());
            totalTopics += topics.size();
            List<Map<String, Object>> topicDtos = new ArrayList<>();
            long stageDone = 0;
            for (RoadmapTopic topic : topics) {
                boolean done = Boolean.TRUE.equals(completedByTopic.get(topic.getId()));
                if (done) stageDone++;
                Map<String, Object> t = new LinkedHashMap<>();
                t.put("id", topic.getId());
                t.put("order", topic.getTopicOrder());
                t.put("title", topic.getTitle());
                t.put("description", topic.getDescription());
                t.put("resourceTitle", topic.getResourceTitle());
                t.put("resourceUrl", topic.getResourceUrl());
                t.put("estimatedMinutes", topic.getEstimatedMinutes());
                t.put("completed", done);
                topicDtos.add(t);
            }
            completedTopics += (int) stageDone;
            boolean isCompleted = !topics.isEmpty() && stageDone == topics.size();
            stageCompleted.put(stage.getId(), isCompleted);

            List<Integer> prerequisites = parseInts(stage.getPrerequisiteOrders());
            boolean prerequisitesMet = prerequisites.stream().allMatch(order -> {
                RoadmapStage prereq = stages.stream()
                        .filter(s -> Objects.equals(s.getStageOrder(), order)).findFirst().orElse(null);
                return prereq == null || Boolean.TRUE.equals(stageCompleted.get(prereq.getId()));
            });
            String status;
            if (isCompleted) status = "COMPLETED";
            else if (!prerequisitesMet) status = "LOCKED";
            else if (stageDone > 0) status = "IN_PROGRESS";
            else status = "AVAILABLE";

            Map<String, Object> s = new LinkedHashMap<>();
            s.put("id", stage.getId());
            s.put("order", stage.getStageOrder());
            s.put("title", stage.getTitle());
            s.put("description", stage.getDescription());
            s.put("skills", split(stage.getSkills()));
            s.put("estimatedHours", stage.getEstimatedHours());
            s.put("prerequisites", prerequisites);
            s.put("completionCriteria", stage.getCompletionCriteria());
            s.put("status", status);
            s.put("progressPercent", percent(stageDone, topics.size()));
            s.put("completedTopics", stageDone);
            s.put("totalTopics", topics.size());
            s.put("topics", topicDtos);
            stageDtos.add(s);

            if (nextTopic == null && !"LOCKED".equals(status) && !"COMPLETED".equals(status)) {
                for (Map<String, Object> t : topicDtos) {
                    if (!Boolean.TRUE.equals(t.get("completed"))) {
                        nextTopic = t;
                        break;
                    }
                }
            }
        }

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("id", r.getId());
        result.put("slug", r.getSlug());
        result.put("title", r.getTitle());
        result.put("shortDescription", r.getShortDescription());
        result.put("description", r.getDescription());
        result.put("category", r.getCategory());
        result.put("difficulty", r.getDifficulty());
        result.put("estimatedHours", r.getEstimatedHours());
        result.put("skills", split(r.getSkills()));
        result.put("icon", r.getIcon());
        result.put("accent", r.getAccent());
        result.put("enrolled", enrollment != null);
        result.put("enrollment", enrollment == null ? null : Map.of(
                "status", enrollment.getStatus(),
                "enrolledAt", enrollment.getEnrolledAt(),
                "completedAt", enrollment.getCompletedAt() == null ? "" : enrollment.getCompletedAt()));
        result.put("status", enrollment == null ? "NOT_STARTED" : enrollment.getStatus());
        result.put("progressPercent", percent(completedTopics, totalTopics));
        result.put("completedTopics", completedTopics);
        result.put("totalTopics", totalTopics);
        result.put("nextTopic", nextTopic);
        result.put("stages", stageDtos);
        return result;
    }

    @SuppressWarnings("unchecked")
    private String stageStatusFromDetail(Map<String, Object> detail, Long stageId) {
        List<Map<String, Object>> stages = (List<Map<String, Object>>) detail.get("stages");
        return stages.stream()
                .filter(s -> Objects.equals(s.get("id"), stageId))
                .map(s -> String.valueOf(s.get("status")))
                .findFirst().orElse("LOCKED");
    }

    static String normalize(String value) {
        return value == null ? "" : value.toLowerCase(Locale.ROOT).trim();
    }

    static List<String> split(String value) {
        if (value == null || value.isBlank()) return List.of();
        return Arrays.stream(value.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .toList();
    }

    static List<Integer> parseInts(String value) {
        return split(value).stream().map(Integer::parseInt).toList();
    }

    static int percent(long done, long total) {
        if (total <= 0) return 0;
        return (int) Math.round((done * 100.0) / total);
    }
}
