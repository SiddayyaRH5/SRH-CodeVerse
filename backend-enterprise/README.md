# SRH CodeVerse Backend (Spring Boot + JPA/Hibernate + MySQL)

## Prerequisites
- Java 17+
- Maven 3.9+
- MySQL 8.x (`CREATE DATABASE srh_codeverse;`)

## Configuration
Override database and CORS properties via environment variables:

```bash
export DB_URL="jdbc:mysql://localhost:3306/srh_codeverse?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC"
export DB_USERNAME="your_mysql_user"
export DB_PASSWORD="your_mysql_password"
export APP_CORS_ORIGINS="http://localhost:3000"
```

## Initial Super Admin Provisioning (No Hardcoded Credentials)
SRH CodeVerse never seeds default Super Admin passwords in source code.

To provision the very first `SUPER_ADMIN` account cleanly on startup when zero `SUPER_ADMIN` rows exist in `platform_users`, supply environment variables for the initial boot and remove them afterward:

```bash
export SUPER_ADMIN_BOOTSTRAP_EMAIL="governance@yourdomain.com"
export SUPER_ADMIN_BOOTSTRAP_PASSWORD="Your-Strong-12+-Char-Password"
export SUPER_ADMIN_BOOTSTRAP_NAME="Platform Governor"
```

Behavior of `SuperAdminBootstrapRunner`:
1. Runs only if both `SUPER_ADMIN_BOOTSTRAP_EMAIL` and `SUPER_ADMIN_BOOTSTRAP_PASSWORD` are set.
2. Enforces a minimum password length of 12 characters and hashes the password with BCrypt.
3. No-ops automatically if at least one `SUPER_ADMIN` already exists in MySQL.
4. Persists an immutable `BOOTSTRAP_SUPER_ADMIN` row in `platform_audit_logs`.

## Accessing the Hidden Super Admin Console
- Direct path: `/platform/console` (never linked from ordinary workspaces or Student navigation).
- Backend API prefix: `/api/super-admin/**`.
- Every protected endpoint validates an opaque Bearer token hashed with SHA-256 against `platform_sessions` and verifies `platform_users.platform_role = 'SUPER_ADMIN'` and `status = 'ACTIVE'`.
- Client-provided workspace headers (`X-Workspace-Role`, `X-Org-Id`) are never trusted for Super Admin authorization.

## Running Tests & Server
```bash
cd backend
mvn test
mvn spring-boot:run
```
