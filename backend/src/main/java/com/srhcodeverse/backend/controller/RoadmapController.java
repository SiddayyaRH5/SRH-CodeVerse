package com.srhcodeverse.backend.controller;

import com.srhcodeverse.backend.dto.FeatureRequests;
import com.srhcodeverse.backend.service.RoadmapService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/roadmaps")
public class RoadmapController {

    private final RoadmapService service;

    public RoadmapController(RoadmapService service) {
        this.service = service;
    }

    @GetMapping
    public ResponseEntity<Map<String, Object>> catalog(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String difficulty,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size,
            Authentication auth) {
        return ResponseEntity.ok(service.catalog(auth.getName(), search, category, difficulty, page, size));
    }

    @GetMapping("/categories")
    public ResponseEntity<List<Map<String, Object>>> categories() {
        return ResponseEntity.ok(service.categories());
    }

    @GetMapping("/my")
    public ResponseEntity<Map<String, Object>> my(Authentication auth) {
        return ResponseEntity.ok(service.my(auth.getName()));
    }

    @GetMapping("/{slug}")
    public ResponseEntity<Map<String, Object>> detail(@PathVariable String slug, Authentication auth) {
        return ResponseEntity.ok(service.detail(slug, auth.getName()));
    }

    @PostMapping("/{slug}/enroll")
    public ResponseEntity<Map<String, Object>> enroll(@PathVariable String slug, Authentication auth) {
        return ResponseEntity.ok(service.enroll(slug, auth.getName()));
    }

    @DeleteMapping("/{slug}/enroll")
    public ResponseEntity<Map<String, Object>> unenroll(@PathVariable String slug, Authentication auth) {
        return ResponseEntity.ok(service.unenroll(slug, auth.getName()));
    }

    @PatchMapping("/{slug}/topics/{topicId}")
    public ResponseEntity<Map<String, Object>> updateTopic(@PathVariable String slug,
                                                           @PathVariable Long topicId,
                                                           @RequestBody FeatureRequests.TopicUpdate request,
                                                           Authentication auth) {
        if (request == null || request.completed() == null) {
            throw new IllegalArgumentException("completed is required");
        }
        return ResponseEntity.ok(service.updateTopic(slug, topicId, auth.getName(), request.completed()));
    }
}
