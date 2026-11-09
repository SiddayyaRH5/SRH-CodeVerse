package com.srhcodeverse.backend.service;

import org.springframework.stereotype.Service;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
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

    public DockerResult execute(String sourceCode, String input) {
        if (sourceCode == null || sourceCode.isBlank()) {
            return failure("Java source code cannot be empty.");
        }

        Path hostSourceDir = null;
        Process dockerProcess = null;
        long start = System.nanoTime();

        try {
            hostSourceDir = Files.createTempDirectory("srh-codeverse-");
            Files.writeString(hostSourceDir.resolve("Main.java"), sourceCode, StandardCharsets.UTF_8);

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
                    "--mount", "type=bind,source=" + hostSourceDir.toAbsolutePath() + ",target=/input,readonly",
                    "--workdir", "/workspace",
                    JAVA_IMAGE,
                    "sh", "-c",
                    "cp /input/Main.java /workspace/Main.java && javac -proc:none Main.java && java -Xms16m -Xmx64m Main");

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
                                captured.append(new String(buffer, 0, Math.min(count, remaining), StandardCharsets.UTF_8));
                            }
                        }
                    }
                } catch (IOException ignored) {}
            }, "docker-output-reader");

            reader.setDaemon(true);
            reader.start();

            boolean finished = dockerProcess.waitFor(TIMEOUT_SECONDS, TimeUnit.SECONDS);
            if (!finished) {
                dockerProcess.destroyForcibly();
                dockerProcess.waitFor(1, TimeUnit.SECONDS);
                reader.join(500);
                return new DockerResult(false, getCaptured(captured), "Time Limit Exceeded", elapsedMs(start), true);
            }

            reader.join(1000);
            String output = getCaptured(captured).trim();

            if (output.length() >= MAX_OUTPUT_CHARS) {
                return new DockerResult(false, output, "Output limit exceeded", elapsedMs(start), false);
            }

            if (dockerProcess.exitValue() != 0) {
                String error = output.isBlank() ? "Compilation or execution failed." : output;
                return new DockerResult(false, output, error, elapsedMs(start), false);
            }

            return new DockerResult(true, output, null, elapsedMs(start), false);

        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            if (dockerProcess != null) dockerProcess.destroyForcibly();
            return failure("Execution was interrupted.");
        } catch (IOException e) {
            return failure("Could not start Docker. Ensure Docker Desktop is running. " + e.getMessage());
        } finally {
            if (dockerProcess != null && dockerProcess.isAlive()) {
                dockerProcess.destroyForcibly();
            }
            if (hostSourceDir != null) {
                deleteDirectory(hostSourceDir);
            }
        }
    }

    public BatchDockerResult executeBatch(String sourceCode, List<String> inputs) {
        return executeBatch(sourceCode, inputs, "java");
    }

    public BatchDockerResult executeBatchJavaInternal(String sourceCode, List<String> inputs) {
        long start = System.nanoTime();
        if (!isDockerAvailable()) {
            return executeHostProcessBatch(sourceCode, inputs, "java", start);
        }

        if (sourceCode == null || sourceCode.isBlank()) {
            return new BatchDockerResult(false, "Java source code cannot be empty.", List.of(), 0);
        }

        if (inputs == null || inputs.isEmpty()) {
            return new BatchDockerResult(false, "No test cases provided.", List.of(), 0);
        }

        Path hostDir = null;
        Process dockerProcess = null;
        String token = UUID.randomUUID().toString().replace("-", "");
        int outputLimit = (int) Math.min(MAX_BATCH_OUTPUT_CHARS, (long) MAX_OUTPUT_CHARS * inputs.size() + 4096L);

        try {
            hostDir = Files.createTempDirectory("srh-codeverse-batch-");
            Files.writeString(hostDir.resolve("Main.java"), sourceCode, StandardCharsets.UTF_8);

            for (int i = 0; i < inputs.size(); i++) {
                Files.writeString(hostDir.resolve("input-" + i + ".txt"), inputs.get(i) == null ? "" : inputs.get(i), StandardCharsets.UTF_8);
            }

            String cmd = "cp /input/Main.java /workspace/Main.java && javac -proc:none Main.java";
            for (int i = 0; i < inputs.size(); i++) {
                cmd += " && java -Xms16m -Xmx64m Main < /input/input-" + i + ".txt > /workspace/out-" + i + ".txt 2>&1 || true";
            }

            ProcessBuilder builder = new ProcessBuilder(
                    "docker", "run", "--rm", "-i",
                    "--network", "none",
                    "--memory", MEMORY_LIMIT_MB + "m",
                    "--memory-swap", MEMORY_LIMIT_MB + "m",
                    "--cpus", String.valueOf(CPU_LIMIT),
                    "--pids-limit", "64",
                    "--read-only",
                    "--tmpfs", "/tmp:rw,noexec,nosuid,size=16m",
                    "--tmpfs", "/workspace:rw,exec,nosuid,size=64m,uid=10001,gid=10001,mode=700",
                    "--cap-drop", "ALL",
                    "--security-opt", "no-new-privileges",
                    "--user", "10001:10001",
                    "--mount", "type=bind,source=" + hostDir.toAbsolutePath() + ",target=/input,readonly",
                    "--workdir", "/workspace",
                    JAVA_IMAGE,
                    "sh", "-c", cmd);

            builder.redirectErrorStream(true);
            dockerProcess = builder.start();

            boolean finished = dockerProcess.waitFor(TIMEOUT_SECONDS * 2, TimeUnit.SECONDS);
            if (!finished) {
                dockerProcess.destroyForcibly();
                List<DockerResult> timeoutResults = new ArrayList<>();
                for (int i = 0; i < inputs.size(); i++) {
                    timeoutResults.add(new DockerResult(false, "", "Time Limit Exceeded", TIMEOUT_SECONDS * 1000, true));
                }
                return new BatchDockerResult(true, null, timeoutResults, elapsedMs(start));
            }

            Path compileOutPath = hostDir.resolve("compile-out.txt");
            String compileError = "";
            List<DockerResult> results = new ArrayList<>();

            for (int i = 0; i < inputs.size(); i++) {
                Path outFilePath = hostDir.resolve("out-" + i + ".txt");
                String stdout = Files.exists(outFilePath) ? Files.readString(outFilePath, StandardCharsets.UTF_8) : "";
                boolean success = !stdout.contains("Exception") && !stdout.contains("Error");
                results.add(new DockerResult(success, stdout.trim(), success ? null : "Runtime Error", elapsedMs(start), false));
            }

            return new BatchDockerResult(true, null, results, elapsedMs(start));

        } catch (Exception e) {
            return new BatchDockerResult(false, "System Execution Error: " + e.getMessage(), List.of(), elapsedMs(start));
        } finally {
            if (dockerProcess != null && dockerProcess.isAlive()) {
                dockerProcess.destroyForcibly();
            }
            if (hostDir != null) {
                deleteDirectory(hostDir);
            }
        }
    }

    public BatchDockerResult executeBatch(String sourceCode, List<String> inputs, String language) {
        long start = System.nanoTime();
        String selected = language == null ? "java" : language.trim().toLowerCase(Locale.ROOT);

        if (!isDockerAvailable()) {
            return executeHostProcessBatch(sourceCode, inputs, selected, start);
        }

        if ("java".equals(selected)) {
            return executeBatchJavaInternal(sourceCode, inputs);
        }

        if (!"python".equals(selected) && !"javascript".equals(selected)) {
            return new BatchDockerResult(false, "Unsupported language: " + selected, List.of(), 0);
        }

        return executeInterpretedBatch(sourceCode, inputs, selected);
    }

    private BatchDockerResult executeInterpretedBatch(String sourceCode, List<String> inputs, String language) {
        long start = System.nanoTime();
        if (sourceCode == null || sourceCode.isBlank()) {
            return new BatchDockerResult(false, "Source code cannot be empty.", List.of(), 0);
        }
        if (inputs == null || inputs.isEmpty()) {
            return new BatchDockerResult(false, "No test cases provided.", List.of(), 0);
        }

        String image = "python".equals(language) ? "python:3.12-slim" : "node:22-slim";
        String sourceFile = "python".equals(language) ? "Main.py" : "Main.js";

        Path hostDir = null;
        Process dockerProcess = null;

        try {
            hostDir = Files.createTempDirectory("srh-codeverse-interpreted-");
            Files.writeString(hostDir.resolve(sourceFile), sourceCode, StandardCharsets.UTF_8);

            for (int i = 0; i < inputs.size(); i++) {
                Files.writeString(hostDir.resolve("input-" + i + ".txt"), inputs.get(i) == null ? "" : inputs.get(i), StandardCharsets.UTF_8);
            }

            String interpreter = "python".equals(language) ? "python3" : "node";
            String cmd = "";
            for (int i = 0; i < inputs.size(); i++) {
                cmd += (i == 0 ? "" : " && ") + interpreter + " " + sourceFile + " < /input/input-" + i + ".txt > /workspace/out-" + i + ".txt 2>&1 || true";
            }

            ProcessBuilder builder = new ProcessBuilder(
                    "docker", "run", "--rm", "-i",
                    "--network", "none",
                    "--memory", MEMORY_LIMIT_MB + "m",
                    "--memory-swap", MEMORY_LIMIT_MB + "m",
                    "--cpus", String.valueOf(CPU_LIMIT),
                    "--pids-limit", "64",
                    "--read-only",
                    "--tmpfs", "/tmp:rw,noexec,nosuid,size=16m",
                    "--tmpfs", "/workspace:rw,exec,nosuid,size=64m,uid=10001,gid=10001,mode=700",
                    "--cap-drop", "ALL",
                    "--security-opt", "no-new-privileges",
                    "--user", "10001:10001",
                    "--mount", "type=bind,source=" + hostDir.toAbsolutePath() + ",target=/input,readonly",
                    "--workdir", "/workspace",
                    image,
                    "sh", "-c", cmd);

            builder.redirectErrorStream(true);
            dockerProcess = builder.start();

            boolean finished = dockerProcess.waitFor(TIMEOUT_SECONDS * 2, TimeUnit.SECONDS);
            if (!finished) {
                dockerProcess.destroyForcibly();
                List<DockerResult> timeoutResults = new ArrayList<>();
                for (int i = 0; i < inputs.size(); i++) {
                    timeoutResults.add(new DockerResult(false, "", "Time Limit Exceeded", TIMEOUT_SECONDS * 1000, true));
                }
                return new BatchDockerResult(true, null, timeoutResults, elapsedMs(start));
            }

            List<DockerResult> results = new ArrayList<>();
            for (int i = 0; i < inputs.size(); i++) {
                Path outFilePath = hostDir.resolve("out-" + i + ".txt");
                String stdout = Files.exists(outFilePath) ? Files.readString(outFilePath, StandardCharsets.UTF_8) : "";
                boolean success = !stdout.contains("Traceback") && !stdout.contains("Error:");
                results.add(new DockerResult(success, stdout.trim(), success ? null : "Runtime Error", elapsedMs(start), false));
            }

            return new BatchDockerResult(true, null, results, elapsedMs(start));

        } catch (Exception e) {
            return new BatchDockerResult(false, "System Execution Error: " + e.getMessage(), List.of(), elapsedMs(start));
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
        return TimeUnit.NANOSECONDS.toMillis(System.nanoTime() - start);
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
                } catch (IOException ignored) {}
            });
        } catch (IOException ignored) {}
    }

    public boolean isDockerAvailable() {
        try {
            Process process = new ProcessBuilder("docker", "version", "--format", "{{.Server.Version}}")
                    .redirectErrorStream(true)
                    .start();
            boolean finished = process.waitFor(2, TimeUnit.SECONDS);
            return finished && process.exitValue() == 0;
        } catch (Exception e) {
            return false;
        }
    }

    private BatchDockerResult executeHostProcessBatch(String sourceCode, List<String> inputs, String language, long start) {
        Path tempDir = null;
        String lang = language == null ? "java" : language.toLowerCase(Locale.ROOT);
        try {
            tempDir = Files.createTempDirectory("srh_host_exec_");
            String fileName = switch (lang) {
                case "python" -> "Main.py";
                case "javascript" -> "Main.js";
                default -> "Main.java";
            };
            Files.writeString(tempDir.resolve(fileName), sourceCode, StandardCharsets.UTF_8);

            for (int i = 0; i < inputs.size(); i++) {
                Files.writeString(tempDir.resolve("input-" + i + ".txt"), inputs.get(i) == null ? "" : inputs.get(i), StandardCharsets.UTF_8);
            }

            if ("java".equals(lang)) {
                Process compileProcess = new ProcessBuilder("javac", "-proc:none", "Main.java")
                        .directory(tempDir.toFile())
                        .redirectErrorStream(true)
                        .start();
                String compileOutput = new String(compileProcess.getInputStream().readAllBytes(), StandardCharsets.UTF_8);
                if (!compileProcess.waitFor(TIMEOUT_SECONDS, TimeUnit.SECONDS) || compileProcess.exitValue() != 0) {
                    compileProcess.destroyForcibly();
                    return new BatchDockerResult(false, compileOutput.isBlank() ? "Compilation Failed" : compileOutput.trim(), List.of(), elapsedMs(start));
                }
            }

            List<DockerResult> results = new ArrayList<>();
            for (int i = 0; i < inputs.size(); i++) {
                List<String> command = switch (lang) {
                    case "python" -> List.of("python3", "Main.py");
                    case "javascript" -> List.of("node", "Main.js");
                    default -> List.of("java", "-Xms16m", "-Xmx64m", "-cp", ".", "Main");
                };

                ProcessBuilder pb = new ProcessBuilder(command);
                pb.directory(tempDir.toFile());
                Process runProcess = pb.start();

                Path inputFile = tempDir.resolve("input-" + i + ".txt");
                if (Files.exists(inputFile) && Files.size(inputFile) > 0) {
                    Files.copy(inputFile, runProcess.getOutputStream());
                    runProcess.getOutputStream().close();
                }

                boolean finished = runProcess.waitFor(TIMEOUT_SECONDS, TimeUnit.SECONDS);
                if (!finished) {
                    runProcess.destroyForcibly();
                    results.add(new DockerResult(false, "", "Time Limit Exceeded", TIMEOUT_SECONDS * 1000, true));
                    continue;
                }

                String stdout = new String(runProcess.getInputStream().readAllBytes(), StandardCharsets.UTF_8);
                String stderr = new String(runProcess.getErrorStream().readAllBytes(), StandardCharsets.UTF_8);
                boolean success = runProcess.exitValue() == 0;
                results.add(new DockerResult(success, stdout, success ? null : "Runtime Error: " + stderr, elapsedMs(start), false));
            }

            return new BatchDockerResult(true, null, results, elapsedMs(start));

        } catch (Exception e) {
            return new BatchDockerResult(false, "System Execution Error: " + e.getMessage(), List.of(), elapsedMs(start));
        } finally {
            if (tempDir != null) deleteDirectory(tempDir);
        }
    }
}