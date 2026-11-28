-- Documentation / optional local-test DDL for Workstream C.
-- There is no Flyway/Liquibase in this project; the established schema mechanism is
-- Hibernate ddl-auto=update (spring.jpa.hibernate.ddl-auto=update). The new JPA
-- entities therefore create these tables automatically on a local/test database.
-- This script is NOT executed by the application and must NEVER be run against
-- Aiven or any production database. It uses additive, IF NOT EXISTS statements.

CREATE TABLE IF NOT EXISTS notifications (
  id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  recipient_id BIGINT NOT NULL,
  category VARCHAR(24) NOT NULL,
  title VARCHAR(200) NOT NULL,
  body TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  link VARCHAR(500) NULL,
  KEY idx_notification_recipient_created (recipient_id, created_at),
  KEY idx_notification_recipient_read (recipient_id, is_read),
  CONSTRAINT fk_notification_recipient FOREIGN KEY (recipient_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS announcements (
  id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  body TEXT NOT NULL,
  audience VARCHAR(20) NOT NULL,
  author VARCHAR(100) NOT NULL,
  created_at TIMESTAMP NOT NULL,
  updated_at TIMESTAMP NULL,
  KEY idx_announcement_audience_created (audience, created_at)
);
