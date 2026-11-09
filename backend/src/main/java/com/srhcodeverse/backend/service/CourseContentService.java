package com.srhcodeverse.backend.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.srhcodeverse.backend.dto.*;
import com.srhcodeverse.backend.entity.*;
import com.srhcodeverse.backend.repository.*;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.InputStream;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class CourseContentService {
    private final CourseRepository courseRepository;
    private final CourseLessonRepository lessonRepository;
    private final CourseProblemRepository problemRepository;
    private final CourseResourceRepository resourceRepository;
    private final CourseProjectRepository projectRepository;
    private final CourseProgressRepository progressRepository;
    private final UserRepository userRepository;
    private final ObjectMapper objectMapper;

    public CourseContentService(CourseRepository courseRepository, CourseLessonRepository lessonRepository,
            CourseProblemRepository problemRepository, CourseResourceRepository resourceRepository,
            CourseProjectRepository projectRepository, CourseProgressRepository progressRepository,
            UserRepository userRepository, ObjectMapper objectMapper) {
        this.courseRepository = courseRepository;
        this.lessonRepository = lessonRepository;
        this.problemRepository = problemRepository;
        this.resourceRepository = resourceRepository;
        this.projectRepository = projectRepository;
        this.progressRepository = progressRepository;
        this.userRepository = userRepository;
        this.objectMapper = objectMapper;
    }

    public List<CourseSummaryResponse> listCourses(String username) {
        User user = username == null ? null : userRepository.findByUsername(username).orElse(null);
        return courseRepository.findAll().stream().sorted(Comparator.comparing(Course::getId))
                .map(c -> summary(c, user)).toList();
    }

    @Transactional(readOnly = true)
    public CourseDetailResponse getCourse(String slug, String username) {
        Course c = courseRepository.findBySlug(slug)
                .orElseThrow(() -> new IllegalArgumentException("Course not found"));
        User user = username == null ? null : userRepository.findByUsername(username).orElse(null);
        CourseProgress p = user == null ? null : progressRepository.findByUserAndCourse(user, c).orElse(null);
        Set<Long> completed = completedIds(p);
        List<CourseLessonResponse> lessons = lessonRepository.findByCourseOrderByModuleOrderAscLessonOrderAsc(c)
                .stream()
                .map(l -> CourseLessonResponse.builder().id(l.getId()).moduleName(l.getModuleName())
                        .moduleOrder(l.getModuleOrder()).lessonOrder(l.getLessonOrder()).title(l.getTitle())
                        .description(l.getDescription())
                        .lessonContent(l.getLessonContent())
                        .videoUrl(l.getVideoUrl())
                        .codeExample(l.getCodeExample())
                        .exercise(l.getExercise())
                        .quiz(l.getQuiz())
                        .estimatedMinutes(l.getEstimatedMinutes())
                        .completed(completed.contains(l.getId())).build())
                .toList();
        return CourseDetailResponse.builder().id(c.getId()).slug(c.getSlug()).title(c.getTitle())
                .shortDescription(c.getShortDescription()).detailedDescription(c.getDetailedDescription())
                .category(c.getCategory()).difficulty(c.getDifficulty()).level(c.getLevel()).thumbnail(c.getThumbnail())
                .estimatedDurationMinutes(c.getEstimatedDurationMinutes()).lessonCount(c.getLessonCount())
                .problemCount(c.getProblemCount()).learningObjectives(split(c.getLearningObjectives()))
                .prerequisites(split(c.getPrerequisites())).skillsGained(split(c.getSkillsGained()))
                .progressPercent(percent(completed.size(), lessons.size()))
                .currentLessonId(p == null ? null : p.getCurrentLessonId()).lessons(lessons).resources(resources(c))
                .projects(projects(c)).build();
    }

    public List<CourseProblemResponse> problems(String slug) {
        Course c = course(slug);
        return problemRepository.findByCourseOrderByIdAsc(c).stream()
                .map(p -> CourseProblemResponse.builder().id(p.getId()).title(p.getTitle()).statement(p.getStatement())
                        .description(p.getDescription()).difficulty(p.getDifficulty()).topic(p.getTopic())
                        .tags(p.getTags()).expectedInput(p.getExpectedInput()).expectedOutput(p.getExpectedOutput())
                        .exampleInput(p.getExampleInput()).exampleOutput(p.getExampleOutput())
                        .explanation(p.getExplanation()).constraints(p.getConstraintsText())
                        .starterCode(p.getStarterCode()).solution(p.getSolution()).xp(p.getXp())
                        .estimatedTimeMinutes(p.getEstimatedTimeMinutes()).build())
                .toList();
    }

    public List<CourseResourceResponse> resources(String slug) {
        return resources(course(slug));
    }

    public List<CourseProjectResponse> projects(String slug) {
        return projects(course(slug));
    }

    @Transactional
    public CourseDetailResponse updateProgress(String slug, String username, CourseProgressRequest request) {
        Course c = course(slug);
        User u = userRepository.findByUsername(username)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        CourseLesson lesson = lessonRepository.findById(request.getLessonId())
                .orElseThrow(() -> new IllegalArgumentException("Lesson not found"));
        if (!lesson.getCourse().getId().equals(c.getId()))
            throw new IllegalArgumentException("Lesson does not belong to this course");
        CourseProgress p = progressRepository.findByUserAndCourse(u, c)
                .orElseGet(() -> CourseProgress.builder().user(u).course(c).completedLessonIds("").xpEarned(0).build());
        Set<Long> ids = completedIds(p);
        if (request.isCompleted())
            ids.add(lesson.getId());
        else
            ids.remove(lesson.getId());
        p.setCompletedLessonIds(ids.stream().sorted().map(String::valueOf).collect(Collectors.joining(",")));
        p.setCurrentLessonId(lesson.getId());
        p.setXpEarned(ids.size() * 10);
        progressRepository.save(p);
        return getCourse(slug, username);
    }

    @Transactional(readOnly = true)
    public CourseProblemResponse getCourseProblem(String slug, Long problemId) {
        Course c = course(slug);

        CourseProblem p = problemRepository.findById(problemId)
                .filter(problem -> problem.getCourse().getId().equals(c.getId()))
                .orElseThrow(() -> new IllegalArgumentException("Course problem not found"));

        return CourseProblemResponse.builder()
                .id(p.getId())
                .title(p.getTitle())
                .statement(p.getStatement())
                .description(p.getDescription())
                .difficulty(p.getDifficulty())
                .topic(p.getTopic())
                .tags(p.getTags())
                .expectedInput(p.getExpectedInput())
                .expectedOutput(p.getExpectedOutput())
                .exampleInput(p.getExampleInput())
                .exampleOutput(p.getExampleOutput())
                .explanation(p.getExplanation())
                .constraints(p.getConstraintsText())
                .starterCode(p.getStarterCode())
                .solution(p.getSolution())
                .xp(p.getXp())
                .estimatedTimeMinutes(p.getEstimatedTimeMinutes())
                .build();
    }

    private Course course(String slug) {
        return courseRepository.findBySlug(slug).orElseThrow(() -> new IllegalArgumentException("Course not found"));
    }

    private CourseSummaryResponse summary(Course c, User u) {
        CourseProgress p = u == null ? null : progressRepository.findByUserAndCourse(u, c).orElse(null);
        int count = completedIds(p).size();
        return CourseSummaryResponse.builder().id(c.getId()).slug(c.getSlug()).title(c.getTitle())
                .shortDescription(c.getShortDescription()).category(c.getCategory()).difficulty(c.getDifficulty())
                .level(c.getLevel()).thumbnail(c.getThumbnail())
                .estimatedDurationMinutes(c.getEstimatedDurationMinutes()).lessonCount(c.getLessonCount())
                .problemCount(c.getProblemCount())
                .progressPercent(percent(count, c.getLessonCount() == null ? 0 : c.getLessonCount())).build();
    }

    private Set<Long> completedIds(CourseProgress p) {
        if (p == null || p.getCompletedLessonIds() == null || p.getCompletedLessonIds().isBlank())
            return new HashSet<>();
        Set<Long> out = new HashSet<>();
        for (String s : p.getCompletedLessonIds().split(",")) {
            try {
                out.add(Long.parseLong(s));
            } catch (NumberFormatException ignored) {
            }
        }
        return out;
    }

    private int percent(int a, int b) {
        return b <= 0 ? 0 : Math.min(100, (int) Math.round(a * 100.0 / b));
    }

    private List<String> split(String s) {
        if (s == null || s.isBlank())
            return List.of();
        return Arrays.stream(s.split("\\n")).map(String::trim).filter(x -> !x.isBlank()).toList();
    }

    private List<CourseResourceResponse> resources(Course c) {
        return resourceRepository.findByCourseOrderByIdAsc(c).stream()
                .map(r -> CourseResourceResponse.builder().id(r.getId()).title(r.getTitle()).provider(r.getProvider())
                        .url(r.getUrl()).type(r.getType()).free(r.isFree()).description(r.getDescription()).build())
                .toList();
    }

    private List<CourseProjectResponse> projects(Course c) {
        return projectRepository.findByCourseOrderByIdAsc(c).stream()
                .map(p -> CourseProjectResponse.builder().id(p.getId()).title(p.getTitle())
                        .description(p.getDescription()).requirements(p.getRequirements())
                        .technologies(p.getTechnologies()).features(p.getFeatures()).difficulty(p.getDifficulty())
                        .outcome(p.getOutcome()).build())
                .toList();
    }

    @Transactional
    public void seedIfNeeded() {
        // Seed each content type independently. Older databases may already have
        // course rows but still be missing lessons, problems, projects or resources.
        try (InputStream in = new ClassPathResource("content/courses.json").getInputStream()) {
            JsonNode root = objectMapper.readTree(in);
            for (JsonNode n : root) {
                String slug = n.path("slug").asText();
                Course c = courseRepository.findBySlug(slug).orElseGet(() -> {
                    Course created = Course.builder().slug(slug).title(n.path("title").asText())
                            .shortDescription(n.path("shortDescription").asText())
                            .detailedDescription(n.path("detailedDescription").asText())
                            .category(n.path("category").asText()).difficulty(n.path("difficulty").asText())
                            .level(n.path("level").asText()).thumbnail(n.path("thumbnail").asText())
                            .estimatedDurationMinutes(n.path("estimatedDurationMinutes").asInt())
                            .lessonCount(n.path("lessonCount").asInt()).problemCount(n.path("problemCount").asInt())
                            .learningObjectives(joinArray(n.path("learningObjectives")))
                            .prerequisites(joinArray(n.path("prerequisites")))
                            .skillsGained(joinArray(n.path("skillsGained"))).build();
                    return courseRepository.save(created);
                });

                if (lessonRepository.findByCourseOrderByModuleOrderAscLessonOrderAsc(c).isEmpty()) {
                    for (JsonNode l : n.path("lessons"))
                        lessonRepository.save(CourseLesson.builder().course(c)
                                .moduleName(l.path("moduleName").asText()).moduleOrder(l.path("moduleOrder").asInt())
                                .lessonOrder(l.path("lessonOrder").asInt()).title(l.path("title").asText())
                                .description(l.path("description").asText())
                                .estimatedMinutes(l.path("estimatedMinutes").asInt()).build());
                }
                if (problemRepository.findByCourseOrderByIdAsc(c).isEmpty()) {
                    for (JsonNode p : n.path("problems"))
                        problemRepository.save(CourseProblem.builder().course(c)
                                .title(p.path("title").asText()).statement(p.path("statement").asText())
                                .description(p.path("description").asText()).difficulty(p.path("difficulty").asText())
                                .topic(p.path("topic").asText()).tags(p.path("tags").asText())
                                .expectedInput(p.path("expectedInput").asText())
                                .expectedOutput(p.path("expectedOutput").asText())
                                .exampleInput(p.path("exampleInput").asText())
                                .exampleOutput(p.path("exampleOutput").asText())
                                .explanation(p.path("explanation").asText())
                                .constraintsText(p.path("constraints").asText())
                                .starterCode(p.path("starterCode").asText()).solution(p.path("solution").asText())
                                .xp(p.path("xp").asInt()).estimatedTimeMinutes(p.path("estimatedTimeMinutes").asInt())
                                .build());
                }
                if (resourceRepository.findByCourseOrderByIdAsc(c).isEmpty()) {
                    for (JsonNode r : n.path("resources"))
                        resourceRepository.save(CourseResource.builder().course(c)
                                .title(r.path("title").asText()).provider(r.path("provider").asText())
                                .url(r.path("url").asText())
                                .type(r.path("type").asText()).free(r.path("free").asBoolean())
                                .description(r.path("description").asText()).build());
                }
                if (projectRepository.findByCourseOrderByIdAsc(c).isEmpty()) {
                    for (JsonNode p : n.path("projects"))
                        projectRepository.save(CourseProject.builder().course(c)
                                .title(p.path("title").asText()).description(p.path("description").asText())
                                .requirements(p.path("requirements").asText())
                                .technologies(p.path("technologies").asText())
                                .features(p.path("features").asText()).difficulty(p.path("difficulty").asText())
                                .outcome(p.path("outcome").asText()).build());
                }
            }
        } catch (Exception e) {
            throw new IllegalStateException("Unable to seed CodeVerse course content", e);
        }
    }

    private String joinArray(JsonNode node) {
        List<String> values = new ArrayList<>();
        if (node != null && node.isArray())
            node.forEach(v -> values.add(v.asText()));
        return String.join("\n", values);
    }

}
