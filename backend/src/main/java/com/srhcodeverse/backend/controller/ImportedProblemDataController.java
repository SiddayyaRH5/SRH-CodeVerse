package com.srhcodeverse.backend.controller;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.*;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Reads the imported LeetCode data tables created by the 2026-10-31 SQL import.
 * Only public starter code and visible examples are exposed to students.
 */
@RestController
@RequestMapping("/api/problems")
public class ImportedProblemDataController {

    private final JdbcTemplate jdbcTemplate;

    public ImportedProblemDataController(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @GetMapping("/{problemId}/imported-data")
    public Map<String, Object> getImportedData(@PathVariable Long problemId) {
        List<Map<String, Object>> starterRows = jdbcTemplate.queryForList(
                """
                SELECT language, starter_code
                FROM problem_starter_codes
                WHERE problem_id = ?
                ORDER BY language
                """,
                problemId
        );

        Map<String, String> starterCodes = new LinkedHashMap<>();
        for (Map<String, Object> row : starterRows) {
            starterCodes.put(
                    String.valueOf(row.get("language")),
                    String.valueOf(row.get("starter_code"))
            );
        }

        List<Map<String, Object>> examples = jdbcTemplate.queryForList(
                """
                SELECT example_order, input_json, expected_output_json,
                       raw_example, parse_status
                FROM problem_function_examples
                WHERE problem_id = ? AND is_hidden = 0
                ORDER BY example_order
                """,
                problemId
        );

        List<Map<String, Object>> statusRows = jdbcTemplate.queryForList(
                """
                SELECT evaluation_mode, evaluation_status, supported_languages
                FROM problem_evaluation_configs
                WHERE problem_id = ?
                """,
                problemId
        );

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("starterCodes", starterCodes);
        result.put("examples", examples);
        result.put("evaluation", statusRows.isEmpty() ? null : statusRows.get(0));
        return result;
    }
}
