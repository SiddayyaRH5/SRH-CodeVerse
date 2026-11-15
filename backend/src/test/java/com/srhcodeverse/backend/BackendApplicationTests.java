package com.srhcodeverse.backend;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.TestPropertySource;

@SpringBootTest
@TestPropertySource(properties = {
    "spring.datasource.url=jdbc:h2:mem:testdb",
    "spring.datasource.driver-class-name=org.h2.Driver",
    "spring.jpa.database-platform=org.hibernate.dialect.H2Dialect",
    "jwt.secret=test-secret-key-do-not-use-in-production",
    "spring.security.oauth2.client.registration.google.client-id=test-google-client-id",
    "spring.security.oauth2.client.registration.google.client-secret=test-google-client-secret",
    "spring.security.oauth2.client.registration.github.client-id=test-github-client-id",
    "spring.security.oauth2.client.registration.github.client-secret=test-github-client-secret"
})
class BackendApplicationTests {

	@Test
	void contextLoads() {
	}

}
