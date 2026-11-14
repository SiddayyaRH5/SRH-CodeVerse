package com.srhcodeverse.backend.service;

import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class ExecutionServiceTest {

    private final ExecutionService executionService = new ExecutionService(new DockerExecutionService());

    @Test
    void executesTwoSumFunctionStyleExamples() {
        String code = """
                public int[] twoSum(int[] nums, int target) {
                    for (int i = 0; i < nums.length; i++)
                        for (int j = i + 1; j < nums.length; j++)
                            if (nums[i] + nums[j] == target) return new int[] { i, j };
                    return new int[0];
                }
                """;

        ExecutionService.ExecutionOutcome outcome = executionService.runAgainstTestCases(
                code,
                List.of("twoSum([2, 7, 11, 15], 9)", "twoSum([3, 2, 4], 6)", "twoSum([3, 3], 6)"),
                List.of("[0, 1]", "[1, 2]", "[0, 1]"));

        assertTrue(outcome.compiled(), outcome.compileError());
        assertTrue(outcome.results().stream().allMatch(ExecutionService.TestResult::passed));
    }

    @Test
    void executesLinkedListExamplesWithBareMethod() {
        String code = """
                public ListNode addTwoNumbers(ListNode l1, ListNode l2) {
                    ListNode dummy = new ListNode(0), tail = dummy;
                    int carry = 0;
                    while (l1 != null || l2 != null || carry != 0) {
                        int sum = carry + (l1 == null ? 0 : l1.val) + (l2 == null ? 0 : l2.val);
                        tail.next = new ListNode(sum % 10); tail = tail.next; carry = sum / 10;
                        if (l1 != null) l1 = l1.next;
                        if (l2 != null) l2 = l2.next;
                    }
                    return dummy.next;
                }
                """;

        ExecutionService.ExecutionOutcome outcome = executionService.runAgainstTestCases(
                code,
                List.of(
                        "addTwoNumbers([2, 4, 3], [5, 6, 4])",
                        "addTwoNumbers([0], [0])",
                        "addTwoNumbers([9, 9, 9, 9, 9, 9, 9], [9, 9, 9, 9])"),
                List.of("[7, 0, 8]", "[0]", "[8, 9, 9, 9, 0, 0, 0, 1]"));

        assertTrue(outcome.compiled(), outcome.compileError());
        assertTrue(outcome.results().stream().allMatch(ExecutionService.TestResult::passed));
    }

    @Test
    void executesLinkedListExamplesWithStudentDefinedNodes() {
        String code = """
                class ListNode {
                    int val; ListNode next;
                    ListNode(int val) { this.val = val; }
                }
                class Solution {
                    public ListNode addTwoNumbers(ListNode l1, ListNode l2) {
                        ListNode dummy = new ListNode(0), tail = dummy;
                        while (l1 != null || l2 != null) {
                            int sum = (l1 == null ? 0 : l1.val) + (l2 == null ? 0 : l2.val);
                            tail.next = new ListNode(sum); tail = tail.next;
                            if (l1 != null) l1 = l1.next;
                            if (l2 != null) l2 = l2.next;
                        }
                        return dummy.next;
                    }
                }
                """;

        ExecutionService.ExecutionOutcome outcome = executionService.runAgainstTestCases(
                code,
                List.of("addTwoNumbers([2, 4], [5, 6])"),
                List.of("[7, 10]"));

        assertTrue(outcome.compiled(), outcome.compileError());
        assertTrue(outcome.results().getFirst().passed(), outcome.results().getFirst().actualOutput() + " / " + outcome.results().getFirst().errorMessage());
    }

    @Test
    void parsesNestedArraysAndStringsContainingCommas() {
        String code = """
                public String[] describe(int[][] matrix, String[] labels) {
                    return new String[] { labels[0], String.valueOf(matrix[1][0]) };
                }
                """;

        ExecutionService.ExecutionOutcome outcome = executionService.runAgainstTestCases(
                code,
                List.of("describe([[1, 2], [-3, 4]], [\"first, label\", \"second\"] )"),
                List.of("[\"first, label\", \"-3\"]"));

        assertTrue(outcome.compiled(), outcome.compileError());
        assertTrue(outcome.results().getFirst().passed(), outcome.results().getFirst().actualOutput() + " / " + outcome.results().getFirst().errorMessage());
    }

    @Test
    void marksIncorrectOutputAsFailed() {
        String code = "public int[] twoSum(int[] nums, int target) { return new int[] { 0, 0 }; }";

        ExecutionService.ExecutionOutcome outcome = executionService.runAgainstTestCases(
                code, List.of("twoSum([2, 7], 9)"), List.of("[0, 1]"));

        assertTrue(outcome.compiled(), outcome.compileError());
        assertTrue(!outcome.results().getFirst().passed());
    }

    @Test
    void preservesPythonAndJavaScriptExecutionPaths() {
        ExecutionService.ExecutionOutcome python = executionService.runAgainstTestCases(
                "import sys\nprint(sys.stdin.read().strip())",
                List.of("python input"), List.of("python input"), "python");
        ExecutionService.ExecutionOutcome javascript = executionService.runAgainstTestCases(
                "const fs = require('fs'); console.log(fs.readFileSync(0, 'utf8').trim());",
                List.of("javascript input"), List.of("javascript input"), "javascript");

        assertTrue(python.compiled(), python.compileError());
        assertTrue(python.results().getFirst().passed());
        assertTrue(javascript.compiled(), javascript.compileError());
        assertTrue(javascript.results().getFirst().passed());
    }

    @Test
    void preservesWhitespaceInsideStringOutput() {
        assertEquals("[\"a b\",\"c\"]", ExecutionService.normalizeOutput("[ \"a b\", \"c\" ]"));
        assertEquals("\"a b\"", ExecutionService.normalizeOutput(" \"a b\" "));
    }

    @Test
    void executesTreeNodeFunctionWithStudentDefinedNodes() {
        String code = """
                class TreeNode {
                    int val; TreeNode left; TreeNode right;
                    TreeNode(int val) { this.val = val; }
                }
                class Solution {
                    public TreeNode invertTree(TreeNode root) {
                        if (root == null) return null;
                        TreeNode left = invertTree(root.left);
                        root.left = invertTree(root.right);
                        root.right = left;
                        return root;
                    }
                }
                """;

        ExecutionService.ExecutionOutcome outcome = executionService.runAgainstTestCases(
                code, List.of("invertTree([4, 2, 7, 1, 3, 6, 9])"),
                List.of("[4, 7, 2, 9, 6, 3, 1]"));

        assertTrue(outcome.compiled(), outcome.compileError());
        assertTrue(outcome.results().getFirst().passed(), outcome.results().getFirst().actualOutput());
    }
}
