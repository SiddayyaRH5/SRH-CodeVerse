package com.srhcodeverse.backend.config;

import com.srhcodeverse.backend.service.CourseContentService;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

/**
 * Large course-content seeding is an explicit one-time deployment operation.
 * Keeping it out of normal production startups avoids scanning and checking
 * every course, lesson, problem, project and resource on each cold start.
 * Set CODEVERSE_CONTENT_SEED_ON_STARTUP=true for a fresh/empty database,
 * then return it to false after the seed has completed successfully.
 */
@Component
@ConditionalOnProperty(
        name = "codeverse.content.seed-on-startup",
        havingValue = "true"
)
public class CourseContentSeeder implements CommandLineRunner {

    private final CourseContentService service;

    public CourseContentSeeder(CourseContentService service) {
        this.service = service;
    }

    @Override
    public void run(String... args) {
        long startedAt = System.nanoTime();
        service.seedIfNeeded();
        long elapsedMs = (System.nanoTime() - startedAt) / 1_000_000;
        System.out.println("SRH CodeVerse: optional course-content seed completed in " + elapsedMs + " ms.");
    }
}
