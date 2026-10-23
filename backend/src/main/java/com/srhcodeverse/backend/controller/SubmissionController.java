package com.srhcodeverse.backend.controller;

import com.srhcodeverse.backend.dto.SubmissionRequest;
import com.srhcodeverse.backend.dto.SubmissionResponse;
import com.srhcodeverse.backend.service.SubmissionService;
import jakarta.validation.Valid;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api")
public class SubmissionController {

    private final SubmissionService submissionService;

    public SubmissionController(SubmissionService submissionService) {
        this.submissionService = submissionService;
    }

    @PostMapping("/problems/{id}/run")
    public SubmissionResponse run(@PathVariable Long id, @RequestBody SubmissionRequest request) {
        return submissionService.runCode(id, request.getCode());
    }

    @PostMapping("/problems/{id}/submit")
    public SubmissionResponse submit(@PathVariable Long id, @RequestBody SubmissionRequest request) {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        return submissionService.submitCode(id, request.getCode(), username);
    }
}