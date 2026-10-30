package com.srhcodeverse.backend.service;

import org.springframework.stereotype.Service;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.TimeUnit;

@Service
public class DockerExecutionService {

    private static final String JAVA_IMAGE = "eclipse-temurin:21-jdk";
    private static final long TIMEOUT_SECONDS = 25;
    private static final long MEMORY_LIMIT_MB = 128;
    private static final int CPU_LIMIT = 1;
    private static final int MAX_OUTPUT_CHARS = 16_000;
    private static final int MAX_BATCH_OUTPUT_CHARS = 128_000;

    public record DockerResult(
            boolean success,
            String output,
            String error,
            long runtimeMs,
            boolean timedOut) {
    }

    public record BatchDockerResult(
            boolean compiled,
            String compileError,
            List<DockerResult> results,
            long runtimeMs) {
    }

    // ==========================================
    // Single execution - used by custom input
    // ==========================================

    public DockerResult execute(String sourceCode, String input) {

        if (sourceCode == null || sourceCode.isBlank()) {
            return failure("Java source code cannot be empty.");
        }

        Path hostSourceDir = null;
        Process dockerProcess = null;
        long start = System.nanoTime();

        try {
            hostSourceDir = Files.createTempDirectory("srh-codeverse-");

            Files.writeString(
                    hostSourceDir.resolve("Main.java"),
                    sourceCode,
                    StandardCharsets.UTF_8);

            ProcessBuilder builder = new ProcessBuilder(
                    "docker", "run", "--rm", "-i",
                    "--network", "none",
                    "--memory", MEMORY_LIMIT_MB + "m",
                    "--memory-swap", MEMORY_LIMIT_MB + "m",
                    "--cpus", String.valueOf(CPU_LIMIT),
                    "--pids-limit", "32",
                    "--read-only",
                    "--tmpfs", "/tmp:rw,noexec,nosuid,size=16m",
                    "--tmpfs", "/workspace:rw,exec,nosuid,size=32m,uid=10001,gid=10001,mode=700",
                    "--cap-drop", "ALL",
                    "--security-opt", "no-new-privileges",
                    "--user", "10001:10001",
                    "--mount",
                    "type=bind,source=" + hostSourceDir.toAbsolutePath() + ",target=/input,readonly",
                    "--workdir", "/workspace",
                    JAVA_IMAGE,
                    "sh", "-c",
                    "cp /input/Main.java /workspace/Main.java && " +
                            "javac -proc:none Main.java && " +
                            "java -Xms16m -Xmx64m Main");

            builder.redirectErrorStream(true);
            dockerProcess = builder.start();

            try (var stdin = dockerProcess.getOutputStream()) {
                if (input != null && !input.isEmpty()) {
                    stdin.write(input.getBytes(StandardCharsets.UTF_8));
                    stdin.flush();
                }
            }

            Process process = dockerProcess;
            StringBuilder captured = new StringBuilder();

            Thread reader = new Thread(() -> {
                try (var stream = process.getInputStream()) {
                    byte[] buffer = new byte[1024];
                    int count;

                    while ((count = stream.read(buffer)) != -1) {
                        synchronized (captured) {
                            int remaining = MAX_OUTPUT_CHARS - captured.length();

                            if (remaining > 0) {
                                captured.append(new String(
                                        buffer,
                                        0,
                                        Math.min(count, remaining),
                                        StandardCharsets.UTF_8));
                            }
                        }
                    }
                } catch (IOException ignored) {
                    // Process may be stopped after timeout.
                }
            }, "docker-output-reader");

            reader.setDaemon(true);
            reader.start();

            boolean finished = dockerProcess.waitFor(
                    TIMEOUT_SECONDS, TimeUnit.SECONDS);

            if (!finished) {
                dockerProcess.destroyForcibly();
                dockerProcess.waitFor(1, TimeUnit.SECONDS);
                reader.join(500);

                return new DockerResult(
                        false,
                        getCaptured(captured),
                        "Time Limit Exceeded",
                        elapsedMs(start),
                        true);
            }

            reader.join(1000);

            String output = getCaptured(captured).trim();

            if (output.length() >= MAX_OUTPUT_CHARS) {
                return new DockerResult(
                        false, output, "Output limit exceeded",
                        elapsedMs(start), false);
            }

            if (dockerProcess.exitValue() != 0) {
                String error = output.isBlank()
                        ? "Compilation or execution failed."
                        : output;

                return new DockerResult(
                        false, output, error, elapsedMs(start), false);
            }

            return new DockerResult(
                    true, output, null, elapsedMs(start), false);

        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();

            if (dockerProcess != null) {
                dockerProcess.destroyForcibly();
            }

            return failure("Execution was interrupted.");

        } catch (IOException e) {
            return failure(
                    "Could not start Docker. Ensure Docker Desktop is running. "
                            + e.getMessage());

        } finally {
            if (dockerProcess != null && dockerProcess.isAlive()) {
                dockerProcess.destroyForcibly();
            }

            if (hostSourceDir != null) {
                deleteDirectory(hostSourceDir);
            }
        }
    }

