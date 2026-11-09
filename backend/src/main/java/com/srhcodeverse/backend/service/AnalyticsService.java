package com.srhcodeverse.backend.service;

import com.srhcodeverse.backend.dto.*;
import com.srhcodeverse.backend.entity.Problem;
import com.srhcodeverse.backend.entity.Role;
import com.srhcodeverse.backend.entity.User;
import com.srhcodeverse.backend.repository.*;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class AnalyticsService {

    private final SubmissionRepository submissionRepository;
    private final ProblemRepository problemRepository;
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;

    public AnalyticsService(SubmissionRepository submissionRepository, ProblemRepository problemRepository,
                             UserRepository userRepository, RoleRepository roleRepository) {
        this.submissionRepository = submissionRepository;
        this.problemRepository = problemRepository;
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
    }

    public AnalyticsResponse getAnalytics() {
        return AnalyticsResponse.builder()
                .submissionTrend(getSubmissionTrend())
                .difficultyDistribution(getDifficultyDistribution())
                .studentActivity(getStudentActivity())
                .build();
    }

    private List<DayCount> getSubmissionTrend() {
        LocalDateTime sevenDaysAgo = java.time.LocalDate.now().minusDays(6).atStartOfDay();
        Map<String, Long> countsByDate = submissionRepository.countSubmissionsByDay(sevenDaysAgo).stream()
                .collect(Collectors.toMap(row -> row[0].toString(), row -> (Long) row[1]));

        List<DayCount> trend = new ArrayList<>();
        for (int i = 6; i >= 0; i--) {
            String date = java.time.LocalDate.now().minusDays(i).toString();
            trend.add(DayCount.builder().date(date).count(countsByDate.getOrDefault(date, 0L)).build());
        }
        return trend;
    }

    private Map<String, Long> getDifficultyDistribution() {
        Map<String, Long> dist = new LinkedHashMap<>();
        for (Problem.Difficulty d : Problem.Difficulty.values()) {
            dist.put(d.name(), problemRepository.countByDifficulty(d));
        }
        return dist;
    }

    private List<StudentActivity> getStudentActivity() {
        Role studentRole = roleRepository.findByName("STUDENT")
                .orElseThrow(() -> new IllegalStateException("STUDENT role not seeded"));

        List<User> students = userRepository.findAll().stream()
                .filter(u -> u.getRole().getId().equals(studentRole.getId()))
                .toList();

        return students.stream()
                .map(s -> {
                    long solved = submissionRepository.countDistinctSolvedProblems(s);
                    long total = submissionRepository.countByStudent(s);
                    var submissions = submissionRepository.findByStudentOrderBySubmittedAtDesc(s);
                    String lastActive = submissions.isEmpty() ? "Never" : submissions.get(0).getSubmittedAt().toString();

                    return StudentActivity.builder()
                            .username(s.getUsername())
                            .problemsSolved(solved)
                            .totalSubmissions(total)
                            .lastActive(lastActive)
                            .build();
                })
                .sorted((a, b) -> Long.compare(b.getProblemsSolved(), a.getProblemsSolved()))
                .collect(Collectors.toList());
    }
}