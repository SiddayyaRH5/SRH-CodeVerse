package com.srhcodeverse.backend.service;

import com.srhcodeverse.backend.dto.*;
import com.srhcodeverse.backend.entity.Problem;
import com.srhcodeverse.backend.entity.Submission;
import com.srhcodeverse.backend.entity.TestCase;
import com.srhcodeverse.backend.entity.User;
import com.srhcodeverse.backend.repository.ProblemRepository;
import com.srhcodeverse.backend.repository.UserRepository;
import org.springframework.stereotype.Service;
import com.srhcodeverse.backend.repository.SubmissionRepository;

import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class ProblemService {

	private final ProblemRepository problemRepository;
	private final UserRepository userRepository;
	private final SubmissionRepository submissionRepository;

	public ProblemService(ProblemRepository problemRepository,UserRepository userRepository,SubmissionRepository submissionRepository) {
	    this.problemRepository = problemRepository;
	    this.userRepository = userRepository;
	    this.submissionRepository = submissionRepository;
	}
    
    
    
 // ---------- READ (student - detail view) ----------
    public ProblemDetailResponse getProblemDetailForStudent(Long id) {
        Problem problem = problemRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Problem not found"));

        List<VisibleTestCaseResponse> visibleTestCases = problem.getTestCases().stream()
                .filter(tc -> !tc.isHidden())
                .sorted((a, b) -> {
                    Integer aIdx = a.getOrderIndex() != null ? a.getOrderIndex() : 0;
                    Integer bIdx = b.getOrderIndex() != null ? b.getOrderIndex() : 0;
                    return aIdx.compareTo(bIdx);
                })
                .map(tc -> VisibleTestCaseResponse.builder()
                        .input(tc.getInput())
                        .expectedOutput(tc.getExpectedOutput())
                        .build())
                .collect(Collectors.toList());

        return ProblemDetailResponse.builder()
                .id(problem.getId())
                .title(problem.getTitle())
                .description(problem.getDescription())
                .difficulty(problem.getDifficulty().name())
                .topic(problem.getTopic())
                .constraints(problem.getConstraints())
                .starterCode(problem.getStarterCode())
                .estimatedTimeMinutes(problem.getEstimatedTimeMinutes())
                .visibleTestCases(visibleTestCases)
                .build();
    }

    // ---------- READ (student - single hint, progressive reveal) ----------
    public HintResponse getHint(Long problemId, int hintNumber) {
        Problem problem = problemRepository.findById(problemId)
                .orElseThrow(() -> new IllegalArgumentException("Problem not found"));

        String hint = switch (hintNumber) {
            case 1 -> problem.getHint1();
            case 2 -> problem.getHint2();
            case 3 -> problem.getHint3();
            default -> throw new IllegalArgumentException("Invalid hint number: " + hintNumber);
        };

        if (hint == null || hint.isBlank()) {
            throw new IllegalArgumentException("Hint " + hintNumber + " not available for this problem");
        }

        return HintResponse.builder().hintNumber(hintNumber).hint(hint).build();
    }

    // ---------- CREATE ----------
    public ProblemResponse createProblem(ProblemRequest request, String creatorUsername) {
        User creator = userRepository.findByUsername(creatorUsername)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        Problem problem = Problem.builder()
                .title(request.getTitle())
                .description(request.getDescription())
                .difficulty(request.getDifficulty())
                .topic(request.getTopic())
                .constraints(request.getConstraints())
                .starterCode(request.getStarterCode())
                .estimatedTimeMinutes(request.getEstimatedTimeMinutes())
                .hint1(request.getHint1())
                .hint2(request.getHint2())
                .hint3(request.getHint3())
                .createdBy(creator)
                .build();

        if (request.getTestCases() != null) {
            List<TestCase> testCases = request.getTestCases().stream()
                    .map(tcReq -> TestCase.builder()
                            .problem(problem)
                            .input(tcReq.getInput())
                            .expectedOutput(tcReq.getExpectedOutput())
                            .hidden(tcReq.isHidden())
                            .orderIndex(tcReq.getOrderIndex())
                            .build())
                    .collect(Collectors.toList());
            problem.setTestCases(testCases);
        }

        Problem saved = problemRepository.save(problem);
        return toProblemResponse(saved);
    }

    // ---------- READ (trainer - full detail) ----------
    public ProblemResponse getProblemForTrainer(Long id) {
        Problem problem = problemRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Problem not found"));
        return toProblemResponse(problem);
    }

    // ---------- READ (trainer - list) ----------
    public List<ProblemResponse> getAllProblemsForTrainer() {
        return problemRepository.findAll().stream()
                .map(this::toProblemResponse)
                .collect(Collectors.toList());
    }

    // ---------- READ (student - summary list) ----------
    public List<ProblemSummaryResponse> getAllProblemsForStudent(String username) {
        User student = userRepository.findByUsername(username)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        Set<Long> solvedProblemIds = submissionRepository.findByStudentAndStatus(student, Submission.Status.PASSED)
                .stream()
                .map(s -> s.getProblem().getId())
                .collect(Collectors.toSet());

        return problemRepository.findAll().stream()
                .map(p -> ProblemSummaryResponse.builder()
                        .id(p.getId())
                        .title(p.getTitle())
                        .difficulty(p.getDifficulty().name())
                        .topic(p.getTopic())
                        .estimatedTimeMinutes(p.getEstimatedTimeMinutes())
                        .solved(solvedProblemIds.contains(p.getId()))
                        .build())
                .collect(Collectors.toList());
    }

    // ---------- UPDATE ----------
    public ProblemResponse updateProblem(Long id, ProblemRequest request) {
        Problem problem = problemRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Problem not found"));

        problem.setTitle(request.getTitle());
        problem.setDescription(request.getDescription());
        problem.setDifficulty(request.getDifficulty());
        problem.setTopic(request.getTopic());
        problem.setConstraints(request.getConstraints());
        problem.setStarterCode(request.getStarterCode());
        problem.setEstimatedTimeMinutes(request.getEstimatedTimeMinutes());
        problem.setHint1(request.getHint1());
        problem.setHint2(request.getHint2());
        problem.setHint3(request.getHint3());

        // Replace test cases entirely on update - simplest correct approach for now
        problem.getTestCases().clear();
        if (request.getTestCases() != null) {
            List<TestCase> newTestCases = request.getTestCases().stream()
                    .map(tcReq -> TestCase.builder()
                            .problem(problem)
                            .input(tcReq.getInput())
                            .expectedOutput(tcReq.getExpectedOutput())
                            .hidden(tcReq.isHidden())
                            .orderIndex(tcReq.getOrderIndex())
                            .build())
                    .collect(Collectors.toList());
            problem.getTestCases().addAll(newTestCases);
        }

        Problem updated = problemRepository.save(problem);
        return toProblemResponse(updated);
    }

    // ---------- DELETE ----------
    public void deleteProblem(Long id) {
        if (!problemRepository.existsById(id)) {
            throw new IllegalArgumentException("Problem not found");
        }
        problemRepository.deleteById(id);
    }

    // ---------- Mapping helper ----------
    private ProblemResponse toProblemResponse(Problem p) {
        List<TestCaseResponse> testCaseResponses = p.getTestCases().stream()
                .map(tc -> TestCaseResponse.builder()
                        .id(tc.getId())
                        .input(tc.getInput())
                        .expectedOutput(tc.getExpectedOutput())
                        .hidden(tc.isHidden())
                        .orderIndex(tc.getOrderIndex())
                        .build())
                .collect(Collectors.toList());

        return ProblemResponse.builder()
                .id(p.getId())
                .title(p.getTitle())
                .description(p.getDescription())
                .difficulty(p.getDifficulty().name())
                .topic(p.getTopic())
                .constraints(p.getConstraints())
                .starterCode(p.getStarterCode())
                .estimatedTimeMinutes(p.getEstimatedTimeMinutes())
                .hint1(p.getHint1())
                .hint2(p.getHint2())
                .hint3(p.getHint3())
                .createdByUsername(p.getCreatedBy().getUsername())
                .createdAt(p.getCreatedAt())
                .testCases(testCaseResponses)
                .build();
    }
}