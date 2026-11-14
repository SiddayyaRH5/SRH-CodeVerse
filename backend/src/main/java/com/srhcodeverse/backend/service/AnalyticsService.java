package com.srhcodeverse.backend.service;

import com.srhcodeverse.backend.dto.*;
import com.srhcodeverse.backend.entity.Problem;
import com.srhcodeverse.backend.entity.Role;
import com.srhcodeverse.backend.entity.User;
import com.srhcodeverse.backend.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
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
        Set<Long> solvedProblemIds = new HashSet<>(submissionRepository.findDistinctSolvedProblemIds(user));
        Set<LocalDate> acceptedDays = submissionRepository
                .findDistinctAcceptedSubmissionDatesByStudent(user)
                .stream()
                .map(this::toLocalDate)
                .collect(Collectors.toSet());

        return PersonalAnalyticsResponse.builder()
                .problemsSolved(solved)
                .totalAvailableProblems(totalAvailable)
                .solveCoverage(totalAvailable == 0 ? 0 : (solved * 100.0) / totalAvailable)
                .currentStreak(calculateCurrentStreak(acceptedDays, LocalDate.now()))
                .activeDays(acceptedDays.size())
                .activity(getActivityForUser(user, LocalDate.now()))
                .difficultyMastery(getDifficultyMastery(solvedProblemIds))
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

    private LocalDate toLocalDate(Object value) {
        if (value instanceof LocalDate date) {
            return date;
        }
        if (value instanceof java.sql.Date date) {
            return date.toLocalDate();
        }
        if (value instanceof java.sql.Timestamp timestamp) {
            return timestamp.toLocalDateTime().toLocalDate();
        }
        if (value instanceof LocalDateTime dateTime) {
            return dateTime.toLocalDate();
        }
        if (value instanceof java.util.Date date) {
            return date.toInstant().atZone(ZoneId.systemDefault()).toLocalDate();
        }

        String text = String.valueOf(value);
        try {
            return LocalDate.parse(text.length() >= 10 ? text.substring(0, 10) : text);
        } catch (RuntimeException e) {
            throw new IllegalStateException("Unsupported accepted-submission date value: " + text, e);
        }
    }

    private List<DayCount> getActivityForUser(User user, LocalDate today) {
        LocalDate startDate = today.minusDays(13);
        Map<String, Long> countsByDate = submissionRepository
                .countSubmissionsByDayForStudent(user, startDate.atStartOfDay())
                .stream()
                .collect(Collectors.toMap(
                        row -> toLocalDate(row[1]).toString(),
                        row -> toLong(row[0])));

        List<DayCount> activity = new ArrayList<>();
        for (int i = 13; i >= 0; i--) {
            String date = today.minusDays(i).toString();
            activity.add(DayCount.builder().date(date).count(countsByDate.getOrDefault(date, 0L)).build());
        }
        return activity;
    }

    private long toLong(Object value) {
        if (value instanceof Number number) {
            return number.longValue();
        }
        throw new IllegalStateException("Unsupported submission count value: " + value);
    }

    private List<DifficultyMastery> getDifficultyMastery(Set<Long> solvedProblemIds) {
        Map<Problem.Difficulty, Long> totalByDifficulty = new EnumMap<>(Problem.Difficulty.class);
        Map<Problem.Difficulty, Long> solvedByDifficulty = new EnumMap<>(Problem.Difficulty.class);
        for (Problem problem : problemRepository.findAll()) {
            totalByDifficulty.merge(problem.getDifficulty(), 1L, Long::sum);
            if (solvedProblemIds.contains(problem.getId())) {
                solvedByDifficulty.merge(problem.getDifficulty(), 1L, Long::sum);
            }
        }

        return Arrays.stream(Problem.Difficulty.values())
                .map(difficulty -> new DifficultyMastery(
                        difficulty.name(),
                        solvedByDifficulty.getOrDefault(difficulty, 0L),
                        totalByDifficulty.getOrDefault(difficulty, 0L)))
                .toList();
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
