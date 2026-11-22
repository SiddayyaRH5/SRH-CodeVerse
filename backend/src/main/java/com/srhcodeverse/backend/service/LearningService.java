package com.srhcodeverse.backend.service;

import com.srhcodeverse.backend.entity.*;
import com.srhcodeverse.backend.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class LearningService {

    private final CourseRepository courseRepository;
    private final CourseLessonRepository lessonRepository;
    private final CourseProgressRepository courseProgressRepository;
    private final LessonBookmarkRepository bookmarkRepository;
    private final LessonNoteRepository noteRepository;
    private final UserRepository userRepository;
    private final ProblemRepository problemRepository;
    private final SubmissionRepository submissionRepository;
    private final InterviewSessionRepository interviewSessionRepository;

    public LearningService(CourseRepository courseRepository,
                           CourseLessonRepository lessonRepository,
                           CourseProgressRepository courseProgressRepository,
                           LessonBookmarkRepository bookmarkRepository,
                           LessonNoteRepository noteRepository,
                           UserRepository userRepository,
                           ProblemRepository problemRepository,
                           SubmissionRepository submissionRepository,
                           InterviewSessionRepository interviewSessionRepository) {
        this.courseRepository = courseRepository;
        this.lessonRepository = lessonRepository;
        this.courseProgressRepository = courseProgressRepository;
        this.bookmarkRepository = bookmarkRepository;
        this.noteRepository = noteRepository;
        this.userRepository = userRepository;
        this.problemRepository = problemRepository;
        this.submissionRepository = submissionRepository;
        this.interviewSessionRepository = interviewSessionRepository;
    }

    private User user(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
    }

    private Course course(String slug) {
        return courseRepository.findBySlug(slug)
                .orElseThrow(() -> new IllegalArgumentException("Course not found"));
    }

    private Set<Long> completedIds(CourseProgress progress) {
        if (progress == null || progress.getCompletedLessonIds() == null
                || progress.getCompletedLessonIds().isBlank()) {
            return new HashSet<>();
        }
        return Arrays.stream(progress.getCompletedLessonIds().split(","))
                .map(String::trim).filter(s -> !s.isEmpty())
                .map(Long::valueOf).collect(Collectors.toCollection(LinkedHashSet::new));
    }

    private String joinIds(Set<Long> ids) {
        return ids.stream().sorted().map(String::valueOf).collect(Collectors.joining(","));
    }

    @Transactional(readOnly = true)
    public Map<String, Object> catalog(String username, String search, String category,
                                       String difficulty, int page, int size) {
        User user = user(username);
        String term = RoadmapService.normalize(search);
        List<Course> all = courseRepository.findAll().stream()
                .filter(c -> term.isEmpty()
                        || RoadmapService.normalize(c.getTitle()).contains(term)
                        || RoadmapService.normalize(c.getShortDescription()).contains(term)
                        || RoadmapService.normalize(c.getSkillsGained()).contains(term))
                .filter(c -> category == null || category.isBlank() || "ALL".equalsIgnoreCase(category)
                        || c.getCategory().equalsIgnoreCase(category))
                .filter(c -> difficulty == null || difficulty.isBlank() || "ALL".equalsIgnoreCase(difficulty)
                        || c.getDifficulty().equalsIgnoreCase(difficulty))
                .sorted(Comparator.comparing(Course::getId))
                .toList();

        int safeSize = Math.max(1, Math.min(size, 50));
        int safePage = Math.max(0, page);
        int from = Math.min(safePage * safeSize, all.size());
        int to = Math.min(from + safeSize, all.size());
        List<Map<String, Object>> items = all.subList(from, to).stream()
                .map(c -> courseSummary(c, user))
                .toList();

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("items", items);
        result.put("page", safePage);
        result.put("size", safeSize);
        result.put("total", all.size());
        result.put("categories", all.stream().map(Course::getCategory).distinct()
                .map(c -> Map.<String, Object>of("name", c)).toList());
        return result;
    }

    @Transactional(readOnly = true)
    public Map<String, Object> detail(String slug, String username) {
        User user = user(username);
        return courseDetail(course(slug), user);
    }

    @Transactional
    public Map<String, Object> enroll(String slug, String username) {
        User user = user(username);
        Course c = course(slug);
        CourseProgress progress = courseProgressRepository.findByUserAndCourse(user, c)
                .orElseGet(() -> {
                    List<CourseLesson> lessons = lessonRepository
                            .findByCourseOrderByModuleOrderAscLessonOrderAsc(c);
                    return courseProgressRepository.save(CourseProgress.builder()
                            .user(user)
                            .course(c)
                            .completedLessonIds("")
                            .currentLessonId(lessons.isEmpty() ? null : lessons.get(0).getId())
                            .xpEarned(0)
                            .build());
                });
        return courseDetail(c, user, progress);
    }

    @Transactional(readOnly = true)
    public Map<String, Object> my(String username) {
        User user = user(username);
        List<Map<String, Object>> items = courseProgressRepository.findByUser(user).stream()
                .map(p -> {
                    Map<String, Object> detail = courseDetail(p.getCourse(), user, p);
                    Map<String, Object> item = new LinkedHashMap<>();
                    item.put("courseId", p.getCourse().getId());
                    item.put("slug", p.getCourse().getSlug());
                    item.put("title", p.getCourse().getTitle());
                    item.put("category", p.getCourse().getCategory());
                    item.put("progressPercent", detail.get("progressPercent"));
                    item.put("completedLessons", detail.get("completedLessons"));
                    item.put("totalLessons", detail.get("totalLessons"));
                    item.put("currentLessonId", p.getCurrentLessonId());
                    item.put("currentLessonTitle", detail.get("currentLessonTitle"));
                    item.put("updatedAt", p.getUpdatedAt());
                    return item;
                })
                .sorted(Comparator.comparing(m -> String.valueOf(m.get("title"))))
                .toList();
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("items", items);
        result.put("total", items.size());
        return result;
    }

    @Transactional(readOnly = true)
    public Map<String, Object> lesson(Long lessonId, String username) {
        User user = user(username);
        CourseLesson lesson = lessonRepository.findById(lessonId)
                .orElseThrow(() -> new IllegalArgumentException("Lesson not found"));
        Course c = lesson.getCourse();
        CourseProgress progress = courseProgressRepository.findByUserAndCourse(user, c).orElse(null);
        Set<Long> completed = completedIds(progress);
        List<CourseLesson> lessons = lessonRepository.findByCourseOrderByModuleOrderAscLessonOrderAsc(c);
        int index = -1;
        for (int i = 0; i < lessons.size(); i++) {
            if (lessons.get(i).getId().equals(lessonId)) index = i;
        }

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("id", lesson.getId());
        result.put("courseSlug", c.getSlug());
        result.put("courseTitle", c.getTitle());
        result.put("moduleName", lesson.getModuleName());
        result.put("moduleOrder", lesson.getModuleOrder());
        result.put("lessonOrder", lesson.getLessonOrder());
        result.put("title", lesson.getTitle());
        result.put("description", lesson.getDescription());
        result.put("lessonContent", lesson.getLessonContent());
        result.put("codeExample", lesson.getCodeExample());
        result.put("expectedOutput", lesson.getExpectedOutput());
        result.put("exercise", lesson.getExercise());
        result.put("quiz", lesson.getQuiz());
        result.put("learningObjectives", RoadmapService.split(lesson.getLearningObjectives()));
        result.put("commonMistakes", lesson.getCommonMistakes());
        result.put("resources", RoadmapService.split(lesson.getResources()));
        result.put("videoUrl", lesson.getVideoUrl());
        result.put("estimatedMinutes", lesson.getEstimatedMinutes());
        result.put("completed", completed.contains(lessonId));
        result.put("bookmarked", bookmarkRepository.existsByUserAndLesson(user, lesson));
        result.put("note", noteRepository.findByUserAndLesson(user, lesson)
                .map(LessonNote::getContent).orElse(""));
        result.put("position", index + 1);
        result.put("totalLessons", lessons.size());
        result.put("previousLessonId", index > 0 ? lessons.get(index - 1).getId() : null);
        result.put("nextLessonId", index >= 0 && index < lessons.size() - 1 ? lessons.get(index + 1).getId() : null);
        result.put("courseProgressPercent", RoadmapService.percent(completed.size(), lessons.size()));
        return result;
    }

    @Transactional
    public Map<String, Object> complete(Long lessonId, String username, boolean completed) {
        User user = user(username);
        CourseLesson lesson = lessonRepository.findById(lessonId)
                .orElseThrow(() -> new IllegalArgumentException("Lesson not found"));
        Course c = lesson.getCourse();
        CourseProgress progress = courseProgressRepository.findByUserAndCourse(user, c)
                .orElseGet(() -> CourseProgress.builder()
                        .user(user).course(c).completedLessonIds("").xpEarned(0).build());
        Set<Long> ids = completedIds(progress);
        if (completed) ids.add(lessonId);
        else ids.remove(lessonId);
        progress.setCompletedLessonIds(joinIds(ids));
        progress.setCurrentLessonId(lessonId);
        progress.setXpEarned(ids.size() * 10);
        courseProgressRepository.save(progress);
        return lesson(lessonId, username);
    }

    @Transactional
    public Map<String, Object> toggleBookmark(Long lessonId, String username) {
        User user = user(username);
        CourseLesson lesson = lessonRepository.findById(lessonId)
                .orElseThrow(() -> new IllegalArgumentException("Lesson not found"));
        Optional<LessonBookmark> existing = bookmarkRepository.findByUserAndLesson(user, lesson);
        if (existing.isPresent()) {
            bookmarkRepository.delete(existing.get());
            return Map.of("bookmarked", false, "lessonId", lessonId);
        }
        bookmarkRepository.save(LessonBookmark.builder().user(user).lesson(lesson).build());
        return Map.of("bookmarked", true, "lessonId", lessonId);
    }

    @Transactional
    public Map<String, Object> saveNote(Long lessonId, String username, String content) {
        User user = user(username);
        CourseLesson lesson = lessonRepository.findById(lessonId)
                .orElseThrow(() -> new IllegalArgumentException("Lesson not found"));
        LessonNote note = noteRepository.findByUserAndLesson(user, lesson)
                .orElseGet(() -> LessonNote.builder().user(user).lesson(lesson).content("").build());
        note.setContent(content == null ? "" : content.trim());
        noteRepository.save(note);
        return Map.of("lessonId", lessonId, "content", note.getContent(), "updatedAt", note.getUpdatedAt());
    }

    @Transactional(readOnly = true)
    public Map<String, Object> bookmarks(String username) {
        User user = user(username);
        List<Map<String, Object>> items = bookmarkRepository.findByUserOrderByCreatedAtDesc(user).stream()
                .map(b -> Map.<String, Object>of(
                        "lessonId", b.getLesson().getId(),
                        "title", b.getLesson().getTitle(),
                        "moduleName", b.getLesson().getModuleName(),
                        "courseSlug", b.getLesson().getCourse().getSlug(),
                        "courseTitle", b.getLesson().getCourse().getTitle(),
                        "createdAt", b.getCreatedAt()))
                .toList();
        return Map.of("items", items, "total", items.size());
    }

    @Transactional(readOnly = true)
    public Map<String, Object> progress(String username) {
        User user = user(username);
        List<Map<String, Object>> courses = new ArrayList<>();
        int totalLessons = 0;
        int completedLessons = 0;
        for (Course c : courseRepository.findAll()) {
            CourseProgress p = courseProgressRepository.findByUserAndCourse(user, c).orElse(null);
            if (p == null) continue;
            List<CourseLesson> lessons = lessonRepository.findByCourseOrderByModuleOrderAscLessonOrderAsc(c);
            int done = completedIds(p).size();
            totalLessons += lessons.size();
            completedLessons += done;
            courses.add(Map.of(
                    "slug", c.getSlug(), "title", c.getTitle(),
                    "completedLessons", done, "totalLessons", lessons.size(),
                    "progressPercent", RoadmapService.percent(done, lessons.size())));
        }
        return Map.of(
                "courses", courses,
                "enrolledCourses", courses.size(),
                "completedLessons", completedLessons,
                "totalLessons", totalLessons,
                "overallPercent", RoadmapService.percent(completedLessons, totalLessons),
                "bookmarks", bookmarkRepository.countByUser(user));
    }

    /**
     * Transparent rule-based recommendations. No model or AI service is used:
     * every item includes the concrete rule that produced it.
     */
    @Transactional(readOnly = true)
    public Map<String, Object> recommendations(String username) {
        User user = user(username);
        List<Problem> problems = problemRepository.findAll();
        Set<Long> solvedIds = new HashSet<>(submissionRepository.findDistinctSolvedProblemIds(user));
        List<Submission> submissions = submissionRepository.findByStudentOrderBySubmittedAtDesc(user);

        Map<String, Integer> totals = new HashMap<>();
        Map<String, Integer> solved = new HashMap<>();
        for (Problem p : problems) {
            String topic = RoadmapService.normalize(p.getTopic());
            if (topic.isEmpty()) continue;
            totals.merge(topic, 1, Integer::sum);
            if (solvedIds.contains(p.getId())) solved.merge(topic, 1, Integer::sum);
        }
        Set<String> failedTopics = submissions.stream()
                .filter(s -> s.getStatus() != Submission.Status.PASSED)
                .map(s -> RoadmapService.normalize(s.getProblem().getTopic()))
                .filter(t -> !t.isEmpty())
                .collect(Collectors.toSet());

        List<Map<String, Object>> items = new ArrayList<>();
        Map<String, CourseLesson> lessonsByTopic = new LinkedHashMap<>();
        for (Course c : courseRepository.findAll()) {
            for (CourseLesson lesson : lessonRepository.findByCourseOrderByModuleOrderAscLessonOrderAsc(c)) {
                lessonsByTopic.putIfAbsent(RoadmapService.normalize(lesson.getTitle()), lesson);
            }
        }

        totals.entrySet().stream()
                .filter(e -> solved.getOrDefault(e.getKey(), 0) * 100 / Math.max(1, e.getValue()) < 50)
                .sorted((a, b) -> Integer.compare(
                        solved.getOrDefault(a.getKey(), 0) * 100 / Math.max(1, a.getValue()),
                        solved.getOrDefault(b.getKey(), 0) * 100 / Math.max(1, b.getValue())))
                .limit(5)
                .forEach(e -> {
                    int done = solved.getOrDefault(e.getKey(), 0);
                    String reason = failedTopics.contains(e.getKey())
                            ? "You have failed submissions in " + e.getKey() + " and solved "
                                    + done + " of " + e.getValue() + " available problems."
                            : "You solved " + done + " of " + e.getValue()
                                    + " " + e.getKey() + " problems (below 50% coverage).";
                    CourseLesson lesson = lessonsByTopic.entrySet().stream()
                            .filter(l -> l.getKey().contains(e.getKey()) || e.getKey().contains(l.getKey()))
                            .map(Map.Entry::getValue).findFirst().orElse(null);
                    Map<String, Object> item = new LinkedHashMap<>();
                    item.put("type", "practice");
                    item.put("topic", e.getKey());
                    item.put("title", lesson != null ? lesson.getTitle() : "Practice " + e.getKey());
                    item.put("reason", reason);
                    item.put("priority", 1);
                    if (lesson != null) {
                        item.put("lessonId", lesson.getId());
                        item.put("href", "/courses/" + lesson.getCourse().getSlug()
                                + "/lessons/" + lesson.getId());
                    } else {
                        item.put("href", "/problems?topic=" + e.getKey());
                    }
                    items.add(item);
                });

        for (Course c : courseRepository.findAll()) {
            CourseProgress p = courseProgressRepository.findByUserAndCourse(user, c).orElse(null);
            if (p == null) continue;
            List<CourseLesson> lessons = lessonRepository.findByCourseOrderByModuleOrderAscLessonOrderAsc(c);
            int done = completedIds(p).size();
            if (done < lessons.size()) {
                items.add(Map.of(
                        "type", "course",
                        "title", "Continue " + c.getTitle(),
                        "reason", "You completed " + done + " of " + lessons.size()
                                + " lessons in this enrolled course.",
                        "priority", 2,
                        "href", "/courses/" + c.getSlug()));
            }
        }

        for (String category : List.of("JAVA", "DSA", "SQL", "SPRING", "REACT", "FULLSTACK", "HR")) {
            int best = interviewSessionRepository.bestScore(user, category);
            if (best > 0 && best < 60) {
                items.add(Map.of(
                        "type", "interview",
                        "title", "Revise " + category + " interview topics",
                        "reason", "Your best submitted " + category + " interview score is "
                                + best + "%, below the 60% practice target.",
                        "priority", 3,
                        "href", "/interview-arena?category=" + category));
            }
        }

        items.sort(Comparator.comparingInt(m -> (Integer) m.get("priority")));
        return Map.of("items", items, "engine", "RULE_BASED", "total", items.size());
    }

    private Map<String, Object> courseSummary(Course c, User user) {
        List<CourseLesson> lessons = lessonRepository.findByCourseOrderByModuleOrderAscLessonOrderAsc(c);
        CourseProgress p = courseProgressRepository.findByUserAndCourse(user, c).orElse(null);
        int done = completedIds(p).size();
        Map<String, Object> item = new LinkedHashMap<>();
        item.put("id", c.getId());
        item.put("slug", c.getSlug());
        item.put("title", c.getTitle());
        item.put("shortDescription", c.getShortDescription());
        item.put("category", c.getCategory());
        item.put("difficulty", c.getDifficulty());
        item.put("level", c.getLevel());
        item.put("estimatedDurationMinutes", c.getEstimatedDurationMinutes());
        item.put("lessonCount", lessons.size());
        item.put("skillsGained", RoadmapService.split(c.getSkillsGained()));
        item.put("enrolled", p != null);
        item.put("progressPercent", RoadmapService.percent(done, lessons.size()));
        item.put("completedLessons", done);
        item.put("currentLessonId", p == null ? null : p.getCurrentLessonId());
        return item;
    }

    private Map<String, Object> courseDetail(Course c, User user) {
        return courseDetail(c, user, courseProgressRepository.findByUserAndCourse(user, c).orElse(null));
    }

    private Map<String, Object> courseDetail(Course c, User user, CourseProgress progress) {
        List<CourseLesson> lessons = lessonRepository.findByCourseOrderByModuleOrderAscLessonOrderAsc(c);
        Set<Long> completed = completedIds(progress);
        Map<String, List<Map<String, Object>>> modules = new LinkedHashMap<>();
        for (CourseLesson lesson : lessons) {
            modules.computeIfAbsent(lesson.getModuleName(), k -> new ArrayList<>())
                    .add(Map.of(
                            "id", lesson.getId(),
                            "title", lesson.getTitle(),
                            "description", lesson.getDescription(),
                            "lessonOrder", lesson.getLessonOrder(),
                            "estimatedMinutes", lesson.getEstimatedMinutes() == null ? 0 : lesson.getEstimatedMinutes(),
                            "completed", completed.contains(lesson.getId())));
        }
        List<Map<String, Object>> moduleList = new ArrayList<>();
        for (Map.Entry<String, List<Map<String, Object>>> entry : modules.entrySet()) {
            long done = entry.getValue().stream().filter(m -> Boolean.TRUE.equals(m.get("completed"))).count();
            moduleList.add(Map.of(
                    "name", entry.getKey(),
                    "lessons", entry.getValue(),
                    "completedLessons", done,
                    "totalLessons", entry.getValue().size(),
                    "progressPercent", RoadmapService.percent(done, entry.getValue().size())));
        }
        CourseLesson current = progress == null || progress.getCurrentLessonId() == null ? null
                : lessons.stream().filter(l -> l.getId().equals(progress.getCurrentLessonId()))
                        .findFirst().orElse(null);
        if (current == null) {
            current = lessons.stream().filter(l -> !completed.contains(l.getId())).findFirst()
                    .orElse(lessons.isEmpty() ? null : lessons.get(0));
        }

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("id", c.getId());
        result.put("slug", c.getSlug());
        result.put("title", c.getTitle());
        result.put("shortDescription", c.getShortDescription());
        result.put("detailedDescription", c.getDetailedDescription());
        result.put("category", c.getCategory());
        result.put("difficulty", c.getDifficulty());
        result.put("level", c.getLevel());
        result.put("estimatedDurationMinutes", c.getEstimatedDurationMinutes());
        result.put("learningObjectives", RoadmapService.split(c.getLearningObjectives()));
        result.put("prerequisites", RoadmapService.split(c.getPrerequisites()));
        result.put("skillsGained", RoadmapService.split(c.getSkillsGained()));
        result.put("enrolled", progress != null);
        result.put("completedLessons", completed.size());
        result.put("totalLessons", lessons.size());
        result.put("progressPercent", RoadmapService.percent(completed.size(), lessons.size()));
        result.put("currentLessonId", current == null ? null : current.getId());
        result.put("currentLessonTitle", current == null ? null : current.getTitle());
        result.put("modules", moduleList);
        return result;
    }
}
