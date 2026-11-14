package com.srhcodeverse.backend.service;

import com.srhcodeverse.backend.entity.Problem;
import com.srhcodeverse.backend.entity.Submission;
import com.srhcodeverse.backend.repository.SubmissionRepository;
import org.junit.jupiter.api.Test;

import java.lang.reflect.Proxy;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;

class SubmissionServiceTest {

    @Test
    void returnsPersistedLanguageInSubmissionHistory() {
        Problem problem = Problem.builder().id(7L).title("Two Sum").build();
        Submission javascriptSubmission = Submission.builder()
                .id(19L)
                .problem(problem)
                .code("console.log('test')")
                .language("javascript")
                .status(Submission.Status.PASSED)
                .passedTestCount(3)
                .totalTestCount(3)
                .runtimeMs(12L)
                .build();
        Submission javaSubmission = Submission.builder()
                .id(20L)
                .problem(problem)
                .code("class Solution {}")
                .language("java")
                .status(Submission.Status.PASSED)
                .build();
        Submission pythonSubmission = Submission.builder()
                .id(21L)
                .problem(problem)
                .code("print('test')")
                .language("python")
                .status(Submission.Status.FAILED)
                .build();

        SubmissionRepository submissionRepository = (SubmissionRepository) Proxy.newProxyInstance(
                getClass().getClassLoader(),
                new Class<?>[] { SubmissionRepository.class },
                (proxy, method, args) -> method.getName().equals("findByStudentUsernameOrderBySubmittedAtDesc")
                        ? List.of(javascriptSubmission, javaSubmission, pythonSubmission)
                        : null);
        SubmissionService submissionService = new SubmissionService(
                null, null, submissionRepository, null, null, null);

        var history = submissionService.getMySubmissions("student");

        assertEquals("javascript", history.getFirst().language());
        assertEquals(7L, history.getFirst().problemId());
        assertEquals(List.of("javascript", "java", "python"),
                history.stream().map(item -> item.language()).toList());
    }
}
