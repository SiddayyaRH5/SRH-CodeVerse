package com.srhcodeverse.backend.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.srhcodeverse.backend.entity.*;
import com.srhcodeverse.backend.repository.*;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.io.InputStream;
import java.util.*;

@Component
@ConditionalOnProperty(
    name = "codeverse.content.sync",
    havingValue = "true"
)
public class CourseContentSyncRunner implements CommandLineRunner {
    private final CourseRepository courses;
    private final CourseLessonRepository lessons;
    private final CourseProblemRepository problems;
    private final CourseProjectRepository projects;
    private final CourseResourceRepository resources;
    private final ObjectMapper mapper;

    public CourseContentSyncRunner(
            CourseRepository courses,
            CourseLessonRepository lessons,
            CourseProblemRepository problems,
            CourseProjectRepository projects,
            CourseResourceRepository resources,
            ObjectMapper mapper) {
        this.courses = courses;
        this.lessons = lessons;
        this.problems = problems;
        this.projects = projects;
        this.resources = resources;
        this.mapper = mapper;
    }

    @Override
    @Transactional
    public void run(String... args) throws Exception {
        boolean dryRun = Arrays.asList(args).contains("--dry-run");
        int[] counts = new int[5];

        try (InputStream in =
                 new ClassPathResource("content/courses.json").getInputStream()) {
            JsonNode root = mapper.readTree(in);

            for (JsonNode n : root) {
                String slug = text(n, "slug");
                Course c = courses.findBySlug(slug).orElse(null);

                if (c == null) {
                    c = Course.builder()
                        .slug(slug)
                        .title(text(n, "title"))
                        .shortDescription(text(n, "shortDescription"))
                        .detailedDescription(text(n, "detailedDescription"))
                        .category(text(n, "category"))
                        .difficulty(text(n, "difficulty"))
                        .level(text(n, "level"))
                        .build();
                    System.out.println("ADD COURSE: " + slug);
                    counts[0]++;
                } else {
                    System.out.println("UPDATE COURSE: " + slug);
                }

                c.setTitle(text(n, "title"));
                c.setShortDescription(text(n, "shortDescription"));
                c.setDetailedDescription(text(n, "detailedDescription"));
                c.setCategory(text(n, "category"));
                c.setDifficulty(text(n, "difficulty"));
                c.setLevel(text(n, "level"));
                c.setThumbnail(text(n, "thumbnail"));
                c.setEstimatedDurationMinutes(n.path("estimatedDurationMinutes").asInt());
                c.setLessonCount(n.path("lessonCount").asInt());
                c.setProblemCount(n.path("problemCount").asInt());
                c.setLearningObjectives(join(n.path("learningObjectives")));
                c.setPrerequisites(join(n.path("prerequisites")));
                c.setSkillsGained(join(n.path("skillsGained")));

                if (!dryRun) c = courses.save(c);
                else if (c.getId() == null) {
                    System.out.println("  Dry run: related content needs a saved course ID.");
                    continue;
                }

                Map<String, CourseLesson> existingLessons = new HashMap<>();
                for (CourseLesson l : lessons.findByCourseOrderByModuleOrderAscLessonOrderAsc(c)) {
                    existingLessons.put(key(l.getModuleOrder(), l.getLessonOrder()), l);
                }

                for (JsonNode l : n.path("lessons")) {
                    String k = key(l.path("moduleOrder").asInt(), l.path("lessonOrder").asInt());
                    CourseLesson old = existingLessons.get(k);
                    boolean added = old == null;
                    CourseLesson item = added ? CourseLesson.builder().course(c).build() : old;

                    item.setModuleName(text(l, "moduleName"));
                    item.setModuleOrder(l.path("moduleOrder").asInt());
                    item.setLessonOrder(l.path("lessonOrder").asInt());
                    item.setTitle(text(l, "title"));
                    item.setDescription(text(l, "description"));
                    item.setEstimatedMinutes(l.path("estimatedMinutes").asInt());

                    if (added) counts[1]++;
                    if (!dryRun) lessons.save(item);
                    System.out.println((added ? "  ADD LESSON: " : "  UPDATE LESSON: ")
                        + item.getTitle());
                }

                Map<String, CourseProblem> existingProblems = new HashMap<>();
                for (CourseProblem p : problems.findByCourseOrderByIdAsc(c))
                    existingProblems.put(norm(p.getTitle()), p);

                for (JsonNode p : n.path("problems")) {
                    String k = norm(text(p, "title"));
                    CourseProblem old = existingProblems.get(k);
                    boolean added = old == null;
                    CourseProblem item = added
                        ? CourseProblem.builder().course(c).build() : old;

                    item.setTitle(text(p, "title"));
                    item.setStatement(text(p, "statement"));
                    item.setDescription(text(p, "description"));
                    item.setDifficulty(text(p, "difficulty"));
                    item.setTopic(text(p, "topic"));
                    item.setTags(text(p, "tags"));
                    item.setExpectedInput(text(p, "expectedInput"));
                    item.setExpectedOutput(text(p, "expectedOutput"));
                    item.setExampleInput(text(p, "exampleInput"));
                    item.setExampleOutput(text(p, "exampleOutput"));
                    item.setExplanation(text(p, "explanation"));
                    item.setConstraintsText(text(p, "constraints"));
                    item.setStarterCode(text(p, "starterCode"));
                    item.setSolution(text(p, "solution"));
                    item.setXp(p.path("xp").asInt());
                    item.setEstimatedTimeMinutes(p.path("estimatedTimeMinutes").asInt());

                    if (added) counts[2]++;
                    if (!dryRun) problems.save(item);
                    System.out.println((added ? "  ADD PROBLEM: " : "  UPDATE PROBLEM: ")
                        + item.getTitle());
                }

                Map<String, CourseProject> existingProjects = new HashMap<>();
                for (CourseProject p : projects.findByCourseOrderByIdAsc(c))
                    existingProjects.put(norm(p.getTitle()), p);

                for (JsonNode p : n.path("projects")) {
                    String k = norm(text(p, "title"));
                    CourseProject old = existingProjects.get(k);
                    boolean added = old == null;
                    CourseProject item = added
                        ? CourseProject.builder().course(c).build() : old;

                    item.setTitle(text(p, "title"));
                    item.setDescription(text(p, "description"));
                    item.setRequirements(text(p, "requirements"));
                    item.setTechnologies(text(p, "technologies"));
                    item.setFeatures(text(p, "features"));
                    item.setDifficulty(text(p, "difficulty"));
                    item.setOutcome(text(p, "outcome"));

                    if (added) counts[3]++;
                    if (!dryRun) projects.save(item);
                    System.out.println((added ? "  ADD PROJECT: " : "  UPDATE PROJECT: ")
                        + item.getTitle());
                }

                Map<String, CourseResource> existingResources = new HashMap<>();
                for (CourseResource r : resources.findByCourseOrderByIdAsc(c))
                    existingResources.put(norm(r.getTitle()), r);

                for (JsonNode r : n.path("resources")) {
                    String k = norm(text(r, "title"));
                    CourseResource old = existingResources.get(k);
                    boolean added = old == null;
                    CourseResource item = added
                        ? CourseResource.builder().course(c).build() : old;

                    item.setTitle(text(r, "title"));
                    item.setProvider(text(r, "provider"));
                    item.setUrl(text(r, "url"));
                    item.setType(text(r, "type"));
                    item.setFree(r.path("free").asBoolean());
                    item.setDescription(text(r, "description"));

                    if (added) counts[4]++;
                    if (!dryRun) resources.save(item);
                    System.out.println((added ? "  ADD RESOURCE: " : "  UPDATE RESOURCE: ")
                        + item.getTitle());
                }
            }
        }

        System.out.println("\nContent sync " + (dryRun ? "DRY RUN" : "COMPLETE"));
        System.out.println("New courses: " + counts[0]);
        System.out.println("New lessons: " + counts[1]);
        System.out.println("New problems: " + counts[2]);
        System.out.println("New projects: " + counts[3]);
        System.out.println("New resources: " + counts[4]);
        if (dryRun) System.out.println("No database changes requested.");
    }

    private String text(JsonNode n, String field) {
        return n.path(field).asText("");
    }

    private String join(JsonNode n) {
        if (!n.isArray()) return "";
        List<String> values = new ArrayList<>();
        n.forEach(v -> values.add(v.asText()));
        return String.join("\n", values);
    }

    private String key(int module, int order) {
        return module + ":" + order;
    }

    private String norm(String value) {
        return value == null ? "" : value.trim().toLowerCase(Locale.ROOT);
    }
}
