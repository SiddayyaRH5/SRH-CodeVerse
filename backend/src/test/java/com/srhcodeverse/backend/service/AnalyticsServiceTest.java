package com.srhcodeverse.backend.service;

import com.srhcodeverse.backend.entity.Problem;
import com.srhcodeverse.backend.entity.User;
import com.srhcodeverse.backend.repository.ProblemRepository;
import com.srhcodeverse.backend.repository.SubmissionRepository;
import com.srhcodeverse.backend.repository.UserRepository;
import org.junit.jupiter.api.Test;

import java.lang.reflect.Proxy;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;

class AnalyticsServiceTest {

    @Test
    void calculatesPersonalAnalyticsFromAcceptedSubmissionsOnly() {
        LocalDate today = LocalDate.now();
        User user = User.builder().id(11L).username("student").build();
        List<Object> acceptedDates = List.of(
                java.sql.Timestamp.valueOf(today.atStartOfDay()),
                java.sql.Date.valueOf(today.minusDays(1)),
                today.minusDays(4));

        UserRepository userRepository = repository(UserRepository.class, (method, args) ->
                method.getName().equals("findByUsername") ? Optional.of(user) : null);
        List<Problem> problems = List.of(
                Problem.builder().id(1L).difficulty(Problem.Difficulty.EASY).build(),
                Problem.builder().id(2L).difficulty(Problem.Difficulty.EASY).build(),
                Problem.builder().id(3L).difficulty(Problem.Difficulty.MEDIUM).build(),
                Problem.builder().id(4L).difficulty(Problem.Difficulty.MEDIUM).build(),
                Problem.builder().id(5L).difficulty(Problem.Difficulty.HARD).build());
        ProblemRepository problemRepository = repository(ProblemRepository.class, (method, args) -> switch (method.getName()) {
            case "count" -> 5L;
            case "findAll" -> problems;
            default -> null;
        });
        SubmissionRepository submissionRepository = repository(SubmissionRepository.class, (method, args) -> switch (method.getName()) {
            case "countDistinctSolvedProblems" -> 2L;
            case "findDistinctAcceptedSubmissionDatesByStudent" -> acceptedDates;
            case "countSubmissionsByDayForStudent" -> List.of(
                    new Object[] { 3L, java.sql.Date.valueOf(today) },
                    new Object[] { 1L, java.sql.Date.valueOf(today.minusDays(1)) });
            case "findDistinctSolvedProblemIds" -> List.of(1L, 3L);
            default -> null;
        });

        AnalyticsService service = new AnalyticsService(submissionRepository, problemRepository,
                userRepository, null);
        var analytics = service.getAnalyticsForUser("student");

        assertEquals(2L, analytics.getProblemsSolved());
        assertEquals(5L, analytics.getTotalAvailableProblems());
        assertEquals(40.0, analytics.getSolveCoverage());
        assertEquals(2, analytics.getCurrentStreak());
        assertEquals(3L, analytics.getActiveDays());
        assertEquals(2, analytics.getLongestStreak());
        assertEquals(14, analytics.getActivity().size());
        assertEquals(3L, analytics.getActivity().getLast().getCount());
        assertEquals(List.of(1L, 1L, 0L), analytics.getDifficultyMastery().stream()
                .map(item -> item.solved()).toList());
        assertEquals(List.of(2L, 2L, 1L), analytics.getDifficultyMastery().stream()
                .map(item -> item.total()).toList());
    }

    @Test
    void calculatesLongestStreakForNoAcceptedDates() {
        // Test that longestStreak returns 0 when there are no accepted submission dates
        LocalDate today = LocalDate.now();
        User user = User.builder().id(11L).username("student").build();

        UserRepository userRepository = repository(UserRepository.class, (method, args) ->
                method.getName().equals("findByUsername") ? Optional.of(user) : null);
        SubmissionRepository submissionRepository = repository(SubmissionRepository.class, (method, args) -> switch (method.getName()) {
            case "countDistinctSolvedProblems" -> 0L;
            case "findDistinctAcceptedSubmissionDatesByStudent" -> List.of();
            case "countSubmissionsByDayForStudent" -> List.of();
            case "findDistinctSolvedProblemIds" -> List.of();
            default -> null;
        });
        ProblemRepository problemRepository = repository(ProblemRepository.class, (method, args) -> switch (method.getName()) {
            case "count" -> 0L;
            case "findAll" -> List.of();
            default -> null;
        });

        AnalyticsService service = new AnalyticsService(submissionRepository, problemRepository, userRepository, null);
        var analytics = service.getAnalyticsForUser("student");

        assertEquals(0, analytics.getLongestStreak());
        assertEquals(0, analytics.getCurrentStreak());
    }

