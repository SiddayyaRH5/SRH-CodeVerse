package com.srhcodeverse.backend.service;

import org.springframework.stereotype.Service;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Comparator;
import java.util.concurrent.TimeUnit;

@Service
public class DockerExecutionService {

    private static final String JAVA_IMAGE = "eclipse-temurin:21-jdk";
    private static final long TIMEOUT_SECONDS = 25;
    private static final long MEMORY_LIMIT_MB = 128;
    private static final int CPU_LIMIT = 1;
    private static final int MAX_OUTPUT_CHARS = 16_000;

    public record DockerResult(
            boolean success,
            String output,
            String error,
            long runtimeMs,
            boolean timedOut) {
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
                                        buffer, 0, Math.min(count, remaining), StandardCharsets.UTF_8));
                            }
                        }
                    }
                } catch (IOException ignored) {
                    // Process may be stopped after timeout.
                }
            }, "docker-output-reader");
            reader.setDaemon(true);
            reader.start();

            boolean finished = dockerProcess.waitFor(TIMEOUT_SECONDS, TimeUnit.SECONDS);
            if (!finished) {
                dockerProcess.destroyForcibly();
                dockerProcess.waitFor(1, TimeUnit.SECONDS);
                reader.join(500);
                return new DockerResult(false, getCaptured(captured),
                        "Time Limit Exceeded", elapsedMs(start), true);
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
            if (dockerProcess != null) {
                dockerProcess.destroyForcibly();
            }
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
                } catch (IOException ignored) {
                    // Best-effort cleanup.
                }
            });
        } catch (IOException ignored) {
            // Best-effort cleanup.
        }
    }
}
