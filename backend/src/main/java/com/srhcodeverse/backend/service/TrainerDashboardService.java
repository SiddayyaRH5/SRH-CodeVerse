package com.srhcodeverse.backend.service;

import com.srhcodeverse.backend.dto.*;
import com.srhcodeverse.backend.entity.Role;
import com.srhcodeverse.backend.entity.Submission;
import com.srhcodeverse.backend.repository.*;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class TrainerDashboardService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final ProblemRepository problemRepository;
    private final SubmissionRepository submissionRepository;

    public TrainerDashboardService(UserRepository userRepository, RoleRepository roleRepository,
                                     ProblemRepository problemRepository, SubmissionRepository submissionRepository) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.problemRepository = problemRepository;
        this.submissionRepository = submissionRepository;
    }

    public TrainerDashboardResponse getDashboard(String username) {
        Role studentRole = roleRepository.findByName("STUDENT")
                .orElseThrow(() -> new IllegalStateException("STUDENT role not seeded"));

        long totalStudents = userRepository.countByRole(studentRole);
        long totalProblems = problemRepository.count();
        long totalSubmissions = submissionRepository.count();

        long totalPassed = submissionRepository.countByStatus(Submission.Status.PASSED);
        double successRate = totalSubmissions == 0 ? 0.0 : (totalPassed * 100.0) / totalSubmissions;

        LocalDateTime startOfToday = LocalDate.now().atStartOfDay();
        long activeToday = submissionRepository.countActiveStudents(startOfToday);
        long solvedToday = submissionRepository.countByStatusAndSubmittedAtAfter(Submission.Status.PASSED, startOfToday);
        long submissionsToday = submissionRepository.countTodaysSubmissions(startOfToday);

        return TrainerDashboardResponse.builder()
                .username(username)
                .totalProblems(totalProblems)
                .totalStudents(totalStudents)
                .totalSubmissions(totalSubmissions)
                .successRate(Math.round(successRate * 10) / 10.0)
                .activeToday(activeToday)
                .solvedToday(solvedToday)
                .submissionsToday(submissionsToday)
                .build();
    }

    public List<RecentSubmissionResponse> getRecentSubmissions() {
        return submissionRepository.findTop10ByOrderBySubmittedAtDesc().stream()
                .map(s -> RecentSubmissionResponse.builder()
                        .studentUsername(s.getStudent().getUsername())
                        .problemTitle(s.getProblem().getTitle())
                        .status(s.getStatus().name())
                        .submittedAt(s.getSubmittedAt())
                        .build())
                .collect(Collectors.toList());
    }

    public List<ProblemPerformanceResponse> getProblemPerformance() {
        return submissionRepository.getAttemptsAndPassesByProblem().stream()
                .map(row -> {
                    String title = (String) row[0];
                    long total = (Long) row[1];
                    long passed = ((Number) row[2]).longValue();
                    double rate = total == 0 ? 0.0 : (passed * 100.0) / total;
                    return ProblemPerformanceResponse.builder()
                            .problemTitle(title)
                            .successRate(Math.round(rate * 10) / 10.0)
                            .totalAttempts(total)
                            .build();
                })
                .sorted((a, b) -> Double.compare(b.getSuccessRate(), a.getSuccessRate()))
                .collect(Collectors.toList());
    }
}