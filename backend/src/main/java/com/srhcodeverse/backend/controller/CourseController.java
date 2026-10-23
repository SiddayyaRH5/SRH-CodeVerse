package com.srhcodeverse.backend.controller;

import com.srhcodeverse.backend.dto.*;
import com.srhcodeverse.backend.service.CourseContentService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.core.Authentication;
import java.util.List;

@RestController
@RequestMapping("/api/courses")
public class CourseController {
    private final CourseContentService service;
    public CourseController(CourseContentService service){this.service=service;}
    @GetMapping public ResponseEntity<List<CourseSummaryResponse>> courses(Authentication auth){return ResponseEntity.ok(service.listCourses(auth == null ? null : auth.getName()));}
    @GetMapping("/{slug}") public ResponseEntity<CourseDetailResponse> course(@PathVariable String slug, Authentication auth){return ResponseEntity.ok(service.getCourse(slug,auth == null ? null : auth.getName()));}
    @GetMapping("/{slug}/lessons") public ResponseEntity<List<CourseLessonResponse>> lessons(@PathVariable String slug, Authentication auth){return ResponseEntity.ok(service.getCourse(slug,auth == null ? null : auth.getName()).getLessons());}
    @GetMapping("/{slug}/problems") public ResponseEntity<List<CourseProblemResponse>> problems(@PathVariable String slug){return ResponseEntity.ok(service.problems(slug));}
    @GetMapping("/{slug}/resources") public ResponseEntity<List<CourseResourceResponse>> resources(@PathVariable String slug){return ResponseEntity.ok(service.resources(slug));}
    @GetMapping("/{slug}/projects") public ResponseEntity<List<CourseProjectResponse>> projects(@PathVariable String slug){return ResponseEntity.ok(service.projects(slug));}
    @PostMapping("/{slug}/progress") public ResponseEntity<CourseDetailResponse> progress(@PathVariable String slug,@RequestBody CourseProgressRequest request,Authentication auth){return ResponseEntity.ok(service.updateProgress(slug,auth.getName(),request));}
}
