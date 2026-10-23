package com.srhcodeverse.backend.controller;

import com.srhcodeverse.backend.dto.DailyChallengeResponse;
import com.srhcodeverse.backend.dto.SetDailyChallengeRequest;
import com.srhcodeverse.backend.service.DailyChallengeService;
import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api")
public class DailyChallengeController {

    private final DailyChallengeService dailyChallengeService;

    public DailyChallengeController(DailyChallengeService dailyChallengeService) {
        this.dailyChallengeService = dailyChallengeService;
    }

    @GetMapping("/daily-challenge")
    public DailyChallengeResponse getTodaysChallenge() {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        return dailyChallengeService.getTodaysChallenge(username);
    }

    @PreAuthorize("hasRole('TRAINER')")
    @PutMapping("/trainer/daily-challenge")
    public void setTodaysChallenge(@Valid @RequestBody SetDailyChallengeRequest request) {
        dailyChallengeService.setTodaysChallenge(request);
    }
}