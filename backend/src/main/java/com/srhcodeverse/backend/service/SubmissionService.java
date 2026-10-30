package com.srhcodeverse.backend.service;

import com.srhcodeverse.backend.dto.SubmissionHistoryResponse;

import com.srhcodeverse.backend.dto.*;
import com.srhcodeverse.backend.entity.*;
import com.srhcodeverse.backend.repository.DailyChallengeRepository;
import com.srhcodeverse.backend.repository.ProblemRepository;
import com.srhcodeverse.backend.repository.SubmissionRepository;
import com.srhcodeverse.backend.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class SubmissionService {

    private final ProblemRepository problemRepository;
    private final UserRepository userRepository;
    private final SubmissionRepository submissionRepository;
    private final ExecutionService executionService;

    // NEW
    private final DailyChallengeRepository dailyChallengeRepository;
    private final AchievementService achievementService;

    public SubmissionService(
            ProblemRepository problemRepository,
            UserRepository userRepository,
            SubmissionRepository submissionRepository,
            ExecutionService executionService,
            DailyChallengeRepository dailyChallengeRepository,
            AchievementService achievementService) {

        this.problemRepository = problemRepository;
        this.userRepository = userRepository;
        this.submissionRepository = submissionRepository;
        this.executionService = executionService;

        // NEW
        this.dailyChallengeRepository = dailyChallengeRepository;
        this.achievementService = achievementService;
    }

    // "Run" - visible test cases only, nothing saved to DB
    public SubmissionResponse runCode(Long problemId, String code, String language) {

        Problem problem = problemRepository.findById(problemId)
                .orElseThrow(() ->
                        new IllegalArgumentException("Problem not found"));

        List<TestCase> visibleTests = problem.getTestCases().stream()
                .filter(tc -> !tc.isHidden())
                .toList();

        return execute(code, visibleTests, false, language);
    }

    // "Submit" - ALL test cases, result saved to DB
    public SubmissionResponse submitCode(
            Long problemId,
            String code,
            String username,
            String language) {

        Problem problem = problemRepository.findById(problemId)
                .orElseThrow(() ->
                        new IllegalArgumentException("Problem not found"));

        User student = userRepository.findByUsername(username)
                .orElseThrow(() ->
                        new IllegalArgumentException("User not found"));

        SubmissionResponse response =
                execute(code, problem.getTestCases(), true, language);

        Submission submission = Submission.builder()
                .student(student)
                .problem(problem)
                .code(code)
                .status(Submission.Status.valueOf(response.getStatus()))
                .runtimeMs(response.getRuntimeMs())
                .passedTestCount(response.getPassedTestCount())
                .totalTestCount(response.getTotalTestCount())
                .build();

        submissionRepository.save(submission);

        // If solution is correct
        if ("PASSED".equals(response.getStatus())) {

            // 1. Update student's streak
            updateStreak(student);

            // 2. Check whether this problem is today's Daily Challenge
            boolean isDailyChallenge =
                    dailyChallengeRepository
                            .findByChallengeDate(java.time.LocalDate.now())
                            .map(dc -> dc.getProblem()
                                    .getId()
                                    .equals(problemId))
                            .orElse(false);

            // 3. Check and award achievements
            achievementService.checkAndAwardAchievements(
                    student,
                    isDailyChallenge
            );
        }

        return response;
    }

    private void updateStreak(User student) {

        java.time.LocalDate today =
                java.time.LocalDate.now();

        java.time.LocalDate lastSolved =
                student.getLastSolvedDate();

        if (lastSolved == null ||
                lastSolved.isBefore(today.minusDays(1))) {

            // Broken streak or first ever solve
            student.setForgeStreakCurrent(1);

        } else if (lastSolved.isEqual(today.minusDays(1))) {

            // Solved yesterday, continue streak
            student.setForgeStreakCurrent(
                    student.getForgeStreakCurrent() + 1
            );
        }

        // If already solved today,
        // don't increment the streak again
        if (!today.equals(lastSolved)) {
            student.setLastSolvedDate(today);
        }

        // Update longest streak
        if (student.getForgeStreakCurrent() >
                student.getForgeStreakLongest()) {

            student.setForgeStreakLongest(
                    student.getForgeStreakCurrent()
            );
        }

        userRepository.save(student);
    }

    private SubmissionResponse execute(
            String code,
            List<TestCase> testCases,
            boolean maskHidden,
            String language) {

        List<String> inputs = testCases.stream()
                .map(TestCase::getInput)
                .toList();

        List<String> expected = testCases.stream()
                .map(TestCase::getExpectedOutput)
                .toList();

        var outcome =
                executionService.runAgainstTestCases(
                        code,
                        inputs,
                        expected,
                        language
                );

        // Compilation failed
        if (!outcome.compiled()) {

            return SubmissionResponse.builder()
                    .status("COMPILE_ERROR")
                    .passedTestCount(0)
                    .totalTestCount(testCases.size())
                    .runtimeMs(0)
                    .compileError(outcome.compileError())
                    .testResults(List.of())
                    .build();
        }

        List<TestCaseResult> results =
                new ArrayList<>();

        int passedCount = 0;

        for (int i = 0; i < testCases.size(); i++) {

            TestCase tc = testCases.get(i);

            var result = outcome.results().get(i);

            if (result.passed()) {
                passedCount++;
            }

            boolean hide =
                    maskHidden && tc.isHidden();

            results.add(TestCaseResult.builder()
                    .testNumber(i + 1)
                    .hidden(tc.isHidden())
                    .passed(result.passed())
                    .input(hide ? null : tc.getInput())
                    .expectedOutput(hide ? null : tc.getExpectedOutput())
                    .actualOutput(hide ? null : result.actualOutput())
                    .errorMessage(hide ? null : result.errorMessage())
                    .build());
          
        }

        String status =
                (passedCount == testCases.size())
                        ? "PASSED"
                        : "FAILED";

        return SubmissionResponse.builder()
                .status(status)
                .passedTestCount(passedCount)
                .totalTestCount(testCases.size())
                .runtimeMs(outcome.runtimeMs())
                .testResults(results)
                .build();
    }

    public List<SubmissionHistoryResponse> getMySubmissions(String username) {
        return submissionRepository
                .findByStudentUsernameOrderBySubmittedAtDesc(username)
                .stream()
                .map(s -> new SubmissionHistoryResponse(
                        s.getId(),
                        s.getProblem().getId(),
                        s.getProblem().getTitle(),
                        s.getCode(),
                        s.getStatus().name(),
                        s.getPassedTestCount(),
                        s.getTotalTestCount(),
                        s.getRuntimeMs(),
                        s.getSubmittedAt()
                ))
                .toList();
    }
}