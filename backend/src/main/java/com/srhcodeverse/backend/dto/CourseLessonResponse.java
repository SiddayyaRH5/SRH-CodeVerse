
package com.srhcodeverse.backend.dto;

import lombok.*;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CourseLessonResponse {

    private Long id;
    private String moduleName;
    private Integer moduleOrder;
    private Integer lessonOrder;
    private String title;
    private String description;
    private String lessonContent;
    private String videoUrl;
    private String codeExample;
    private String exercise;
    private String quiz;
    private Integer estimatedMinutes;
    private boolean completed;
}
