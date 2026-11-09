package com.srhcodeverse.backend.service;

import com.srhcodeverse.backend.entity.Course;
import com.srhcodeverse.backend.entity.CourseLesson;
import com.srhcodeverse.backend.repository.CourseLessonRepository;
import com.srhcodeverse.backend.repository.CourseRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;

@Service
public class OtherCourseLessonUpdater {

    private final CourseRepository courseRepository;
    private final CourseLessonRepository lessonRepository;

    private static final Map<String, String> COURSES = Map.of(
        "python-programming", "Python",
        "javascript", "JavaScript",
        "html-css", "HTML and CSS",
        "react-js", "React",
        "sql-mysql", "SQL and MySQL",
        "spring-boot", "Spring Boot",
        "data-structures-algorithms", "Data Structures and Algorithms",
        "git-github", "Git and GitHub",
        "full-stack-web-development", "Full Stack Development"
    );

    public OtherCourseLessonUpdater(CourseRepository courseRepository,
                                    CourseLessonRepository lessonRepository) {
        this.courseRepository = courseRepository;
        this.lessonRepository = lessonRepository;
    }

    @Transactional
    public int populateLessons() {
        int updated = 0;

        for (Map.Entry<String, String> entry : COURSES.entrySet()) {
            Course course = courseRepository.findBySlug(entry.getKey())
                .orElseThrow(() -> new IllegalArgumentException(
                    "Course not found: " + entry.getKey()));

            List<CourseLesson> lessons =
                lessonRepository.findByCourseOrderByModuleOrderAscLessonOrderAsc(course);

            for (CourseLesson lesson : lessons) {
                String title = lesson.getTitle() == null ? "this topic" : lesson.getTitle();
                boolean changed = false;

                if (blank(lesson.getLessonContent())) {
                    lesson.setLessonContent(
                        "# " + title + "\n\n" +
                        "## Learning objectives\n" +
                        "Understand " + title + " in " + entry.getValue() + ".\n\n" +
                        "## Concept\n" +
                        "Learn the purpose, syntax, workflow and practical use of " +
                        title + ". Connect this topic with the concepts from the " +
                        "previous lessons.\n\n" +
                        "## Practice steps\n" +
                        "1. Identify the problem this concept solves.\n" +
                        "2. Study the example and understand each step.\n" +
                        "3. Modify the example and observe the result.\n" +
                        "4. Test normal, invalid and boundary cases.\n\n" +
                        "## Key takeaway\n" +
                        "Explain " + title + " in your own words and demonstrate it."
                    );
                    changed = true;
                }

                if (blank(lesson.getCodeExample())) {
                    lesson.setCodeExample(example(entry.getKey(), title));
                    changed = true;
                }

                if (blank(lesson.getExercise())) {
                    lesson.setExercise(
                        "Exercise: Create a practical example demonstrating " +
                        title + " using " + entry.getValue() +
                        ". Explain your solution and test at least two cases."
                    );
                    changed = true;
                }

                if (blank(lesson.getQuiz())) {
                    lesson.setQuiz(
                        "Question: Explain the purpose of " + title +
                        " in " + entry.getValue() +
                        ". Give one practical example and describe its expected result."
                    );
                    changed = true;
                }

                if (changed) {
                    lessonRepository.save(lesson);
                    updated++;
                }
            }
        }

        return updated;
    }

    private boolean blank(String value) {
        return value == null || value.isBlank();
    }

    private String example(String slug, String title) {
        return switch (slug) {
            case "python-programming" -> """
                # %s
                def demonstrate():
                    message = "Hello, Python!"
                    print(message)

                demonstrate()
                """.formatted(title);

            case "javascript" -> """
                // %s
                function demonstrate() {
                    const message = "Hello, JavaScript!";
                    console.log(message);
                }
                demonstrate();
                """.formatted(title);

            case "html-css" -> """
                <!-- %s -->
                <!DOCTYPE html>
                <html>
                <head>
                    <style>
                        .lesson { padding: 16px; margin: 10px; }
                    </style>
                </head>
                <body>
                    <section class="lesson">
                        <h1>Practice lesson</h1>
                        <p>Learn and experiment.</p>
                    </section>
                </body>
                </html>
                """.formatted(title);

            case "react-js" -> """
                // %s
                export default function LessonExample() {
                    return <h1>Practising React</h1>;
                }
                """.formatted(title);

            case "sql-mysql" -> """
                -- %s
                CREATE TABLE practice_items (
                    id INT PRIMARY KEY AUTO_INCREMENT,
                    title VARCHAR(100) NOT NULL
                );

                INSERT INTO practice_items (title)
                VALUES ('First practice');

                SELECT * FROM practice_items;
                """.formatted(title);

            case "spring-boot" -> """
                // %s
                import org.springframework.web.bind.annotation.GetMapping;
                import org.springframework.web.bind.annotation.RestController;

                @RestController
                public class PracticeController {
                    @GetMapping("/practice")
                    public String practice() {
                        return "Practising Spring Boot";
                    }
                }
                """.formatted(title);

            case "data-structures-algorithms" -> """
                // %s
                import java.util.Arrays;

                public class Practice {
                    public static void main(String[] args) {
                        int[] values = {5, 2, 8, 1};
                        Arrays.sort(values);
                        System.out.println(Arrays.toString(values));
                    }
                }
                """.formatted(title);

            case "git-github" -> """
                # %s
                git status
                git add .
                git commit -m "Practice lesson"
                git log --oneline
                """.formatted(title);

            default -> """
                // %s
                // Create a small feature for this lesson.
                // Separate input, processing and output.
                // Validate inputs and test expected errors.
                """.formatted(title);
        };
    }
}
