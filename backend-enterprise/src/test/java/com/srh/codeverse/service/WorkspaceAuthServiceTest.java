package com.srh.codeverse.service;

import com.srh.codeverse.entity.Employee;
import com.srh.codeverse.repository.EmployeeRepository;
import com.srh.codeverse.repository.OrganizationRepository;
import com.srh.codeverse.repository.WorkspaceSessionRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.web.server.ResponseStatusException;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

@ExtendWith(MockitoExtension.class)
class WorkspaceAuthServiceTest {

    @Mock EmployeeRepository employeeRepository;
    @Mock OrganizationRepository organizationRepository;
    @Mock WorkspaceSessionRepository sessionRepository;

    @Test
    void unauthenticatedRequestIsRejected() {
        WorkspaceAuthService service = new WorkspaceAuthService(
            employeeRepository, organizationRepository, sessionRepository, new BCryptPasswordEncoder()
        );
        ResponseStatusException ex = assertThrows(ResponseStatusException.class, () -> service.requireWorkspaceUser(null));
        assertEquals(HttpStatus.UNAUTHORIZED, ex.getStatusCode());
    }

    @Test
    void invalidTokenIsRejected() {
        WorkspaceAuthService service = new WorkspaceAuthService(
            employeeRepository, organizationRepository, sessionRepository, new BCryptPasswordEncoder()
        );
        org.mockito.Mockito.when(sessionRepository.findByTokenHashAndRevokedFalse(org.mockito.ArgumentMatchers.anyString()))
            .thenReturn(java.util.Optional.empty());
        ResponseStatusException ex = assertThrows(ResponseStatusException.class, () -> service.requireWorkspaceUser("Bearer invalid-token"));
        assertEquals(HttpStatus.UNAUTHORIZED, ex.getStatusCode());
    }
}