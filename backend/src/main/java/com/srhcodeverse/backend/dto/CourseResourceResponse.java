package com.srhcodeverse.backend.dto;
import lombok.*;
@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class CourseResourceResponse { Long id; String title; String provider; String url; String type; boolean free; String description; }
