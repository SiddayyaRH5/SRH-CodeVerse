package com.srhcodeverse.backend.service;

import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

@Component
@ConditionalOnProperty(
    name = "codeverse.content.populate-other-lessons",
    havingValue = "true"
)
public class OtherCourseLessonStartupRunner implements CommandLineRunner {

    private final OtherCourseLessonUpdater updater;

    public OtherCourseLessonStartupRunner(OtherCourseLessonUpdater updater) {
        this.updater = updater;
    }

    @Override
    public void run(String... args) {
        int updated = updater.populateLessons();
        System.out.println(
            "SRH CodeVerse: populated missing content in " + updated + " lessons."
        );
    }
}
