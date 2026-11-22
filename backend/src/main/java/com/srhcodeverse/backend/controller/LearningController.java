package com.srhcodeverse.backend.controller;

import com.srhcodeverse.backend.dto.FeatureRequests;
import com.srhcodeverse.backend.service.LearningService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/learning")
public class LearningController {

    private final LearningService service;

    public LearningController(LearningService service) {
        this.service = service;
    }

    @GetMapping("/courses")
    public ResponseEntity<Map<String, Object>> courses(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String difficulty,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size,
            Authentication auth) {
        return ResponseEntity.ok(service.catalog(auth.getName(), search, category, difficulty, page, size));
    }

    @GetMapping("/courses/{slug}")
    public ResponseEntity<Map<String, Object>> course(@PathVariable String slug, Authentication auth) {
        return ResponseEntity.ok(service.detail(slug, auth.getName()));
    }

    @PostMapping("/courses/{slug}/enroll")
    public ResponseEntity<Map<String, Object>> enroll(@PathVariable String slug, Authentication auth) {
        return ResponseEntity.ok(service.enroll(slug, auth.getName()));
    }

    @GetMapping("/my")
    public ResponseEntity<Map<String, Object>> my(Authentication auth) {
        return ResponseEntity.ok(service.my(auth.getName()));
    }

    @GetMapping("/lessons/{lessonId}")
    public ResponseEntity<Map<String, Object>> lesson(@PathVariable Long lessonId, Authentication auth) {
        return ResponseEntity.ok(service.lesson(lessonId, auth.getName()));
    }

    @PostMapping("/lessons/{lessonId}/complete")
    public ResponseEntity<Map<String, Object>> complete(@PathVariable Long lessonId,
                                                        @RequestBody FeatureRequests.LessonUpdate request,
                                                        Authentication auth) {
        if (request == null || request.completed() == null) {
            throw new IllegalArgumentException("completed is required");
        }
        return ResponseEntity.ok(service.complete(lessonId, auth.getName(), request.completed()));
    }

    @PostMapping("/lessons/{lessonId}/bookmark")
    public ResponseEntity<Map<String, Object>> bookmark(@PathVariable Long lessonId, Authentication auth) {
        return ResponseEntity.ok(service.toggleBookmark(lessonId, auth.getName()));
    }

    @PutMapping("/lessons/{lessonId}/note")
    public ResponseEntity<Map<String, Object>> note(@PathVariable Long lessonId,
                                                    @RequestBody FeatureRequests.NoteUpdate request,
                                                    Authentication auth) {
        return ResponseEntity.ok(service.saveNote(lessonId, auth.getName(),
                request == null ? "" : request.content()));
    }

    @GetMapping("/bookmarks")
    public ResponseEntity<Map<String, Object>> bookmarks(Authentication auth) {
        return ResponseEntity.ok(service.bookmarks(auth.getName()));
    }

    @GetMapping("/progress")
    public ResponseEntity<Map<String, Object>> progress(Authentication auth) {
        return ResponseEntity.ok(service.progress(auth.getName()));
    }

    @GetMapping("/recommendations")
    public ResponseEntity<Map<String, Object>> recommendations(Authentication auth) {
        return ResponseEntity.ok(service.recommendations(auth.getName()));
    }
}
