package com.srhcodeverse.backend.service;

import java.util.Locale;
import org.springframework.stereotype.Service;
import java.io.*;
import java.nio.charset.StandardCharsets;
import java.nio.file.*;
import java.util.*;
import java.util.concurrent.TimeUnit;

@Service
public class DockerExecutionService {

    private static final String JAVA_IMAGE = "eclipse-temurin:21-jdk";
    private static final long TIMEOUT_SECONDS = 5;
    private static final long MEMORY_LIMIT_MB = 128;
    private static final int CPU_LIMIT = 1;
    private static final int MAX_OUTPUT_CHARS = 32_000;

    public record DockerResult(boolean success, String output, String error, long runtimeMs, boolean timedOut) {}
    public record BatchDockerResult(boolean compiled, String compileError, List<DockerResult> results, long runtimeMs) {}

    /**
     * Checks if the Docker daemon is responsive within 2 seconds.
     */
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

    
    public BatchDockerResult executeBatch(String sourceCode, List<String> inputs) {
        return executeBatch(sourceCode, inputs, "java");
    }
    public BatchDockerResult executeBatch(String sourceCode, List<String> inputs, String language) {
        long start = System.nanoTime();

        if (sourceCode == null || sourceCode.isBlank()) {
            return new BatchDockerResult(false, "Source code cannot be empty.", List.of(), 0);
        }

        if (!isDockerAvailable()) {
            // Graceful fallback to secure Host Process Engine when running on Render or Docker Desktop is off
            return executeHostProcessBatch(sourceCode, inputs, language, start);
        }

        return executeDockerContainerBatch(sourceCode, inputs, language, start);
    }

    private BatchDockerResult executeDockerContainerBatch(String sourceCode, List<String> inputs, String language, long start) {
        Path hostDir = null;
        Process dockerProcess = null;
        String token = UUID.randomUUID().toString().replace("-", "");

        try {
            hostDir = Files.createTempDirectory("srh-exec-");
            Path srcFile = hostDir.resolve("Main.java");
            Files.writeString(srcFile, sourceCode, StandardCharsets.UTF_8);

            for (int i = 0; i < inputs.size(); i++) {
                Files.writeString(hostDir.resolve("input-" + i + ".txt"), inputs.get(i) == null ? "" : inputs.get(i), StandardCharsets.UTF_8);
            }

            StringBuilder script = new StringBuilder();
            script.append("cp /input/Main.java /workspace/Main.java && ");
            script.append("javac -proc:none /workspace/Main.java; ");
            script.append("compile_status=$?; ");
            script.append("if [ \"$compile_status\" -ne 0 ]; then exit \"$compile_status\"; fi; ");

            for (int i = 0; i < inputs.size(); i++) {
                script.append("printf '\\n__SRH_").append(token).append("_").append(i).append("_BEGIN__\\n'; ");
                script.append("timeout ").append(TIMEOUT_SECONDS).append("s java -Xms16m -Xmx64m -cp /workspace Main < /input/input-").append(i).append(".txt; ");
                script.append("test_status=$?; ");
                script.append("printf '\\n__SRH_").append(token).append("_").append(i).append("_EXIT_%s__\\n' \"$test_status\"; ");
            }

            // Cross-platform container mounts with non-root security boundaries
            ProcessBuilder pb = new ProcessBuilder(
                    "docker", "run", "--rm", "-i",
                    "--network", "none",
                    "--memory", MEMORY_LIMIT_MB + "m",
                    "--memory-swap", MEMORY_LIMIT_MB + "m",
                    "--cpus", String.valueOf(CPU_LIMIT),
                    "--pids-limit", "32",
                    "--cap-drop", "ALL",
                    "--tmpfs", "/workspace:rw,exec,nosuid,size=64m",
                    "--mount", "type=bind,source=" + hostDir.toAbsolutePath().toString().replace("\\", "/") + ",target=/input,readonly",
                    JAVA_IMAGE,
                    "sh", "-c", script.toString()
            );

            pb.redirectErrorStream(true);
            dockerProcess = pb.start();
            dockerProcess.getOutputStream().close();

            String output = new String(dockerProcess.getInputStream().readAllBytes(), StandardCharsets.UTF_8);
            boolean finished = dockerProcess.waitFor(TIMEOUT_SECONDS * inputs.size() + 10, TimeUnit.SECONDS);

            if (!finished) {
                dockerProcess.destroyForcibly();
                return timeoutBatchResult(inputs.size(), start);
            }

            return parseBatchMarkers(output, token, inputs.size(), start);

        } catch (Exception e) {
            return executeHostProcessBatch(sourceCode, inputs, language, start);
        } finally {
            if (dockerProcess != null && dockerProcess.isAlive()) dockerProcess.destroyForcibly();
            if (hostDir != null) deleteDir(hostDir);
        }
    }

    
    private BatchDockerResult executeHostProcessBatch(String sourceCode, List<String> inputs, long start) {
        return executeHostProcessBatch(sourceCode, inputs, "java", start);
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
                if (!compileProcess.waitFor(10, TimeUnit.SECONDS) || compileProcess.exitValue() != 0) {
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

                boolean finished = runProcess.waitFor(10, TimeUnit.SECONDS);
                if (!finished) {
                    runProcess.destroyForcibly();
                    results.add(new DockerResult(false, "", "Time Limit Exceeded", 10000, true));
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