    @Test
    void calculatesLongestStreakForOneAcceptedDate() {
        // Test that longestStreak returns 1 when there is one accepted submission date
        LocalDate today = LocalDate.now();
        User user = User.builder().id(11L).username("student").build();

        List<Object> acceptedDates = List.of(java.sql.Date.valueOf(today));
        UserRepository userRepository = repository(UserRepository.class, (method, args) ->
                method.getName().equals("findByUsername") ? Optional.of(user) : null);
        SubmissionRepository submissionRepository = repository(SubmissionRepository.class, (method, args) -> switch (method.getName()) {
            case "countDistinctSolvedProblems" -> 1L;
            case "findDistinctAcceptedSubmissionDatesByStudent" -> acceptedDates;
            case "countSubmissionsByDayForStudent" -> List.of();
            case "findDistinctSolvedProblemIds" -> List.of(1L);
            default -> null;
        });
        ProblemRepository problemRepository = repository(ProblemRepository.class, (method, args) -> switch (method.getName()) {
            case "count" -> 1L;
            case "findAll" -> List.of(
                    Problem.builder().id(1L).difficulty(Problem.Difficulty.EASY).build()
            );
            default -> null;
        });

        AnalyticsService service = new AnalyticsService(submissionRepository, problemRepository, userRepository, null);
        var analytics = service.getAnalyticsForUser("student");

        assertEquals(1, analytics.getLongestStreak());
        assertEquals(1, analytics.getCurrentStreak());
    }

    @Test
    void calculatesLongestStreakWithThreeConsecutiveDates() {
        // Test that longestStreak returns 3 for three consecutive dates
        LocalDate today = LocalDate.now();
        User user = User.builder().id(11L).username("student").build();

        List<Object> acceptedDates = List.of(
                java.sql.Date.valueOf(today),
                java.sql.Date.valueOf(today.minusDays(1)),
                java.sql.Date.valueOf(today.minusDays(2))
        );
        UserRepository userRepository = repository(UserRepository.class, (method, args) ->
                method.getName().equals("findByUsername") ? Optional.of(user) : null);
        SubmissionRepository submissionRepository = repository(SubmissionRepository.class, (method, args) -> switch (method.getName()) {
            case "countDistinctSolvedProblems" -> 3L;
            case "findDistinctAcceptedSubmissionDatesByStudent" -> acceptedDates;
            case "countSubmissionsByDayForStudent" -> List.of();
            case "findDistinctSolvedProblemIds" -> List.of(1L, 2L, 3L);
            default -> null;
        });
        ProblemRepository problemRepository = repository(ProblemRepository.class, (method, args) -> switch (method.getName()) {
            case "count" -> 3L;
            case "findAll" -> List.of(
                    Problem.builder().id(1L).difficulty(Problem.Difficulty.EASY).build(),
                    Problem.builder().id(2L).difficulty(Problem.Difficulty.MEDIUM).build(),
                    Problem.builder().id(3L).difficulty(Problem.Difficulty.HARD).build()
            );
            default -> null;
        });

        AnalyticsService service = new AnalyticsService(submissionRepository, problemRepository, userRepository, null);
        var analytics = service.getAnalyticsForUser("student");

        assertEquals(3, analytics.getLongestStreak());
        assertEquals(3, analytics.getCurrentStreak());
    }

    @Test
    void calculatesLongestStreakWithGap() {
        // Test that longestStreak returns only the consecutive run, not total dates
        // Dates: today, yesterday, (gap 2 days), day-5, day-6
        // Consecutive runs: 2 (today-yesterday), 2 (day-5-day-6) → longest = 2
        LocalDate today = LocalDate.now();
        User user = User.builder().id(11L).username("student").build();

        List<Object> acceptedDates = List.of(
                java.sql.Date.valueOf(today),
                java.sql.Date.valueOf(today.minusDays(1)),
                java.sql.Date.valueOf(today.minusDays(5)),
                java.sql.Date.valueOf(today.minusDays(6))
        );
        UserRepository userRepository = repository(UserRepository.class, (method, args) ->
                method.getName().equals("findByUsername") ? Optional.of(user) : null);
        SubmissionRepository submissionRepository = repository(SubmissionRepository.class, (method, args) -> switch (method.getName()) {
            case "countDistinctSolvedProblems" -> 4L;
            case "findDistinctAcceptedSubmissionDatesByStudent" -> acceptedDates;
            case "countSubmissionsByDayForStudent" -> List.of();
            case "findDistinctSolvedProblemIds" -> List.of(1L, 2L, 3L, 4L);
            default -> null;
        });
        ProblemRepository problemRepository = repository(ProblemRepository.class, (method, args) -> switch (method.getName()) {
            case "count" -> 4L;
            case "findAll" -> List.of(
                    Problem.builder().id(1L).difficulty(Problem.Difficulty.EASY).build(),
                    Problem.builder().id(2L).difficulty(Problem.Difficulty.MEDIUM).build(),
                    Problem.builder().id(3L).difficulty(Problem.Difficulty.MEDIUM).build(),
                    Problem.builder().id(4L).difficulty(Problem.Difficulty.HARD).build()
            );
            default -> null;
        });

        AnalyticsService service = new AnalyticsService(submissionRepository, problemRepository, userRepository, null);
        var analytics = service.getAnalyticsForUser("student");

        // Longest consecutive run is 2 (either today-yesterday or day-5-day-6)
        assertEquals(2, analytics.getLongestStreak());
        assertEquals(2, analytics.getCurrentStreak());
    }

