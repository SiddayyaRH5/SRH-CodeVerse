package com.srhcodeverse.backend.dto;
import lombok.*;
@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class CourseProgressRequest { Long lessonId; boolean completed; }
