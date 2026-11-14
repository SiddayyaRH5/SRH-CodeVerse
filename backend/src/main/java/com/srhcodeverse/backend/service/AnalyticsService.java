package com.srhcodeverse.backend.service;

import com.srhcodeverse.backend.dto.*;
import com.srhcodeverse.backend.entity.Problem;
import com.srhcodeverse.backend.entity.Role;
import com.srhcodeverse.backend.entity.Submission;
import com.srhcodeverse.backend.entity.User;
import com.srhcodeverse.backend.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
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

    @Transactional(readOnly = true)
    public PersonalAnalyticsResponse getAnalyticsForUser(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        long solved = submissionRepository.countDistinctSolvedProblems(user);
        long totalAvailable = problemRepository.count();
        List<Submission> accepted = submissionRepository
                .findByStudentAndStatus(user, Submission.Status.PASSED);
        Set<LocalDate> acceptedDays = accepted.stream()
                .map(Submission::getSubmittedAt)
                .filter(Objects::nonNull)
                .map(LocalDateTime::toLocalDate)
                .collect(Collectors.toSet());

        return PersonalAnalyticsResponse.builder()
                .problemsSolved(solved)
                .totalAvailableProblems(totalAvailable)
                .solveCoverage(totalAvailable == 0 ? 0 : (solved * 100.0) / totalAvailable)
                .currentStreak(calculateCurrentStreak(acceptedDays, LocalDate.now()))
                .activeDays(acceptedDays.size())
                .activity(getActivityForUser(user, LocalDate.now()))
                .difficultyMastery(getDifficultyMastery(user))
                .build();
    }

    private int calculateCurrentStreak(Set<LocalDate> acceptedDays, LocalDate today) {
        LocalDate cursor = acceptedDays.contains(today) ? today : today.minusDays(1);
        int streak = 0;
        while (acceptedDays.contains(cursor)) {
            streak++;
            cursor = cursor.minusDays(1);
        }
        return streak;
    }

    private List<DayCount> getActivityForUser(User user, LocalDate today) {
        LocalDate startDate = today.minusDays(13);
        Map<String, Long> countsByDate = submissionRepository
                .countSubmissionsByDayForStudent(user, startDate.atStartOfDay())
                .stream()
                .collect(Collectors.toMap(row -> row[0].toString(), row -> (Long) row[1]));

        List<DayCount> activity = new ArrayList<>();
        for (int i = 13; i >= 0; i--) {
            String date = today.minusDays(i).toString();
            activity.add(DayCount.builder().date(date).count(countsByDate.getOrDefault(date, 0L)).build());
        }
        return activity;
    }

    private List<DifficultyMastery> getDifficultyMastery(User user) {
        Map<String, Long> solvedByDifficulty = submissionRepository
                .countDistinctSolvedProblemsByDifficulty(user)
                .stream()
                .collect(Collectors.toMap(
                        row -> row[0].toString(),
                        row -> (Long) row[1]));

        List<DifficultyMastery> mastery = new ArrayList<>();
        for (Problem.Difficulty difficulty : Problem.Difficulty.values()) {
            mastery.add(new DifficultyMastery(
                    difficulty.name(),
                    solvedByDifficulty.getOrDefault(difficulty.name(), 0L),
                    problemRepository.countByDifficulty(difficulty)));
        }
        return mastery;
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