    @Test
    void calculatesLongestStreakWithDuplicateDates() {
        // Test that duplicate dates are counted only once
        LocalDate today = LocalDate.now();
        User user = User.builder().id(11L).username("student").build();

        List<Object> acceptedDates = List.of(
                java.sql.Date.valueOf(today),
                java.sql.Date.valueOf(today),  // duplicate
                java.sql.Date.valueOf(today.minusDays(1)),
                java.sql.Date.valueOf(today.minusDays(1))  // duplicate
        );
        UserRepository userRepository = repository(UserRepository.class, (method, args) ->
                method.getName().equals("findByUsername") ? Optional.of(user) : null);
        SubmissionRepository submissionRepository = repository(SubmissionRepository.class, (method, args) -> switch (method.getName()) {
            case "countDistinctSolvedProblems" -> 2L;
            case "findDistinctAcceptedSubmissionDatesByStudent" -> acceptedDates;
            case "countSubmissionsByDayForStudent" -> List.of();
            case "findDistinctSolvedProblemIds" -> List.of(1L, 2L);
            default -> null;
        });
        ProblemRepository problemRepository = repository(ProblemRepository.class, (method, args) -> switch (method.getName()) {
            case "count" -> 2L;
            case "findAll" -> List.of(
                    Problem.builder().id(1L).difficulty(Problem.Difficulty.EASY).build(),
                    Problem.builder().id(2L).difficulty(Problem.Difficulty.HARD).build()
            );
            default -> null;
        });

        AnalyticsService service = new AnalyticsService(submissionRepository, problemRepository, userRepository, null);
        var analytics = service.getAnalyticsForUser("student");

        // Distinct dates: today and yesterday = 2 consecutive
        assertEquals(2, analytics.getLongestStreak());
        assertEquals(2, analytics.getCurrentStreak());
    }

    @Test
    void longestStreakGreaterThanCurrentStreak() {
        // Test scenario: user had streaks of different lengths.
        // acceptedDates: today-5, today-4, today-3 (3 consecutive days),
        // and today-1 (yesterday, separated from the 3-day run by a gap at today-2).
        // Longest streak = 3 (consecutive from today-5 to today-3).
        // Current streak = 1 (yesterday only, since today-2 is not in the set).
        LocalDate today = LocalDate.now();
        User user = User.builder().id(11L).username("student").build();

        List<Object> acceptedDates = List.of(
                java.sql.Date.valueOf(today.minusDays(5)),  // 5 days ago
                java.sql.Date.valueOf(today.minusDays(4)),  // 4 days ago
                java.sql.Date.valueOf(today.minusDays(3)),  // 3 days ago
                java.sql.Date.valueOf(today.minusDays(1))   // yesterday (today-2 is absent)
        );
        UserRepository userRepository = repository(UserRepository.class, (method, args) ->
                method.getName().equals("findByUsername") ? Optional.of(user) : null);
        SubmissionRepository submissionRepository = repository(SubmissionRepository.class, (method, args) -> switch (method.getName()) {
            case "countDistinctSolvedProblems" -> 4L;
            case "findDistinctAcceptedSubmissionDatesByStudent" -> acceptedDates;
            case "countSubmissionsByDayForStudent" -> List.of();
            case "findDistinctSolvedProblemIds" -> List.of(1L, 2L, 3L, 4L);
            default -> null;
        });
        ProblemRepository problemRepository = repository(ProblemRepository.class, (method, args) -> switch (method.getName()) {
            case "count" -> 4L;
            case "findAll" -> List.of(
                    Problem.builder().id(1L).difficulty(Problem.Difficulty.EASY).build(),
                    Problem.builder().id(2L).difficulty(Problem.Difficulty.MEDIUM).build(),
                    Problem.builder().id(3L).difficulty(Problem.Difficulty.MEDIUM).build(),
                    Problem.builder().id(4L).difficulty(Problem.Difficulty.HARD).build()
            );
            default -> null;
        });

        AnalyticsService service = new AnalyticsService(submissionRepository, problemRepository, userRepository, null);
        var analytics = service.getAnalyticsForUser("student");

        // Longest streak = 3 (consecutive from 5 days ago to 3 days ago).
        // Current streak = 1 (yesterday only, since today-2 is absent).
        assertEquals(3, analytics.getLongestStreak());
        assertEquals(1, analytics.getCurrentStreak());
    }

    @SuppressWarnings("unchecked")
    private <T> T repository(Class<T> type, RepositoryMethod handler) {
        return (T) Proxy.newProxyInstance(getClass().getClassLoader(), new Class<?>[] { type },
                (proxy, method, args) -> handler.invoke(method, args));
    }

    @FunctionalInterface
    private interface RepositoryMethod {
        Object invoke(java.lang.reflect.Method method, Object[] args);
    }
}
