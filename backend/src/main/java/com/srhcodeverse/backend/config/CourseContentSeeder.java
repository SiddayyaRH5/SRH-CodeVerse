package com.srhcodeverse.backend.config;
import com.srhcodeverse.backend.service.CourseContentService;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
@Component
public class CourseContentSeeder implements CommandLineRunner {
    private final CourseContentService service;
    public CourseContentSeeder(CourseContentService service){this.service=service;}
    @Override public void run(String... args){ service.seedIfNeeded(); }
}
