package com.srhcodeverse.backend.service;

import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

@Component
@ConditionalOnProperty(
        name = "codeverse.content.populate-java-lessons",
        havingValue = "true"
)
public class LessonContentStartupRunner implements CommandLineRunner {

    private final LessonContentUpdater updater;

    public LessonContentStartupRunner(LessonContentUpdater updater) {
        this.updater = updater;
    }

    @Override
    public void run(String... args) {
        int updated = updater.populateJavaLessons();
        System.out.println(
                "SRH CodeVerse: populated content for " + updated + " Java lessons."
        );
    }
}