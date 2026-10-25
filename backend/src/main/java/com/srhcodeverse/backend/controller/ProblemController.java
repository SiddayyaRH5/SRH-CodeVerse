package com.srhcodeverse.backend.controller;

import com.srhcodeverse.backend.dto.AchievementResponse;
import com.srhcodeverse.backend.dto.HintResponse;
import com.srhcodeverse.backend.dto.ProblemDetailResponse;
import com.srhcodeverse.backend.dto.ProblemRequest;
import com.srhcodeverse.backend.dto.ProblemResponse;
import com.srhcodeverse.backend.dto.ProblemSummaryResponse;
import com.srhcodeverse.backend.dto.RunCodeRequest;
import com.srhcodeverse.backend.entity.User;
import com.srhcodeverse.backend.repository.SubmissionRepository;
import com.srhcodeverse.backend.repository.UserRepository;
import com.srhcodeverse.backend.service.DashboardService;
import com.srhcodeverse.backend.service.ExecutionService;
import com.srhcodeverse.backend.service.ProblemService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class ProblemController {

    private final ProblemService problemService;
    private final ExecutionService executionService;
    private final DashboardService dashboardService;
    private final UserRepository userRepository;
    private final SubmissionRepository submissionRepository;

    public ProblemController(
            ProblemService problemService,
            ExecutionService executionService,
            DashboardService dashboardService,
            UserRepository userRepository,
            SubmissionRepository submissionRepository) {

        this.problemService = problemService;
        this.executionService = executionService;
        this.dashboardService = dashboardService;
        this.userRepository = userRepository;
        this.submissionRepository = submissionRepository;
    }

    // ---------- TRAINER endpoints ----------

    @PreAuthorize("hasRole('TRAINER')")
    @PostMapping("/trainer/problems")
    public ResponseEntity<ProblemResponse> createProblem(
            @Valid @RequestBody ProblemRequest request) {

        String username = getCurrentUsername();

        return ResponseEntity.ok(
                problemService.createProblem(request, username)
        );
    }

    @PreAuthorize("hasRole('TRAINER')")
    @GetMapping("/trainer/problems")
    public ResponseEntity<List<ProblemResponse>> getAllProblemsForTrainer() {

        return ResponseEntity.ok(
                problemService.getAllProblemsForTrainer()
        );
    }

    @PreAuthorize("hasRole('TRAINER')")
    @GetMapping("/trainer/problems/{id}")
    public ResponseEntity<ProblemResponse> getProblemForTrainer(
            @PathVariable Long id) {

        return ResponseEntity.ok(
                problemService.getProblemForTrainer(id)
        );
    }

    @PreAuthorize("hasRole('TRAINER')")
    @PutMapping("/trainer/problems/{id}")
    public ResponseEntity<ProblemResponse> updateProblem(
            @PathVariable Long id,
            @Valid @RequestBody ProblemRequest request) {

        return ResponseEntity.ok(
                problemService.updateProblem(id, request)
        );
    }

    @PreAuthorize("hasRole('TRAINER')")
    @DeleteMapping("/trainer/problems/{id}")
    public ResponseEntity<Void> deleteProblem(
            @PathVariable Long id) {

        problemService.deleteProblem(id);

        return ResponseEntity.noContent().build();
    }

    // ---------- STUDENT endpoints ----------

    @GetMapping("/problems")
    public ResponseEntity<List<ProblemSummaryResponse>> getAllProblemsForStudent() {
        String username = getCurrentUsername();
        return ResponseEntity.ok(problemService.getAllProblemsForStudent(username));
    }

    @GetMapping("/problems/{id}")
    public ResponseEntity<ProblemDetailResponse>
    getProblemDetail(@PathVariable Long id) {

        return ResponseEntity.ok(
                problemService.getProblemDetailForStudent(id)
        );
    }

    @GetMapping("/problems/{id}/hints/{hintNumber}")
    public ResponseEntity<HintResponse>
    getHint(
            @PathVariable Long id,
            @PathVariable int hintNumber) {

        return ResponseEntity.ok(
                problemService.getHint(id, hintNumber)
        );
    }

    // ---------- ACHIEVEMENTS ----------

    @GetMapping("/achievements")
    public ResponseEntity<List<AchievementResponse>>
    getAchievements() {

        String username = getCurrentUsername();

        return ResponseEntity.ok(
                dashboardService.getAchievements(username)
        );
    }

    // ---------- MY LAST CODE ----------

    @GetMapping("/problems/{id}/my-code")
    public Map<String, String> getMyLastCode(
            @PathVariable Long id) {

        String username = getCurrentUsername();

        User user = userRepository.findByUsername(username)
                .orElseThrow(() ->
                        new IllegalArgumentException("User not found"));

        return submissionRepository
                .findFirstByStudentAndProblemIdOrderBySubmittedAtDesc(
                        user,
                        id
                )
                .map(s -> Map.of("code", s.getCode()))
                .orElse(Map.of());
    }

    // ---------- helper ----------

    private String getCurrentUsername() {

        Authentication auth =
                SecurityContextHolder
                        .getContext()
                        .getAuthentication();

        return auth.getName();
    }


}
