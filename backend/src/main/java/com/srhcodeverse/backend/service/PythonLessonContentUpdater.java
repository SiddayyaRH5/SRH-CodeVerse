package com.srhcodeverse.backend.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.srhcodeverse.backend.entity.Course;
import com.srhcodeverse.backend.entity.CourseLesson;
import com.srhcodeverse.backend.repository.CourseLessonRepository;
import com.srhcodeverse.backend.repository.CourseRepository;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.InputStream;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class PythonLessonContentUpdater {

    private final CourseRepository courseRepository;
    private final CourseLessonRepository lessonRepository;
    private final ObjectMapper objectMapper;

    public PythonLessonContentUpdater(
            CourseRepository courseRepository,
            CourseLessonRepository lessonRepository,
            ObjectMapper objectMapper) {
        this.courseRepository = courseRepository;
        this.lessonRepository = lessonRepository;
        this.objectMapper = objectMapper;
    }

    @Transactional
    public int populatePythonLessons() {
        try (InputStream input = new ClassPathResource(
                "content/python-lessons.json").getInputStream()) {

            List<PythonLessonContent> records = objectMapper.readValue(
                    input, new TypeReference<List<PythonLessonContent>>() {});

            if (records.size() != 40) {
                throw new IllegalStateException(
                        "Expected 40 Python records, found " + records.size());
            }

            Map<Long, PythonLessonContent> contentById = new HashMap<>();

            for (PythonLessonContent record : records) {
                if (record.id == null ||
                        contentById.put(record.id, record) != null) {
                    throw new IllegalStateException(
                            "Missing or duplicate lesson ID: " + record.id);
                }

                requireText(record.title, "title", record.id);
                requireText(record.lessonContent, "lessonContent", record.id);
                requireText(record.codeExample, "codeExample", record.id);
                requireText(record.exercise, "exercise", record.id);
                requireText(record.quiz, "quiz", record.id);
            }

            Course course = courseRepository.findBySlug("python-programming")
                    .orElseThrow(() -> new IllegalStateException(
                            "Python course not found"));

            List<CourseLesson> lessons =
                    lessonRepository.findByCourseOrderByModuleOrderAscLessonOrderAsc(course);

            if (lessons.size() != 40) {
                throw new IllegalStateException(
                        "Expected 40 database lessons, found " + lessons.size());
            }

            int updated = 0;

            for (CourseLesson lesson : lessons) {
                PythonLessonContent record = contentById.get(lesson.getId());

                if (record == null) {
                    throw new IllegalStateException(
                            "No content record for lesson ID " + lesson.getId());
                }

                if (!lesson.getTitle().equals(record.title)) {
                    throw new IllegalStateException(
                            "Title mismatch for lesson ID " + lesson.getId());
                }

                boolean changed = false;

                if (blank(lesson.getLessonContent())) {
                    lesson.setLessonContent(record.lessonContent);
                    changed = true;
                }

                if (blank(lesson.getCodeExample())) {
                    lesson.setCodeExample(record.codeExample);
                    changed = true;
                }

                if (blank(lesson.getExercise())) {
                    lesson.setExercise(record.exercise);
                    changed = true;
                }

                if (blank(lesson.getQuiz())) {
                    lesson.setQuiz(record.quiz);
                    changed = true;
                }

                if (changed) {
                    lessonRepository.save(lesson);
                    updated++;
                }
            }

            return updated;

        } catch (Exception exception) {
            throw new IllegalStateException(
                    "Python lesson content update failed", exception);
        }
    }

    private boolean blank(String value) {
        return value == null || value.isBlank();
    }

    private void requireText(String value, String field, Long id) {
        if (value == null || value.isBlank()) {
            throw new IllegalStateException(
                    "Blank " + field + " for lesson ID " + id);
        }
    }

    private static class PythonLessonContent {
        public Long id;
        public String title;
        public String lessonContent;
        public String codeExample;
        public String exercise;
        public String quiz;
    }
}
