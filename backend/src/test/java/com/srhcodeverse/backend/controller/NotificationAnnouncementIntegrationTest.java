package com.srhcodeverse.backend.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.srhcodeverse.backend.entity.Announcement;
import com.srhcodeverse.backend.entity.Notification;
import com.srhcodeverse.backend.entity.Role;
import com.srhcodeverse.backend.entity.User;
import com.srhcodeverse.backend.repository.AnnouncementRepository;
import com.srhcodeverse.backend.repository.NotificationRepository;
import com.srhcodeverse.backend.repository.RoleRepository;
import com.srhcodeverse.backend.repository.UserRepository;
import com.srhcodeverse.backend.security.JwtUtil;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;

import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@TestPropertySource(properties = {
        "spring.datasource.url=jdbc:h2:mem:notifannounce;DB_CLOSE_DELAY=-1",
        "spring.datasource.driver-class-name=org.h2.Driver",
        "spring.jpa.database-platform=org.hibernate.dialect.H2Dialect",
        "jwt.secret=notifications-announcements-test-secret-key",
        "spring.security.oauth2.client.registration.google.client-id=test",
        "spring.security.oauth2.client.registration.google.client-secret=test",
        "spring.security.oauth2.client.registration.github.client-id=test",
        "spring.security.oauth2.client.registration.github.client-secret=test"
})
class NotificationAnnouncementIntegrationTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private ObjectMapper objectMapper;
    @Autowired private RoleRepository roleRepository;
    @Autowired private UserRepository userRepository;
    @Autowired private NotificationRepository notificationRepository;
    @Autowired private AnnouncementRepository announcementRepository;
    @Autowired private JwtUtil jwtUtil;

    private String token(String role) {
        Role r = roleRepository.findByName(role)
                .orElseGet(() -> roleRepository.save(Role.builder().name(role).build()));
        String suffix = UUID.randomUUID().toString().substring(0, 8);
        String username = role.toLowerCase() + "_" + suffix;
        userRepository.save(User.builder().username(username)
                .email(username + "@test.dev").passwordHash("x").role(r).build());
        return "Bearer " + jwtUtil.generateToken(username, role);
    }

    private User user(String authHeader) {
        String username = jwtUtil.extractUsername(authHeader.substring(7));
        return userRepository.findByUsername(username).orElseThrow();
    }

    private Notification notification(User recipient, String title) {
        return notificationRepository.save(Notification.builder().recipient(recipient)
                .category("SYSTEM").title(title).body("body").link(null).build());
    }

    @Test
    void notificationsArePrivateAndReadOperationsAreIdempotent() throws Exception {
        String studentA = token("STUDENT");
        String studentB = token("STUDENT");
        User a = user(studentA);
        User b = user(studentB);
        Notification a1 = notification(a, "for-a-1");
        Notification a2 = notification(a, "for-a-2");
        Notification b1 = notification(b, "for-b");

        mockMvc.perform(get("/api/notifications"))
                .andExpect(status().isUnauthorized());

        String body = mockMvc.perform(get("/api/notifications").header("Authorization", studentA))
                .andExpect(status().isOk()).andReturn().getResponse().getContentAsString();
        var root = objectMapper.readTree(body);
        assertEquals(2, root.get("items").size());
        assertTrue(body.contains("for-a-1"));
        assertFalse(body.contains("for-b"));

        mockMvc.perform(post("/api/notifications/" + b1.getId() + "/read")
                        .header("Authorization", studentA))
                .andExpect(status().isNotFound());

        mockMvc.perform(post("/api/notifications/" + a1.getId() + "/read")
                        .header("Authorization", studentA))
                .andExpect(status().isNoContent());
        mockMvc.perform(post("/api/notifications/" + a1.getId() + "/read")
                        .header("Authorization", studentA))
                .andExpect(status().isNoContent());

        mockMvc.perform(post("/api/notifications/read-all").header("Authorization", studentA))
                .andExpect(status().isNoContent());
        assertTrue(notificationRepository.findById(a1.getId()).orElseThrow().isRead());
        assertTrue(notificationRepository.findById(a2.getId()).orElseThrow().isRead());
        assertFalse(notificationRepository.findById(b1.getId()).orElseThrow().isRead());
    }

    @Test
    void announcementsRespectAudienceAndRolePolicy() throws Exception {
        String student = token("STUDENT");
        String trainer = token("TRAINER");
        announcementRepository.save(Announcement.builder().title("all").body("b")
                .audience("ALL").author("system").build());
        announcementRepository.save(Announcement.builder().title("students").body("b")
                .audience("STUDENT").author("system").build());
        announcementRepository.save(Announcement.builder().title("trainers").body("b")
                .audience("TRAINER").author("system").build());

        String studentBody = mockMvc.perform(get("/api/announcements")
                        .header("Authorization", student))
                .andExpect(status().isOk()).andReturn().getResponse().getContentAsString();
        assertTrue(studentBody.contains("\"title\":\"all\""));
        assertTrue(studentBody.contains("\"title\":\"students\""));
        assertFalse(studentBody.contains("\"title\":\"trainers\""));

        String trainerBody = mockMvc.perform(get("/api/announcements")
                        .header("Authorization", trainer))
                .andExpect(status().isOk()).andReturn().getResponse().getContentAsString();
        assertTrue(trainerBody.contains("\"title\":\"trainers\""));

        String payload = """
                {"title":"Trainer note","body":"Details","audience":"STUDENT"}
                """;
        mockMvc.perform(post("/api/announcements").header("Authorization", student)
                        .contentType(MediaType.APPLICATION_JSON).content(payload))
                .andExpect(status().isForbidden());
        mockMvc.perform(post("/api/announcements").header("Authorization", trainer)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"title\":\"x\",\"body\":\"y\",\"audience\":\"INVALID\"}"))
                .andExpect(status().isBadRequest());
        mockMvc.perform(post("/api/announcements").header("Authorization", trainer)
                        .contentType(MediaType.APPLICATION_JSON).content(payload))
                .andExpect(status().isOk());
        assertTrue(roleRepository.findByName("ADMIN").isEmpty());
    }
}
