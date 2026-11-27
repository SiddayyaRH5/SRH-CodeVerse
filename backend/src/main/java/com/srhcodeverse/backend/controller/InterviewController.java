package com.srhcodeverse.backend.controller;

import com.srhcodeverse.backend.dto.FeatureRequests;
import com.srhcodeverse.backend.service.InterviewService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/interviews")
public class InterviewController {

    private final InterviewService service;

    public InterviewController(InterviewService service) {
        this.service = service;
    }

    @GetMapping("/categories")
    public ResponseEntity<List<Map<String, Object>>> categories() {
        return ResponseEntity.ok(service.categories());
    }

    @GetMapping("/questions")
    public ResponseEntity<Map<String, Object>> questions(
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String difficulty,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(service.questions(category, difficulty, search, page, size));
    }

    @PostMapping("/sessions")
    public ResponseEntity<Map<String, Object>> start(@RequestBody FeatureRequests.InterviewStart request,
                                                     Authentication auth) {
        return ResponseEntity.ok(service.start(auth.getName(),
                request.category(), request.difficulty(), request.questionCount(),
                request.durationMinutes(), request.mode()));
    }

    @GetMapping("/sessions/{id}")
    public ResponseEntity<Map<String, Object>> session(@PathVariable Long id, Authentication auth) {
        return ResponseEntity.ok(service.session(id, auth.getName()));
    }

    @PatchMapping("/sessions/{id}/answers/{sessionQuestionId}")
    public ResponseEntity<Map<String, Object>> answer(@PathVariable Long id,
                                                      @PathVariable Long sessionQuestionId,
                                                      @RequestBody FeatureRequests.InterviewAnswer request,
                                                      Authentication auth) {
        return ResponseEntity.ok(service.saveAnswer(id, sessionQuestionId, auth.getName(),
                request.selectedOption(), request.answerText(), request.flagged()));
    }

    @PostMapping("/sessions/{id}/submit")
    public ResponseEntity<Map<String, Object>> submit(@PathVariable Long id, Authentication auth) {
        return ResponseEntity.ok(service.submit(id, auth.getName()));
    }

    @GetMapping("/sessions/{id}/result")
    public ResponseEntity<Map<String, Object>> result(@PathVariable Long id, Authentication auth) {
        return ResponseEntity.ok(service.result(id, auth.getName()));
    }

    @GetMapping("/history")
    public ResponseEntity<Map<String, Object>> history(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            Authentication auth) {
        return ResponseEntity.ok(service.history(auth.getName(), page, size));
    }

    @GetMapping("/analytics")
    public ResponseEntity<Map<String, Object>> analytics(Authentication auth) {
        return ResponseEntity.ok(service.analytics(auth.getName()));
    }
}
