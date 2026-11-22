package com.srhcodeverse.backend.dto;

/**
 * Small request payloads for the roadmap, learning, interview and certificate
 * features. Student identity is always derived from the authenticated principal
 * and is never accepted from the request body.
 */
public final class FeatureRequests {

    private FeatureRequests() {
    }

    public record TopicUpdate(Boolean completed) {
    }

    public record LessonUpdate(Boolean completed) {
    }

    public record NoteUpdate(String content) {
    }

    public record InterviewStart(
            String category,
            String difficulty,
            Integer questionCount,
            Integer durationMinutes,
            String mode) {
    }

    public record InterviewAnswer(
            Integer selectedOption,
            String answerText,
            Boolean flagged) {
    }

    public record CertificateAnswer(Integer selectedOption) {
    }
}