    // ==========================================
    // Batch execution - compile once, run many
    // ==========================================

    public BatchDockerResult executeBatch(
            String sourceCode,
            List<String> inputs) {

        long start = System.nanoTime();

        if (sourceCode == null || sourceCode.isBlank()) {
            return new BatchDockerResult(
                    false, "Java source code cannot be empty.",
                    List.of(), 0);
        }

        if (inputs == null || inputs.isEmpty()) {
            return new BatchDockerResult(
                    false, "No test cases provided.",
                    List.of(), 0);
        }

        Path hostDir = null;
        Process dockerProcess = null;

        String token = UUID.randomUUID().toString().replace("-", "");

        int outputLimit = (int) Math.min(
                MAX_BATCH_OUTPUT_CHARS,
                (long) MAX_OUTPUT_CHARS * inputs.size() + 4096L);

        try {
            hostDir = Files.createTempDirectory("srh-codeverse-batch-");

            Files.writeString(
                    hostDir.resolve("Main.java"),
                    sourceCode,
                    StandardCharsets.UTF_8);

            // Save each test input separately.
            for (int i = 0; i < inputs.size(); i++) {
                String input = inputs.get(i) == null ? "" : inputs.get(i);

                Files.writeString(
                        hostDir.resolve("input-" + i + ".txt"),
                        input,
                        StandardCharsets.UTF_8);
            }

            // Compile once, then execute each test in a separate JVM.
            StringBuilder script = new StringBuilder();

            script.append("cp /input/Main.java /workspace/Main.java && ");
            script.append("javac -proc:none Main.java; ");

            script.append("compile_status=$?; ");
            script.append("if [ \"$compile_status\" -ne 0 ]; then exit \"$compile_status\"; fi; ");

            for (int i = 0; i < inputs.size(); i++) {

                script.append("printf '\\n__SRH_")
                        .append(token)
                        .append("_")
                        .append(i)
                        .append("_BEGIN__\\n'; ");

                script.append("timeout ")
                        .append(TIMEOUT_SECONDS)
                        .append("s java -Xms16m -Xmx64m Main < /input/input-")
                        .append(i)
                        .append(".txt; ");

                script.append("test_status=$?; ");

                script.append("printf '\\n__SRH_")
                        .append(token)
                        .append("_")
                        .append(i)
                        .append("_EXIT_%s__\\n' \"$test_status\"; ");
            }

            ProcessBuilder builder = new ProcessBuilder(
                    "docker", "run", "--rm", "-i",
                    "--network", "none",
                    "--memory", MEMORY_LIMIT_MB + "m",
                    "--memory-swap", MEMORY_LIMIT_MB + "m",
                    "--cpus", String.valueOf(CPU_LIMIT),
                    "--pids-limit", "32",
                    "--read-only",
                    "--tmpfs", "/tmp:rw,noexec,nosuid,size=16m",
                    "--tmpfs", "/workspace:rw,exec,nosuid,size=32m,uid=10001,gid=10001,mode=700",
                    "--cap-drop", "ALL",
                    "--security-opt", "no-new-privileges",
                    "--user", "10001:10001",
                    "--mount",
                    "type=bind,source=" + hostDir.toAbsolutePath()
                            + ",target=/input,readonly",
                    "--workdir", "/workspace",
                    JAVA_IMAGE,
                    "sh", "-c",
                    script.toString());

            builder.redirectErrorStream(true);

            dockerProcess = builder.start();
            dockerProcess.getOutputStream().close();

            Process process = dockerProcess;
            StringBuilder captured = new StringBuilder();

            Thread reader = new Thread(() -> {
                try (var stream = process.getInputStream()) {
                    byte[] buffer = new byte[2048];
                    int count;

                    while ((count = stream.read(buffer)) != -1) {
                        synchronized (captured) {
                            int remaining = outputLimit - captured.length();

                            if (remaining > 0) {
                                captured.append(new String(
                                        buffer,
                                        0,
                                        Math.min(count, remaining),
                                        StandardCharsets.UTF_8));
                            }
                        }
                    }
                } catch (IOException ignored) {
                    // Process may be stopped after timeout.
                }
            }, "docker-batch-output-reader");

            reader.setDaemon(true);
            reader.start();

            long totalTimeout = TIMEOUT_SECONDS * inputs.size() + 15L;

            boolean finished = dockerProcess.waitFor(
                    totalTimeout, TimeUnit.SECONDS);

            if (!finished) {
                dockerProcess.destroyForcibly();
                dockerProcess.waitFor(1, TimeUnit.SECONDS);
                reader.join(500);

                List<DockerResult> timeoutResults = new ArrayList<>();

                for (int i = 0; i < inputs.size(); i++) {
                    timeoutResults.add(new DockerResult(
                            false,
                            "",
                            "Time Limit Exceeded",
                            elapsedMs(start),
                            true));
                }

                return new BatchDockerResult(
                        true, null, timeoutResults, elapsedMs(start));
            }

            reader.join(1000);

            String output = getCaptured(captured);

            String firstMarker = "__SRH_" + token + "_0_BEGIN__";

            // If no marker exists, compilation or Docker startup failed.
            if (!output.contains(firstMarker)) {
                String error = output.isBlank()
                        ? "Compilation or Docker execution failed."
                        : output.trim();

                return new BatchDockerResult(
                        false, error, List.of(), elapsedMs(start));
            }

            List<DockerResult> results = new ArrayList<>();

            for (int i = 0; i < inputs.size(); i++) {

                String beginMarker =
                        "__SRH_" + token + "_" + i + "_BEGIN__";

                String exitPrefix =
                        "__SRH_" + token + "_" + i + "_EXIT_";

                int begin = output.indexOf(beginMarker);

                if (begin < 0) {
                    results.add(new DockerResult(
                            false, "",
                            "Output limit exceeded or incomplete result.",
                            elapsedMs(start), false));
                    continue;
                }

                int contentStart = begin + beginMarker.length();

                if (contentStart < output.length()
                        && output.charAt(contentStart) == '\r') {
                    contentStart++;
                }

                if (contentStart < output.length()
                        && output.charAt(contentStart) == '\n') {
                    contentStart++;
                }

                int exit = output.indexOf(
                        "\n" + exitPrefix, contentStart);

                if (exit < 0) {
                    results.add(new DockerResult(
                            false, "",
                            "Incomplete execution result.",
                            elapsedMs(start), false));
                    continue;
                }

                String actualOutput =
                        output.substring(contentStart, exit).trim();

                int statusStart = exit + 1 + exitPrefix.length();
                int statusEnd = output.indexOf("__", statusStart);

                if (statusEnd < 0) {
                    results.add(new DockerResult(
                            false, actualOutput,
                            "Invalid execution result.",
                            elapsedMs(start), false));
                    continue;
                }

                int exitCode;

                try {
                    exitCode = Integer.parseInt(
                            output.substring(statusStart, statusEnd));
                } catch (NumberFormatException e) {
                    results.add(new DockerResult(
                            false, actualOutput,
                            "Invalid execution status.",
                            elapsedMs(start), false));
                    continue;
                }

                if (actualOutput.length() >= MAX_OUTPUT_CHARS) {
                    results.add(new DockerResult(
                            false, actualOutput,
                            "Output limit exceeded.",
                            elapsedMs(start), false));

                } else if (exitCode == 124) {
                    results.add(new DockerResult(
                            false, actualOutput,
                            "Time Limit Exceeded",
                            elapsedMs(start), true));

                } else if (exitCode != 0) {
                    results.add(new DockerResult(
                            false, actualOutput,
                            "Runtime Error (exit code " + exitCode + ")",
                            elapsedMs(start), false));

                } else {
                    results.add(new DockerResult(
                            true, actualOutput,
                            null, elapsedMs(start), false));
                }
            }

            return new BatchDockerResult(
                    true, null, results, elapsedMs(start));

        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();

            if (dockerProcess != null) {
                dockerProcess.destroyForcibly();
            }

            return new BatchDockerResult(
                    false,
                    "Execution was interrupted.",
                    List.of(),
                    elapsedMs(start));

        } catch (IOException e) {
            return new BatchDockerResult(
                    false,
                    "Could not start Docker. Ensure Docker Desktop is running. "
                            + e.getMessage(),
                    List.of(),
                    elapsedMs(start));

        } finally {
            if (dockerProcess != null && dockerProcess.isAlive()) {
                dockerProcess.destroyForcibly();
            }

            if (hostDir != null) {
                deleteDirectory(hostDir);
            }
        }
    }

