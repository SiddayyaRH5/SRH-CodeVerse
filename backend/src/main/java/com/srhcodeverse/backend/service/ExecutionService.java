package com.srhcodeverse.backend.service;

import org.springframework.stereotype.Service;

import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class ExecutionService {

    private final DockerExecutionService dockerExecutionService;

    public ExecutionService(DockerExecutionService dockerExecutionService) {
        this.dockerExecutionService = dockerExecutionService;
    }

    private static final Pattern MAIN_METHOD_PATTERN = Pattern.compile(
            "public\\s+static\\s+void\\s+main\\s*\\(");
    private static final Pattern CLASS_PATTERN = Pattern.compile("\\bclass\\s+(\\w+)");
    private static final Pattern METHOD_PATTERN = Pattern.compile(
            "public\\s+(?:static\\s+)?([\\w\\[\\]]+)\\s+(\\w+)\\s*\\(([^)]*)\\)");

    public record TestResult(boolean passed, String actualOutput, String errorMessage) {
    }

    public record ExecutionOutcome(boolean compiled, String compileError, List<TestResult> results, long runtimeMs) {
    }

    // Backward compatibility: existing callers continue using Java.
    public ExecutionOutcome runAgainstTestCases(
            String code,
            List<String> inputs,
            List<String> expectedOutputs) {

        return runAgainstTestCases(code, inputs, expectedOutputs, "java");
    }

    // Multi-language execution entry point.
    public ExecutionOutcome runAgainstTestCases(
            String code,
            List<String> inputs,
            List<String> expectedOutputs,
            String language) {

        String selectedLanguage = language == null || language.isBlank()
                ? "java"
                : language.trim().toLowerCase(Locale.ROOT);

        if (!Set.of("java", "python", "javascript").contains(selectedLanguage)) {
            return new ExecutionOutcome(
                    false,
                    "Unsupported language: " + selectedLanguage,
                    List.of(),
                    0);
        }

        if (code == null || code.isBlank()) {
            return new ExecutionOutcome(
                    false, "Source code cannot be empty.", List.of(), 0);
        }

        String sourceToRun = code;

        if ("java".equals(selectedLanguage)) {
            try {
                sourceToRun = wrapIfNeeded(code);
            } catch (IllegalArgumentException e) {
                return new ExecutionOutcome(false, e.getMessage(), List.of(), 0);
            }
        }

        if (inputs == null || expectedOutputs == null
                || inputs.size() != expectedOutputs.size()) {
            return new ExecutionOutcome(
                    false,
                    "Invalid test cases: inputs and expected outputs must match.",
                    List.of(),
                    0);
        }

        if (inputs.isEmpty()) {
            return new ExecutionOutcome(
                    false, "No test cases provided.", List.of(), 0);
        }

        long start = System.currentTimeMillis();

        DockerExecutionService.BatchDockerResult batch = dockerExecutionService.executeBatch(sourceToRun, inputs,
                selectedLanguage);

        if (!batch.compiled()) {
            return new ExecutionOutcome(
                    false,
                    batch.compileError(),
                    List.of(),
                    System.currentTimeMillis() - start);
        }

        List<TestResult> results = new ArrayList<>();

        for (int i = 0; i < inputs.size(); i++) {

            if (i >= batch.results().size()) {
                results.add(new TestResult(
                        false, "", "Execution result missing."));
                continue;
            }

            DockerExecutionService.DockerResult dockerResult = batch.results().get(i);

            if (dockerResult.timedOut()) {
                results.add(new TestResult(
                        false,
                        dockerResult.output(),
                        "Time Limit Exceeded"));
                continue;
            }

            if (!dockerResult.success()) {
                String error = dockerResult.error() == null
                        ? "Execution failed."
                        : dockerResult.error();

                results.add(new TestResult(
                        false,
                        dockerResult.output(),
                        "Runtime Error: " + error));

                continue;
            }

            String actualOutput = dockerResult.output() == null
                    ? ""
                    : dockerResult.output().trim();

            String expectedOutput = expectedOutputs.get(i) == null
                    ? ""
                    : expectedOutputs.get(i).trim();

            results.add(new TestResult(
                    normalizeOutput(actualOutput).equals(normalizeOutput(expectedOutput)),
                    actualOutput,
                    null));
        }

        return new ExecutionOutcome(
                true,
                null,
                results,
                System.currentTimeMillis() - start);
    }

    /**
     * Examples commonly use JSON-like array formatting. Whitespace outside quoted
     * values is presentation only, but whitespace inside a String result is data.
     */
    static String normalizeOutput(String output) {
        if (output == null) {
            return "";
        }

        StringBuilder normalized = new StringBuilder();
        boolean quoted = false;
        boolean escaped = false;
        for (char c : output.trim().toCharArray()) {
            if (quoted && escaped) {
                normalized.append(c);
                escaped = false;
            } else if (quoted && c == '\\') {
                normalized.append(c);
                escaped = true;
            } else if (c == '"') {
                normalized.append(c);
                quoted = !quoted;
            } else if (quoted || !Character.isWhitespace(c)) {
                normalized.append(c);
            }
        }
        return normalized.toString();
    }

    // ===================== MODE DETECTION =====================

    private String wrapIfNeeded(String studentCode) {
        if (MAIN_METHOD_PATTERN.matcher(studentCode).find()) {
            return studentCode; // raw mode: unchanged
        }

        Matcher classMatcher = CLASS_PATTERN.matcher(studentCode);
        if (classMatcher.find()) {
            String primaryClassName = classMatcher.group(1);
            List<String> allClassNames = new ArrayList<>();
            Matcher allClasses = CLASS_PATTERN.matcher(studentCode);
            while (allClasses.find()) {
                allClassNames.add(allClasses.group(1));
            }
            return buildClassModeWrapper(studentCode, primaryClassName, allClassNames);
        }

        Matcher methodMatcher = METHOD_PATTERN.matcher(studentCode);
        if (!methodMatcher.find()) {
            throw new IllegalArgumentException(
                    "Could not detect a method signature. Expected something like:\n" +
                            "public <returnType> <methodName>(<parameters>) { ... }");
        }

        String returnType = methodMatcher.group(1).trim();
        String methodName = methodMatcher.group(2).trim();
        String rawParams = methodMatcher.group(3).trim();

        List<String[]> params = new ArrayList<>();
        if (!rawParams.isEmpty()) {
            for (String rawParam : rawParams.split(",")) {
                String p = rawParam.trim();
                String[] tokens = p.split("\\s+");
                String name = tokens[tokens.length - 1];
                String type = p.substring(0, p.length() - name.length()).trim();
                params.add(new String[] { type, name });
            }
        }

        return buildMethodModeWrapper(studentCode, returnType, methodName, params);
    }

    // ===================== METHOD-MODE WRAPPER (single bare method)
    // =====================

    private String buildMethodModeWrapper(String studentCode, String returnType, String methodName,
            List<String[]> params) {
        StringBuilder src = new StringBuilder();

        src.append("import java.io.*;\n");
        src.append("import java.util.*;\n");
        src.append("import java.lang.reflect.*;\n\n");
        src.append("public class Main {\n\n");
        // These are only used when a bare LeetCode-style method references the
        // conventional types. Class-mode keeps the student's own definitions.
        src.append("    static class ListNode { int val; ListNode next; ListNode() {} ListNode(int val) { this.val = val; } ListNode(int val, ListNode next) { this.val = val; this.next = next; } }\n");
        src.append("    static class TreeNode { int val; TreeNode left; TreeNode right; TreeNode() {} TreeNode(int val) { this.val = val; } TreeNode(int val, TreeNode left, TreeNode right) { this.val = val; this.left = left; this.right = right; } }\n\n");
        src.append(studentCode);
        src.append("\n\n");

        src.append("    public static void main(String[] args) throws Exception {\n");
        src.append("        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));\n");
        src.append("        String __input = br.lines().collect(java.util.stream.Collectors.joining(\"\\n\"));\n");
        src.append("        List<String> __arguments = readArguments(__input, \"").append(methodName)
                .append("\", ").append(params.size()).append(");\n");
        src.append("        Main solution = new Main();\n\n");

        List<String> argNames = new ArrayList<>();
        for (int i = 0; i < params.size(); i++) {
            String type = params.get(i)[0];
            String name = params.get(i)[1];
            argNames.add(name);

            src.append("        String __line").append(i).append(" = __arguments.get(").append(i).append(");\n");
            src.append(buildParseLine(type, name, "__line" + i));
        }
        src.append("\n");

        String argsJoined = String.join(", ", argNames);

        if (returnType.equals("void")) {
            src.append("        solution.").append(methodName).append("(").append(argsJoined).append(");\n");

            String printedParamType = null;
            String printedParamName = null;
            for (String[] p : params) {
                if (p[0].endsWith("[]")) {
                    printedParamType = p[0];
                    printedParamName = p[1];
                    break;
                }
            }

            if (printedParamName != null) {
                src.append(buildPrintLine(printedParamType, printedParamName));
            } else {
                src.append("        System.out.println(\"\");\n");
            }
        } else {
            src.append("        ").append(returnType).append(" result = solution.")
                    .append(methodName).append("(").append(argsJoined).append(");\n");
            src.append(buildPrintLine(returnType, "result"));
        }

        src.append("    }\n\n");
        src.append(buildMethodModeHelpers());
        src.append(buildSharedHelpers());
        src.append("}\n");

        return src.toString();
    }

    private String buildParseLine(String type, String varName, String lineVar) {
        switch (type) {
            case "int[]":
                return "        int[] " + varName + " = parseIntArray(" + lineVar + ");\n";
            case "char[]":
                return "        char[] " + varName + " = parseCharArray(" + lineVar + ");\n";
            case "String[]":
                return "        String[] " + varName + " = parseStringArray(" + lineVar + ");\n";
            case "boolean[]":
                return "        boolean[] " + varName + " = parseBooleanArray(" + lineVar + ");\n";
            case "long[]":
                return "        long[] " + varName + " = parseLongArray(" + lineVar + ");\n";
            case "double[]":
                return "        double[] " + varName + " = parseDoubleArray(" + lineVar + ");\n";
            case "int[][]":
                return "        int[][] " + varName + " = parseIntMatrix(" + lineVar + ");\n";
            case "String[][]":
                return "        String[][] " + varName + " = parseStringMatrix(" + lineVar + ");\n";
            case "ListNode":
                return "        ListNode " + varName + " = parseListNode(" + lineVar + ");\n";
            case "TreeNode":
                return "        TreeNode " + varName + " = parseTreeNode(" + lineVar + ");\n";
            case "int":
                return "        int " + varName + " = Integer.parseInt(" + lineVar + ".trim());\n";
            case "long":
                return "        long " + varName + " = Long.parseLong(" + lineVar + ".trim());\n";
            case "double":
                return "        double " + varName + " = Double.parseDouble(" + lineVar + ".trim());\n";
            case "boolean":
                return "        boolean " + varName + " = Boolean.parseBoolean(" + lineVar + ".trim());\n";
            case "char":
                return "        char " + varName + " = parseCharScalar(" + lineVar + ");\n";
            case "String":
                return "        String " + varName + " = parseStringScalar(" + lineVar + ");\n";
            default:
                throw new IllegalArgumentException("Unsupported parameter type: " + type);
        }
    }

    private String buildPrintLine(String type, String varName) {
        switch (type) {
            case "int[]":
                return "        System.out.println(formatIntArray(" + varName + "));\n";
            case "char[]":
                return "        System.out.println(formatCharArray(" + varName + "));\n";
            case "String[]":
                return "        System.out.println(formatStringArray(" + varName + "));\n";
            case "boolean[]":
                return "        System.out.println(formatBooleanArray(" + varName + "));\n";
            case "long[]":
                return "        System.out.println(formatLongArray(" + varName + "));\n";
            case "double[]":
                return "        System.out.println(formatDoubleArray(" + varName + "));\n";
            case "int[][]":
            case "String[][]":
            case "ListNode":
            case "TreeNode":
                return "        System.out.println(formatValue(" + varName + "));\n";
            case "int":
            case "long":
            case "double":
            case "boolean":
                return "        System.out.println(String.valueOf(" + varName + "));\n";
            case "char":
            case "String":
                return "        System.out.println(\"\\\"\" + " + varName + " + \"\\\"\");\n";
            default:
                throw new IllegalArgumentException("Unsupported return type: " + type);
        }
    }

    private String buildMethodModeHelpers() {
        return """
                    private static List<String> readArguments(String raw, String methodName, int expectedCount) {
                        raw = raw == null ? "" : raw.trim();
                        if (raw.startsWith(methodName + "(") && raw.endsWith(")")) {
                            return splitDelimited(raw.substring(methodName.length() + 1, raw.length() - 1));
                        }
                        String[] lines = raw.split("\\\\R", -1);
                        if (lines.length == expectedCount) return Arrays.asList(lines);
                        List<String> commaSeparated = splitDelimited(raw);
                        if (commaSeparated.size() == expectedCount) return commaSeparated;
                        if (expectedCount == 1) return List.of(raw);
                        throw new IllegalArgumentException("Expected " + expectedCount + " arguments for " + methodName);
                    }

                    private static List<String> splitDelimited(String text) {
                        List<String> values = new ArrayList<>();
                        if (text.trim().isEmpty()) return values;
                        int depth = 0;
                        boolean quoted = false;
                        boolean escaped = false;
                        StringBuilder current = new StringBuilder();
                        for (char c : text.toCharArray()) {
                            if (quoted && escaped) { escaped = false; current.append(c); continue; }
                            if (quoted && c == '\\\\') { escaped = true; current.append(c); continue; }
                            if (c == '"') quoted = !quoted;
                            if (!quoted && (c == '[' || c == '(')) depth++;
                            if (!quoted && (c == ']' || c == ')')) depth--;
                            if (c == ',' && depth == 0 && !quoted) { values.add(current.toString().trim()); current.setLength(0); }
                            else current.append(c);
                        }
                        values.add(current.toString().trim());
                        return values;
                    }

                    private static int[][] parseIntMatrix(String raw) {
                        if (raw.trim().equals("null")) return null;
                        List<String> rows = splitDelimited(stripBrackets(raw));
                        int[][] matrix = new int[rows.size()][];
                        for (int i = 0; i < rows.size(); i++) matrix[i] = parseIntArray(rows.get(i));
                        return matrix;
                    }

                    private static String[][] parseStringMatrix(String raw) {
                        if (raw.trim().equals("null")) return null;
                        List<String> rows = splitDelimited(stripBrackets(raw));
                        String[][] matrix = new String[rows.size()][];
                        for (int i = 0; i < rows.size(); i++) matrix[i] = parseStringArray(rows.get(i));
                        return matrix;
                    }

                    private static ListNode parseListNode(String raw) {
                        if (raw.trim().equals("null")) return null;
                        ListNode dummy = new ListNode(0), tail = dummy;
                        for (int value : parseIntArray(raw)) { tail.next = new ListNode(value); tail = tail.next; }
                        return dummy.next;
                    }

                    private static TreeNode parseTreeNode(String raw) {
                        if (raw.trim().equals("null") || stripBrackets(raw).isEmpty()) return null;
                        List<String> values = splitDelimited(stripBrackets(raw));
                        if (values.isEmpty() || values.get(0).trim().equals("null")) return null;
                        TreeNode root = new TreeNode(Integer.parseInt(values.get(0).trim()));
                        Queue<TreeNode> queue = new ArrayDeque<>(); queue.add(root); int index = 1;
                        while (!queue.isEmpty() && index < values.size()) {
                            TreeNode parent = queue.remove();
                            String left = values.get(index++).trim();
                            if (!left.equals("null")) { parent.left = new TreeNode(Integer.parseInt(left)); queue.add(parent.left); }
                            if (index < values.size()) { String right = values.get(index++).trim(); if (!right.equals("null")) { parent.right = new TreeNode(Integer.parseInt(right)); queue.add(parent.right); } }
                        }
                        return root;
                    }

                    private static String formatValue(Object value) {
                        if (value == null) return "null";
                        if (value instanceof ListNode) { List<String> values = new ArrayList<>(); for (ListNode n = (ListNode) value; n != null; n = n.next) values.add(String.valueOf(n.val)); return "[" + String.join(",", values) + "]"; }
                        if (value instanceof TreeNode) { List<String> values = new ArrayList<>(); Queue<TreeNode> queue = new LinkedList<>(); queue.add((TreeNode) value); while (!queue.isEmpty()) { TreeNode n = queue.remove(); if (n == null) values.add("null"); else { values.add(String.valueOf(n.val)); queue.add(n.left); queue.add(n.right); } } while (!values.isEmpty() && values.get(values.size() - 1).equals("null")) values.remove(values.size() - 1); return "[" + String.join(",", values) + "]"; }
                        if (value.getClass().isArray()) { int length = java.lang.reflect.Array.getLength(value); List<String> values = new ArrayList<>(); for (int i = 0; i < length; i++) values.add(formatValue(java.lang.reflect.Array.get(value, i))); return "[" + String.join(",", values) + "]"; }
                        if (value instanceof String || value instanceof Character) return "\\\"" + value + "\\\"";
                        return String.valueOf(value);
                    }
                """;
    }

    // ===================== CLASS-MODE WRAPPER (stateful, multi-call,
    // reflection-based) =====================

    private String buildClassModeWrapper(String studentCode, String className, List<String> allClassNames) {
        // Ensure only Main is the public top-level class in this file
        String cleanedStudentCode = studentCode.replaceFirst(
                "public\\s+class\\s+" + Pattern.quote(className),
                "class " + className);

        StringBuilder src = new StringBuilder();

        src.append("import java.io.*;\n");
        src.append("import java.util.*;\n");
        src.append("import java.lang.reflect.*;\n\n");

        src.append(cleanedStudentCode);
        src.append("\n\n");

        src.append("public class Main {\n\n");
        src.append("    public static void main(String[] args) throws Exception {\n");
        src.append("        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));\n");
        src.append("        String line = br.readLine();\n");
        src.append("        if (line == null) line = \"\";\n");
        src.append("        List<String> tokens = splitTopLevel(line);\n\n");

        src.append("        String[] knownClasses = {");
        for (int k = 0; k < allClassNames.size(); k++) {
            if (k > 0)
                src.append(", ");
            src.append("\"").append(allClassNames.get(k)).append("\"");
        }
        src.append("};\n\n");

        // A conventional LeetCode submission often declares Solution plus helper
        // node classes. Treat one function call as method mode, while retaining the
        // original comma-separated class-mode protocol for design problems.
        src.append("        if (isSingleFunctionCall(line)) {\n");
        src.append("            int open = line.indexOf('(');\n");
        src.append("            String methodName = line.substring(0, open).trim();\n");
        src.append("            String inner = line.substring(open + 1, line.lastIndexOf(')')).trim();\n");
        src.append("            List<String> functionArgs = inner.isEmpty() ? new ArrayList<>() : splitTopLevel(inner);\n");
        src.append("            System.out.println(formatValue(invokeFunction(knownClasses, methodName, functionArgs)));\n");
        src.append("            return;\n");
        src.append("        }\n\n");

        src.append("        int i = 0;\n");
        src.append("        String selectedClassName = \"").append(className).append("\";\n");
        src.append("        List<String> ctorArgs = new ArrayList<>();\n\n");

        src.append("        if (!tokens.isEmpty()) {\n");
        src.append("            String firstToken = tokens.get(0).trim();\n");
        src.append("            for (String kc : knownClasses) {\n");
        src.append("                if (kc.equals(firstToken)) {\n");
        src.append("                    selectedClassName = firstToken;\n");
        src.append("                    i = 1;\n");
        src.append("                    break;\n");
        src.append("                }\n");
        src.append("            }\n");
        src.append("        }\n\n");

        src.append("        if (i == 0) {\n");
        src.append("            while (i < tokens.size() && !looksLikeCall(tokens.get(i))) {\n");
        src.append("                ctorArgs.add(tokens.get(i).trim());\n");
        src.append("                i++;\n");
        src.append("            }\n");
        src.append("        }\n\n");

        src.append("        Class<?> clazz = Class.forName(selectedClassName);\n");
        src.append("        Object instance = construct(clazz, ctorArgs);\n\n");

        src.append("        Object lastResult = null;\n");
        src.append("        boolean hadCall = false;\n");
        src.append("        for (; i < tokens.size(); i++) {\n");
        src.append("            String token = tokens.get(i).trim();\n");
        src.append("            int paren = token.indexOf('(');\n");
        src.append("            String methodName = token.substring(0, paren).trim();\n");
        src.append("            String innerArgs = token.substring(paren + 1, token.lastIndexOf(')')).trim();\n");
        src.append(
                "            List<String> argTokens = innerArgs.isEmpty() ? new ArrayList<>() : splitTopLevel(innerArgs);\n");
        src.append("            lastResult = invokeMethod(instance, methodName, argTokens);\n");
        src.append("            hadCall = true;\n");
        src.append("        }\n\n");

        src.append("        if (!hadCall) {\n");
        src.append("            throw new RuntimeException(\"Test case had no method calls after construction\");\n");
        src.append("        }\n");
        src.append("        if (lastResult == null) {\n");
        src.append("            throw new RuntimeException(\"Last call in the sequence returned void. \" +\n");
        src.append("                \"The final call must return a value (e.g. end with a getter).\");\n");
        src.append("        }\n");
        src.append("        System.out.println(formatValue(lastResult));\n");
        src.append("    }\n\n");

        src.append(buildClassModeHelpers());
        src.append(buildSharedHelpers());
        src.append("}\n");

        return src.toString();
    }

    private String buildClassModeHelpers() {
        StringBuilder sb = new StringBuilder();

        sb.append("    private static List<String> splitTopLevel(String s) {\n")
                .append("        List<String> result = new ArrayList<>();\n")
                .append("        int depth = 0; boolean quoted = false; boolean escaped = false;\n")
                .append("        StringBuilder current = new StringBuilder();\n")
                .append("        for (char c : s.toCharArray()) {\n")
                .append("            if (quoted && escaped) { escaped = false; current.append(c); continue; }\n")
                .append("            if (quoted && c == '\\\\') { escaped = true; current.append(c); continue; }\n")
                .append("            if (c == '\"') quoted = !quoted;\n")
                .append("            if (!quoted && (c == '(' || c == '[' || c == '{')) depth++;\n")
                .append("            if (!quoted && (c == ')' || c == ']' || c == '}')) depth--;\n")
                .append("            if (c == ',' && depth == 0 && !quoted) {\n")
                .append("                result.add(current.toString().trim());\n")
                .append("                current = new StringBuilder();\n")
                .append("            } else {\n")
                .append("                current.append(c);\n")
                .append("            }\n")
                .append("        }\n")
                .append("        if (current.length() > 0 || !result.isEmpty()) {\n")
                .append("            String last = current.toString().trim();\n")
                .append("            if (!last.isEmpty()) result.add(last);\n")
                .append("        }\n")
                .append("        return result;\n")
                .append("    }\n\n");

        sb.append("    private static boolean looksLikeCall(String token) {\n")
                .append("        return token.trim().matches(\"\\\\w+\\\\(.*\\\\)\");\n")
                .append("    }\n\n");

        sb.append("    private static boolean isSingleFunctionCall(String line) {\n")
                .append("        List<String> calls = splitTopLevel(line);\n")
                .append("        return calls.size() == 1 && looksLikeCall(calls.get(0));\n")
                .append("    }\n\n");

        sb.append("    private static Object invokeFunction(String[] classNames, String methodName, List<String> rawArgs) throws Exception {\n")
                .append("        Exception lastFailure = null;\n")
                .append("        for (String className : classNames) {\n")
                .append("            try {\n")
                .append("                Class<?> clazz = Class.forName(className);\n")
                .append("                boolean hasMethod = false;\n")
                .append("                for (Method method : clazz.getDeclaredMethods()) if (method.getName().equals(methodName) && method.getParameterCount() == rawArgs.size()) { hasMethod = true; break; }\n")
                .append("                if (hasMethod) return invokeMethod(construct(clazz, new ArrayList<>()), methodName, rawArgs);\n")
                .append("            } catch (Exception e) { lastFailure = e; }\n")
                .append("        }\n")
                .append("        throw new RuntimeException(\"No class exposes matching function: \" + methodName, lastFailure);\n")
                .append("    }\n\n");

        sb.append("    private static Object construct(Class<?> clazz, List<String> rawArgs) throws Exception {\n")
                .append("        for (Constructor<?> ctor : clazz.getDeclaredConstructors()) {\n")
                .append("            if (ctor.getParameterCount() != rawArgs.size()) continue;\n")
                .append("            try {\n")
                .append("                Class<?>[] paramTypes = ctor.getParameterTypes();\n")
                .append("                Object[] parsed = new Object[rawArgs.size()];\n")
                .append("                for (int j = 0; j < rawArgs.size(); j++) {\n")
                .append("                    parsed[j] = parseValue(rawArgs.get(j), paramTypes[j]);\n")
                .append("                }\n")
                .append("                ctor.setAccessible(true);\n")
                .append("                return ctor.newInstance(parsed);\n")
                .append("            } catch (Exception e) { /* try next candidate */ }\n")
                .append("        }\n")
                .append("        throw new RuntimeException(\"No matching constructor found for \" + rawArgs.size() + \" argument(s)\");\n")
                .append("    }\n\n");

        sb.append(
                "    private static Object invokeMethod(Object instance, String methodName, List<String> rawArgs) throws Exception {\n")
                .append("        List<Method> candidates = new ArrayList<>();\n")
                .append("        for (Method m : instance.getClass().getDeclaredMethods()) {\n")
                .append("            if (m.getName().equals(methodName) && m.getParameterCount() == rawArgs.size()) {\n")
                .append("                candidates.add(m);\n")
                .append("            }\n")
                .append("        }\n")
                .append("        candidates.sort((a, b) -> Integer.compare(specificity(a), specificity(b)));\n")
                .append("        for (Method m : candidates) {\n")
                .append("            try {\n")
                .append("                Class<?>[] paramTypes = m.getParameterTypes();\n")
                .append("                Object[] parsed = new Object[rawArgs.size()];\n")
                .append("                for (int j = 0; j < rawArgs.size(); j++) {\n")
                .append("                    parsed[j] = parseValue(rawArgs.get(j), paramTypes[j]);\n")
                .append("                }\n")
                .append("                m.setAccessible(true);\n")
                .append("                return m.invoke(instance, parsed);\n")
                .append("            } catch (Exception e) { /* try next candidate */ }\n")
                .append("        }\n")
                .append("        throw new RuntimeException(\"No matching method found: \" + methodName + \"(\" + rawArgs.size() + \" args)\");\n")
                .append("    }\n\n");

        sb.append("    private static int specificity(Method m) {\n")
                .append("        int score = 0;\n")
                .append("        for (Class<?> t : m.getParameterTypes()) {\n")
                .append("            if (t == int.class || t == long.class || t == Integer.class || t == Long.class) score += 0;\n")
                .append("            else if (t == double.class || t == Double.class) score += 1;\n")
                .append("            else score += 0;\n")
                .append("        }\n")
                .append("        return score;\n")
                .append("    }\n\n");

        sb.append("    private static Object parseValue(String raw, Class<?> type) {\n")
                .append("        raw = raw.trim();\n")
                .append("        if (raw.equals(\"null\") && !type.isPrimitive()) return null;\n")
                .append("        if (type.isArray()) {\n")
                .append("            Class<?> comp = type.getComponentType();\n")
                .append("            String inner = stripBrackets(raw);\n")
                .append("            List<String> parts = inner.isEmpty() ? new ArrayList<>() : splitTopLevel(inner);\n")
                .append("            Object array = Array.newInstance(comp, parts.size());\n")
                .append("            for (int k = 0; k < parts.size(); k++) Array.set(array, k, parseValue(parts.get(k), comp));\n")
                .append("            return array;\n")
                .append("        }\n")
                .append("        if (type == int.class || type == Integer.class) return Integer.parseInt(raw);\n")
                .append("        if (type == long.class || type == Long.class) return Long.parseLong(raw);\n")
                .append("        if (type == double.class || type == Double.class) return Double.parseDouble(raw);\n")
                .append("        if (type == boolean.class || type == Boolean.class) return Boolean.parseBoolean(raw);\n")
                .append("        if (type == char.class || type == Character.class) return parseCharScalar(raw);\n")
                .append("        if (type == String.class) return parseStringScalar(raw);\n")
                .append("        if (type.getSimpleName().equals(\"ListNode\")) return parseListNode(raw, type);\n")
                .append("        if (type.getSimpleName().equals(\"TreeNode\")) return parseTreeNode(raw, type);\n")
                .append("        throw new RuntimeException(\"Unsupported parameter type: \" + type.getName());\n")
                .append("    }\n\n");

        sb.append("    private static String formatValue(Object val) {\n")
                .append("        if (val == null) return \"null\";\n")
                .append("        if (val.getClass().isArray()) { List<String> values = new ArrayList<>(); int n = Array.getLength(val); for (int i = 0; i < n; i++) values.add(formatValue(Array.get(val, i))); return \"[\" + String.join(\",\", values) + \"]\"; }\n")
                .append("        if (val.getClass().getSimpleName().equals(\"ListNode\")) return formatListNode(val);\n")
                .append("        if (val.getClass().getSimpleName().equals(\"TreeNode\")) return formatTreeNode(val);\n")
                .append("        if (val instanceof Character) return \"\\\"\" + val + \"\\\"\";\n")
                .append("        if (val instanceof String) return \"\\\"\" + val + \"\\\"\";\n")
                .append("        return String.valueOf(val);\n")
                .append("    }\n\n");

        sb.append("    private static Object parseListNode(String raw, Class<?> type) {\n")
                .append("        if (raw.equals(\"null\")) return null;\n")
                .append("        Object head = null, tail = null;\n")
                .append("        for (String part : splitTopLevel(stripBrackets(raw))) { Object node = newNode(type, Integer.parseInt(part.trim())); if (head == null) head = node; else setField(tail, \"next\", node); tail = node; }\n")
                .append("        return head;\n")
                .append("    }\n\n")
                .append("    private static Object parseTreeNode(String raw, Class<?> type) {\n")
                .append("        if (raw.equals(\"null\") || stripBrackets(raw).isEmpty()) return null;\n")
                .append("        List<String> values = splitTopLevel(stripBrackets(raw)); if (values.isEmpty() || values.get(0).trim().equals(\"null\")) return null;\n")
                .append("        Object root = newNode(type, Integer.parseInt(values.get(0).trim())); Queue<Object> queue = new ArrayDeque<>(); queue.add(root); int index = 1;\n")
                .append("        while (!queue.isEmpty() && index < values.size()) { Object parent = queue.remove(); String left = values.get(index++).trim(); if (!left.equals(\"null\")) { Object child = newNode(type, Integer.parseInt(left)); setField(parent, \"left\", child); queue.add(child); } if (index < values.size()) { String right = values.get(index++).trim(); if (!right.equals(\"null\")) { Object child = newNode(type, Integer.parseInt(right)); setField(parent, \"right\", child); queue.add(child); } } }\n")
                .append("        return root;\n")
                .append("    }\n\n")
                .append("    private static Object newNode(Class<?> type, int value) {\n")
                .append("        try { Constructor<?> ctor = type.getDeclaredConstructor(int.class); ctor.setAccessible(true); return ctor.newInstance(value); } catch (Exception ignored) {}\n")
                .append("        try { Constructor<?> ctor = type.getDeclaredConstructor(); ctor.setAccessible(true); Object node = ctor.newInstance(); setField(node, \"val\", value); return node; } catch (Exception e) { throw new RuntimeException(\"Cannot construct \" + type.getName(), e); }\n")
                .append("    }\n\n")
                .append("    private static void setField(Object target, String name, Object value) { try { Field field = target.getClass().getDeclaredField(name); field.setAccessible(true); field.set(target, value); } catch (Exception e) { throw new RuntimeException(\"Missing node field: \" + name, e); } }\n")
                .append("    private static Object getField(Object target, String name) { try { Field field = target.getClass().getDeclaredField(name); field.setAccessible(true); return field.get(target); } catch (Exception e) { throw new RuntimeException(\"Missing node field: \" + name, e); } }\n\n")
                .append("    private static String formatListNode(Object node) { List<String> values = new ArrayList<>(); while (node != null) { values.add(String.valueOf(getField(node, \"val\"))); node = getField(node, \"next\"); } return \"[\" + String.join(\",\", values) + \"]\"; }\n")
                .append("    private static String formatTreeNode(Object root) { List<String> values = new ArrayList<>(); Queue<Object> queue = new LinkedList<>(); queue.add(root); while (!queue.isEmpty()) { Object node = queue.remove(); if (node == null) values.add(\"null\"); else { values.add(String.valueOf(getField(node, \"val\"))); queue.add(getField(node, \"left\")); queue.add(getField(node, \"right\")); } } while (!values.isEmpty() && values.get(values.size() - 1).equals(\"null\")) values.remove(values.size() - 1); return \"[\" + String.join(\",\", values) + \"]\"; }\n\n");

        return sb.toString();
    }

    // ===================== SHARED HELPERS (used by both wrapper types)
    // =====================

    private String buildSharedHelpers() {
        StringBuilder sb = new StringBuilder();

        sb.append("    private static String stripBrackets(String line) {\n")
                .append("        line = line.trim();\n")
                .append("        if (line.startsWith(\"[\") && line.endsWith(\"]\")) {\n")
                .append("            line = line.substring(1, line.length() - 1);\n")
                .append("        }\n")
                .append("        return line.trim();\n")
                .append("    }\n\n");

        sb.append("    private static List<String> splitValues(String text) {\n")
                .append("        List<String> values = new ArrayList<>(); if (text.trim().isEmpty()) return values;\n")
                .append("        int depth = 0; boolean quoted = false; boolean escaped = false; StringBuilder current = new StringBuilder();\n")
                .append("        for (char c : text.toCharArray()) {\n")
                .append("            if (quoted && escaped) { escaped = false; current.append(c); continue; }\n")
                .append("            if (quoted && c == '\\\\') { escaped = true; current.append(c); continue; }\n")
                .append("            if (c == '\"') quoted = !quoted;\n")
                .append("            if (!quoted && (c == '[' || c == '(' || c == '{')) depth++;\n")
                .append("            if (!quoted && (c == ']' || c == ')' || c == '}')) depth--;\n")
                .append("            if (c == ',' && depth == 0 && !quoted) { values.add(current.toString().trim()); current.setLength(0); } else current.append(c);\n")
                .append("        }\n")
                .append("        values.add(current.toString().trim()); return values;\n")
                .append("    }\n\n");

        sb.append("    private static int[] parseIntArray(String line) {\n")
                .append("        String inner = stripBrackets(line);\n")
                .append("        if (inner.isEmpty()) return new int[0];\n")
                .append("        List<String> parts = splitValues(inner);\n")
                .append("        int[] result = new int[parts.size()];\n")
                .append("        for (int i = 0; i < parts.size(); i++) result[i] = Integer.parseInt(parts.get(i).trim());\n")
                .append("        return result;\n")
                .append("    }\n\n");

        sb.append("    private static long[] parseLongArray(String line) {\n")
                .append("        String inner = stripBrackets(line);\n")
                .append("        if (inner.isEmpty()) return new long[0];\n")
                .append("        List<String> parts = splitValues(inner);\n")
                .append("        long[] result = new long[parts.size()];\n")
                .append("        for (int i = 0; i < parts.size(); i++) result[i] = Long.parseLong(parts.get(i).trim());\n")
                .append("        return result;\n")
                .append("    }\n\n");

        sb.append("    private static double[] parseDoubleArray(String line) {\n")
                .append("        String inner = stripBrackets(line);\n")
                .append("        if (inner.isEmpty()) return new double[0];\n")
                .append("        List<String> parts = splitValues(inner);\n")
                .append("        double[] result = new double[parts.size()];\n")
                .append("        for (int i = 0; i < parts.size(); i++) result[i] = Double.parseDouble(parts.get(i).trim());\n")
                .append("        return result;\n")
                .append("    }\n\n");

        sb.append("    private static boolean[] parseBooleanArray(String line) {\n")
                .append("        String inner = stripBrackets(line);\n")
                .append("        if (inner.isEmpty()) return new boolean[0];\n")
                .append("        List<String> parts = splitValues(inner);\n")
                .append("        boolean[] result = new boolean[parts.size()];\n")
                .append("        for (int i = 0; i < parts.size(); i++) result[i] = Boolean.parseBoolean(parts.get(i).trim());\n")
                .append("        return result;\n")
                .append("    }\n\n");

        sb.append("    private static char[] parseCharArray(String line) {\n")
                .append("        String inner = stripBrackets(line);\n")
                .append("        if (inner.isEmpty()) return new char[0];\n")
                .append("        List<String> parts = splitValues(inner);\n")
                .append("        char[] result = new char[parts.size()];\n")
                .append("        for (int i = 0; i < parts.size(); i++) result[i] = parseCharScalar(parts.get(i));\n")
                .append("        return result;\n")
                .append("    }\n\n");

        sb.append("    private static String[] parseStringArray(String line) {\n")
                .append("        String inner = stripBrackets(line);\n")
                .append("        if (inner.isEmpty()) return new String[0];\n")
                .append("        List<String> parts = splitValues(inner);\n")
                .append("        String[] result = new String[parts.size()];\n")
                .append("        for (int i = 0; i < parts.size(); i++) result[i] = parseStringScalar(parts.get(i));\n")
                .append("        return result;\n")
                .append("    }\n\n");

        sb.append("    private static char parseCharScalar(String raw) {\n")
                .append("        String p = raw.trim();\n")
                .append("        if (p.startsWith(\"\\\"\") && p.endsWith(\"\\\"\") && p.length() >= 2) {\n")
                .append("            p = p.substring(1, p.length() - 1);\n")
                .append("        }\n")
                .append("        return p.isEmpty() ? ' ' : p.charAt(0);\n")
                .append("    }\n\n");

        sb.append("    private static String parseStringScalar(String raw) {\n")
                .append("        String p = raw.trim();\n")
                .append("        if (p.startsWith(\"\\\"\") && p.endsWith(\"\\\"\") && p.length() >= 2) {\n")
                .append("            p = p.substring(1, p.length() - 1);\n")
                .append("        }\n")
                .append("        return p;\n")
                .append("    }\n\n");

        sb.append("    private static String formatIntArray(int[] arr) {\n")
                .append("        StringBuilder sb = new StringBuilder(\"[\");\n")
                .append("        for (int i = 0; i < arr.length; i++) { if (i > 0) sb.append(\",\"); sb.append(arr[i]); }\n")
                .append("        sb.append(\"]\"); return sb.toString();\n")
                .append("    }\n\n");

        sb.append("    private static String formatLongArray(long[] arr) {\n")
                .append("        StringBuilder sb = new StringBuilder(\"[\");\n")
                .append("        for (int i = 0; i < arr.length; i++) { if (i > 0) sb.append(\",\"); sb.append(arr[i]); }\n")
                .append("        sb.append(\"]\"); return sb.toString();\n")
                .append("    }\n\n");

        sb.append("    private static String formatDoubleArray(double[] arr) {\n")
                .append("        StringBuilder sb = new StringBuilder(\"[\");\n")
                .append("        for (int i = 0; i < arr.length; i++) { if (i > 0) sb.append(\",\"); sb.append(arr[i]); }\n")
                .append("        sb.append(\"]\"); return sb.toString();\n")
                .append("    }\n\n");

        sb.append("    private static String formatBooleanArray(boolean[] arr) {\n")
                .append("        StringBuilder sb = new StringBuilder(\"[\");\n")
                .append("        for (int i = 0; i < arr.length; i++) { if (i > 0) sb.append(\",\"); sb.append(arr[i]); }\n")
                .append("        sb.append(\"]\"); return sb.toString();\n")
                .append("    }\n\n");

        sb.append("    private static String formatCharArray(char[] arr) {\n")
                .append("        StringBuilder sb = new StringBuilder(\"[\");\n")
                .append("        for (int i = 0; i < arr.length; i++) { if (i > 0) sb.append(\",\"); sb.append('\\\"').append(arr[i]).append('\\\"'); }\n")
                .append("        sb.append(\"]\"); return sb.toString();\n")
                .append("    }\n\n");

        sb.append("    private static String formatStringArray(String[] arr) {\n")
                .append("        StringBuilder sb = new StringBuilder(\"[\");\n")
                .append("        for (int i = 0; i < arr.length; i++) { if (i > 0) sb.append(\",\"); sb.append('\\\"').append(arr[i]).append('\\\"'); }\n")
                .append("        sb.append(\"]\"); return sb.toString();\n")
                .append("    }\n\n");

        return sb.toString();
    }

    public DockerExecutionService.DockerResult runCustomInput(String code, String input) {
        final String source;
        try {
            source = wrapIfNeeded(code);
        } catch (IllegalArgumentException e) {
            return new DockerExecutionService.DockerResult(false, "", e.getMessage(), 0, false);
        }
        return dockerExecutionService.execute(source, input);
    }
}
