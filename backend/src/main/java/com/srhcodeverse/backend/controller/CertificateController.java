package com.srhcodeverse.backend.controller;

import com.srhcodeverse.backend.dto.FeatureRequests;
import com.srhcodeverse.backend.service.CertificateService;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/certificates")
public class CertificateController {

    private final CertificateService service;

    public CertificateController(CertificateService service) {
        this.service = service;
    }

    @GetMapping
    public ResponseEntity<Map<String, Object>> catalog(Authentication auth) {
        return ResponseEntity.ok(service.catalog(auth.getName()));
    }

    @GetMapping("/my")
    public ResponseEntity<Map<String, Object>> my(Authentication auth) {
        return ResponseEntity.ok(service.my(auth.getName()));
    }

    /** Public verification endpoint. Exposes only certificate-safe fields. */
    @GetMapping("/verify/{verificationCode}")
    public ResponseEntity<Map<String, Object>> verify(@PathVariable String verificationCode) {
        return ResponseEntity.ok(service.verify(verificationCode));
    }

    @GetMapping("/issued/{certificateNumber}")
    public ResponseEntity<Map<String, Object>> issued(@PathVariable String certificateNumber,
                                                      Authentication auth) {
        return ResponseEntity.ok(service.issued(certificateNumber, auth.getName()));
    }

    @GetMapping("/issued/{certificateNumber}/download")
    public ResponseEntity<byte[]> download(@PathVariable String certificateNumber, Authentication auth) {
        byte[] pdf = service.download(certificateNumber, auth.getName());
        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_PDF)
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=\"" + certificateNumber + ".pdf\"")
                .body(pdf);
    }

    @GetMapping("/{slug}")
    public ResponseEntity<Map<String, Object>> detail(@PathVariable String slug, Authentication auth) {
        return ResponseEntity.ok(service.detail(slug, auth.getName()));
    }

    @GetMapping("/{slug}/attempts")
    public ResponseEntity<Map<String, Object>> attempts(@PathVariable String slug, Authentication auth) {
        return ResponseEntity.ok(service.attempts(slug, auth.getName()));
    }

    @PostMapping("/{slug}/attempts")
    public ResponseEntity<Map<String, Object>> startAttempt(@PathVariable String slug, Authentication auth) {
        return ResponseEntity.ok(service.startAttempt(slug, auth.getName()));
    }

    @PostMapping("/{slug}/claim")
    public ResponseEntity<Map<String, Object>> claim(@PathVariable String slug, Authentication auth) {
        return ResponseEntity.ok(service.claim(slug, auth.getName()));
    }

    @GetMapping("/attempts/{attemptId}")
    public ResponseEntity<Map<String, Object>> attempt(@PathVariable Long attemptId, Authentication auth) {
        return ResponseEntity.ok(service.attempt(attemptId, auth.getName()));
    }

    @PatchMapping("/attempts/{attemptId}/answers/{questionId}")
    public ResponseEntity<Map<String, Object>> answer(@PathVariable Long attemptId,
                                                      @PathVariable Long questionId,
                                                      @RequestBody FeatureRequests.CertificateAnswer request,
                                                      Authentication auth) {
        return ResponseEntity.ok(service.saveAnswer(attemptId, questionId, auth.getName(),
                request == null ? null : request.selectedOption()));
    }

    @PostMapping("/attempts/{attemptId}/submit")
    public ResponseEntity<Map<String, Object>> submit(@PathVariable Long attemptId, Authentication auth) {
        return ResponseEntity.ok(service.submitAttempt(attemptId, auth.getName()));
    }

    @GetMapping("/attempts/{attemptId}/result")
    public ResponseEntity<Map<String, Object>> result(@PathVariable Long attemptId, Authentication auth) {
        return ResponseEntity.ok(service.attemptResult(attemptId, auth.getName()));
    }
}
