package com.srhcodeverse.backend.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import javax.sql.DataSource;
import java.sql.Connection;
import java.time.Instant;
import java.util.Map;

@RestController
public class HealthController {

    private final DataSource dataSource;

    public HealthController(DataSource dataSource) {
        this.dataSource = dataSource;
    }

    /**
     * Process liveness only. Deliberately does not touch MySQL, so a database
     * interruption does not make the process look dead.
     */
    @GetMapping({"/api/health", "/api/health/live"})
    public Map<String, Object> liveness() {
        return Map.of(
                "status", "UP",
                "service", "SRH CodeVerse Backend",
                "timestamp", Instant.now().toString()
        );
    }

    /**
     * Readiness uses one lightweight connection validation and a bounded
     * Hikari connection-acquisition timeout. It never reads application data.
     */
    @GetMapping("/api/health/ready")
    public ResponseEntity<Map<String, Object>> readiness() {
        try (Connection connection = dataSource.getConnection()) {
            boolean valid = connection.isValid(2);
            if (valid) {
                return ResponseEntity.ok(Map.of(
                        "status", "READY",
                        "database", "UP",
                        "timestamp", Instant.now().toString()
                ));
            }
        } catch (Exception ignored) {
            // Do not leak JDBC details, hostnames, or credentials in health output.
        }

        return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(Map.of(
                "status", "NOT_READY",
                "database", "UNAVAILABLE",
                "timestamp", Instant.now().toString()
        ));
    }
}
