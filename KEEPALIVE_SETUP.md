# SRH CodeVerse: health endpoint and scheduled ping

This update adds:
- Spring Boot Actuator health endpoint at `/actuator/health`.
- Public access to only that health endpoint; other API routes keep their existing security rules.
- A GitHub Actions workflow scheduled every 10 minutes to request the deployed Render health endpoint.
- Safe local startup when `trainer.seed.password` is not configured: the trainer seed is skipped rather than failing application startup.
- An explicit Spring Boot main class in the Maven plugin configuration.

## Enable the 10-minute scheduled ping

1. Push this project to the GitHub repository's default branch (`main`).
2. Open the repository on GitHub and select **Actions**.
3. Enable Actions if GitHub prompts you.
4. Open **SRH CodeVerse backend health ping** and use **Run workflow** for an initial manual test.
5. Check the workflow run log. A successful health check should return JSON containing `"status":"UP"`.

GitHub scheduled workflows run on GitHub's schedule and can be delayed during high load. They are not guaranteed to execute at the exact minute. Scheduled workflows run from the default branch.

## Important Render Free-plan limitation

Render documents that Free web services spin down after 15 minutes without inbound traffic and can take about a minute to start again. This scheduled ping may reduce idle spin-down when it runs on time, but it does **not** guarantee permanent uptime: Render can restart services at any time, and scheduled GitHub Actions can be delayed. For guaranteed always-on service, use an always-on paid Render instance.

Render also documents a 750 free instance-hour monthly allowance per workspace. Monitor your usage; keeping one service running continuously can consume most of that allowance.

## Local backend configuration

Do not commit `application-secrets.properties`, database passwords, JWT secrets, or `.env` files. For local Aiven access, set `DB_URL`, `DB_USERNAME`, and `DB_PASSWORD` in your local shell/session. The trainer seed is skipped if `trainer.seed.password` is absent; to create the seeded trainer locally, set that property in your ignored `application-secrets.properties`.

## Verify locally

From `backend/` after configuring the database variables:

```powershell
.\mvnw.cmd clean package -DskipTests
java -jar target/srh-codeverse-backend-0.0.1-SNAPSHOT.jar
```

In another terminal:

```powershell
Invoke-RestMethod http://localhost:8080/actuator/health
```

Expected response: `status : UP`.
