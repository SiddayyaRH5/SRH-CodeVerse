package com.srhcodeverse.backend.service;

import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

@Component
@ConditionalOnProperty(
        name = "codeverse.content.populate-python-lessons",
        havingValue = "true"
)
public class PythonLessonContentStartupRunner implements CommandLineRunner {

    private final PythonLessonContentUpdater updater;

    public PythonLessonContentStartupRunner(
            PythonLessonContentUpdater updater) {
        this.updater = updater;
    }

    @Override
    public void run(String... args) {
        int updated = updater.populatePythonLessons();

        System.out.println(
                "SRH CodeVerse: populated missing content in "
                        + updated + " Python lessons.");
    }
}