    // ==========================================
    // Multi-language batch execution
    // Java continues using the original optimized runner.
    // ==========================================

    public BatchDockerResult executeBatch(
            String sourceCode,
            List<String> inputs,
            String language) {

        String selected = language == null
                ? "java"
                : language.trim().toLowerCase(java.util.Locale.ROOT);

        if ("java".equals(selected)) {
            return executeBatch(sourceCode, inputs);
        }

        if (!"python".equals(selected) && !"javascript".equals(selected)) {
            return new BatchDockerResult(
                    false, "Unsupported language: " + selected,
                    List.of(), 0);
        }

        return executeInterpretedBatch(sourceCode, inputs, selected);
    }

    private BatchDockerResult executeInterpretedBatch(
            String sourceCode,
            List<String> inputs,
            String language) {

        long start = System.nanoTime();

        if (sourceCode == null || sourceCode.isBlank()) {
            return new BatchDockerResult(
                    false, "Source code cannot be empty.", List.of(), 0);
        }

        if (inputs == null || inputs.isEmpty()) {
            return new BatchDockerResult(
                    false, "No test cases provided.", List.of(), 0);
        }

        String image = "python".equals(language)
                ? "python:3.12-slim"
                : "node:22-slim";

        String sourceFile = "python".equals(language)
                ? "Main.py"
                : "Main.js";

        String interpreter = "python".equals(language)
                ? "python"
                : "node";

        Path hostDir = null;
        Process dockerProcess = null;

        String token = UUID.randomUUID().toString().replace("-", "");

        int outputLimit = (int) Math.min(
                MAX_BATCH_OUTPUT_CHARS,
                (long) MAX_OUTPUT_CHARS * inputs.size() + 4096L);

        try {
            hostDir = Files.createTempDirectory("srh-codeverse-multi-");

            Files.writeString(
                    hostDir.resolve(sourceFile),
                    sourceCode,
                    StandardCharsets.UTF_8);

            for (int i = 0; i < inputs.size(); i++) {
                Files.writeString(
                        hostDir.resolve("input-" + i + ".txt"),
                        inputs.get(i) == null ? "" : inputs.get(i),
                        StandardCharsets.UTF_8);
            }

            StringBuilder script = new StringBuilder();

            script.append("cp /input/")
                    .append(sourceFile)
                    .append(" /workspace/")
                    .append(sourceFile)
                    .append(" || exit $?; ");

            if ("python".equals(language)) {
                script.append("python -m py_compile /workspace/Main.py; ");
            } else {
                script.append("node --check /workspace/Main.js; ");
            }

            script.append("compile_status=$?; ");
            script.append("if [ \"$compile_status\" -ne 0 ]; then exit \"$compile_status\"; fi; ");

            for (int i = 0; i < inputs.size(); i++) {
                script.append("printf '\\n__SRH_")
                        .append(token)
                        .append("_")
                        .append(i)
                        .append("_BEGIN__\\n'; ");

                script.append("timeout ")
                        .append(TIMEOUT_SECONDS)
                        .append("s ")
                        .append(interpreter)
                        .append(" /workspace/")
                        .append(sourceFile)
                        .append(" < /input/input-")
                        .append(i)
                        .append(".txt; ");

                script.append("test_status=$?; ");

                script.append("printf '\\n__SRH_")
                        .append(token)
                        .append("_")
                        .append(i)
                        .append("_EXIT_%s__\\n' \"$test_status\"; ");
            }

            ProcessBuilder builder = new ProcessBuilder(
                    "docker", "run", "--rm", "-i",
                    "--network", "none",
                    "--memory", MEMORY_LIMIT_MB + "m",
                    "--memory-swap", MEMORY_LIMIT_MB + "m",
                    "--cpus", String.valueOf(CPU_LIMIT),
                    "--pids-limit", "32",
                    "--read-only",
                    "--tmpfs", "/tmp:rw,noexec,nosuid,size=16m",
                    "--tmpfs", "/workspace:rw,exec,nosuid,size=32m,uid=10001,gid=10001,mode=700",
                    "--cap-drop", "ALL",
                    "--security-opt", "no-new-privileges",
                    "--user", "10001:10001",
                    "--mount",
                    "type=bind,source=" + hostDir.toAbsolutePath()
                            + ",target=/input,readonly",
                    "--workdir", "/workspace",
                    image,
                    "sh", "-c",
                    script.toString());

            builder.redirectErrorStream(true);

            dockerProcess = builder.start();
            dockerProcess.getOutputStream().close();

            Process process = dockerProcess;
            StringBuilder captured = new StringBuilder();

            Thread reader = new Thread(() -> {
                try (var stream = process.getInputStream()) {
                    byte[] buffer = new byte[2048];
                    int count;

                    while ((count = stream.read(buffer)) != -1) {
                        synchronized (captured) {
                            int remaining = outputLimit - captured.length();

                            if (remaining > 0) {
                                captured.append(new String(
                                        buffer,
                                        0,
                                        Math.min(count, remaining),
                                        StandardCharsets.UTF_8));
                            }
                        }
                    }
                } catch (IOException ignored) {
                    // Process may be stopped after timeout.
                }
            }, "docker-multilanguage-output-reader");

            reader.setDaemon(true);
            reader.start();

            long totalTimeout = TIMEOUT_SECONDS * inputs.size() + 15L;

            boolean finished = dockerProcess.waitFor(
                    totalTimeout, TimeUnit.SECONDS);

            if (!finished) {
                dockerProcess.destroyForcibly();
                dockerProcess.waitFor(1, TimeUnit.SECONDS);
                reader.join(500);

                List<DockerResult> timeoutResults = new ArrayList<>();

                for (int i = 0; i < inputs.size(); i++) {
                    timeoutResults.add(new DockerResult(
                            false, "", "Time Limit Exceeded",
                            elapsedMs(start), true));
                }

                return new BatchDockerResult(
                        true, null, timeoutResults, elapsedMs(start));
            }

            reader.join(1000);

            String output = getCaptured(captured);

            String firstMarker = "__SRH_" + token + "_0_BEGIN__";

            if (!output.contains(firstMarker)) {
                String error = output.isBlank()
                        ? "Compilation or Docker execution failed."
                        : output.trim();

                return new BatchDockerResult(
                        false, error, List.of(), elapsedMs(start));
            }

            List<DockerResult> results = new ArrayList<>();

            for (int i = 0; i < inputs.size(); i++) {
                String beginMarker =
                        "__SRH_" + token + "_" + i + "_BEGIN__";

                String exitPrefix =
                        "__SRH_" + token + "_" + i + "_EXIT_";

                int begin = output.indexOf(beginMarker);

                if (begin < 0) {
                    results.add(new DockerResult(
                            false, "",
                            "Output limit exceeded or incomplete result.",
                            elapsedMs(start), false));
                    continue;
                }

                int contentStart = begin + beginMarker.length();

                if (contentStart < output.length()
                        && output.charAt(contentStart) == '\r') {
                    contentStart++;
                }

                if (contentStart < output.length()
                        && output.charAt(contentStart) == '\n') {
                    contentStart++;
                }

                int exit = output.indexOf(
                        "\n" + exitPrefix, contentStart);

                if (exit < 0) {
                    results.add(new DockerResult(
                            false, "", "Incomplete execution result.",
                            elapsedMs(start), false));
                    continue;
                }

                String actualOutput =
                        output.substring(contentStart, exit).trim();

                int statusStart = exit + 1 + exitPrefix.length();
                int statusEnd = output.indexOf("__", statusStart);

                if (statusEnd < 0) {
                    results.add(new DockerResult(
                            false, actualOutput,
                            "Invalid execution result.",
                            elapsedMs(start), false));
                    continue;
                }

                int exitCode;

                try {
                    exitCode = Integer.parseInt(
                            output.substring(statusStart, statusEnd));
                } catch (NumberFormatException e) {
                    results.add(new DockerResult(
                            false, actualOutput,
                            "Invalid execution status.",
                            elapsedMs(start), false));
                    continue;
                }

                if (actualOutput.length() >= MAX_OUTPUT_CHARS) {
                    results.add(new DockerResult(
                            false, actualOutput,
                            "Output limit exceeded.",
                            elapsedMs(start), false));

                } else if (exitCode == 124) {
                    results.add(new DockerResult(
                            false, actualOutput,
                            "Time Limit Exceeded",
                            elapsedMs(start), true));

                } else if (exitCode != 0) {
                    results.add(new DockerResult(
                            false, actualOutput,
                            "Runtime Error (exit code " + exitCode + ")",
                            elapsedMs(start), false));

                } else {
                    results.add(new DockerResult(
                            true, actualOutput, null,
                            elapsedMs(start), false));
                }
            }

            return new BatchDockerResult(
                    true, null, results, elapsedMs(start));

        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();

            if (dockerProcess != null) {
                dockerProcess.destroyForcibly();
            }

            return new BatchDockerResult(
                    false, "Execution was interrupted.",
                    List.of(), elapsedMs(start));

        } catch (IOException e) {
            return new BatchDockerResult(
                    false,
                    "Could not start Docker. Ensure Docker Desktop is running. "
                            + e.getMessage(),
                    List.of(), elapsedMs(start));

        } finally {
            if (dockerProcess != null && dockerProcess.isAlive()) {
                dockerProcess.destroyForcibly();
            }

            if (hostDir != null) {
                deleteDirectory(hostDir);
            }
        }
    }
    private DockerResult failure(String message) {
        return new DockerResult(false, "", message, 0, false);
    }

    private long elapsedMs(long start) {
        return TimeUnit.NANOSECONDS.toMillis(
                System.nanoTime() - start);
    }

    private String getCaptured(StringBuilder captured) {
        synchronized (captured) {
            return captured.toString();
        }
    }

    private void deleteDirectory(Path directory) {
        try (var paths = Files.walk(directory)) {
            paths.sorted(Comparator.reverseOrder()).forEach(path -> {
                try {
                    Files.deleteIfExists(path);
                } catch (IOException ignored) {
                    // Best-effort cleanup.
                }
            });
        } catch (IOException ignored) {
            // Best-effort cleanup.
        }
    }
}