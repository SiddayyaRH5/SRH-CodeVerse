package com.srhcodeverse.backend.service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.Collection;
import java.util.HashMap;
import java.util.Map;

/**
 * Shared, timezone-aware conversion of JDBC/JPA timestamp values to LocalDate.
 * Keeps analytics/dashboard aggregation portable across H2 and MySQL: the
 * repository returns timestamps only, day boundaries are applied in Java.
 */
public final class AnalyticsDates {

    private AnalyticsDates() {
    }

    public static LocalDate toLocalDate(Object value, ZoneId zone) {
        if (value == null)
            throw new IllegalArgumentException("Submission timestamp is null");
        if (value instanceof LocalDate date)
            return date;
        if (value instanceof java.sql.Date date)
            return date.toLocalDate();
        if (value instanceof java.sql.Timestamp timestamp)
            return timestamp.toLocalDateTime().atZone(zone).toLocalDate();
        if (value instanceof LocalDateTime dateTime)
            return dateTime.atZone(zone).toLocalDate();
        if (value instanceof java.util.Date date)
            return date.toInstant().atZone(zone).toLocalDate();

        String text = String.valueOf(value);
        try {
            return LocalDate.parse(text.length() >= 10 ? text.substring(0, 10) : text);
        } catch (RuntimeException e) {
            throw new IllegalStateException("Unsupported submission date value: " + text, e);
        }
    }

    public static Map<LocalDate, Long> countByDay(Collection<Object> timestamps, ZoneId zone) {
        Map<LocalDate, Long> counts = new HashMap<>();
        if (timestamps == null)
            return counts;
        for (Object timestamp : timestamps) {
            if (timestamp == null)
                continue;
            counts.merge(toLocalDate(timestamp, zone), 1L, Long::sum);
        }
        return counts;
    }
}
