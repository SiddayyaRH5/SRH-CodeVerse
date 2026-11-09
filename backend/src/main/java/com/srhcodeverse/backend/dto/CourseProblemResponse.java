package com.srhcodeverse.backend.dto;
import lombok.*;
@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class CourseProblemResponse { Long id; String title; String statement; String description; String difficulty; String topic; String tags; String expectedInput; String expectedOutput; String exampleInput; String exampleOutput; String explanation; String constraints; String starterCode; String solution; Integer xp; Integer estimatedTimeMinutes; }
