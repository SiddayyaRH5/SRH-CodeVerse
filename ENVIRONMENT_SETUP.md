# Environment setup guide

## Frontend
1. Install Node.js 22.12 or newer within the Node 22 LTS line.
2. Copy `frontend/.env.example` to `frontend/.env.local` if the sample exists. Never commit real secrets.
3. Run `cd frontend`, `npm ci`, then `npm run dev`.
4. Validate using `npm test` and `npm run build`.


## Backend
1. Install JDK 21.
2. Configure the backend environment variables from `backend/.env.example` if present, or the deployment environment's variable panel. Do not commit secrets.
3. Ensure MySQL is available and credentials are configured.
4. Run `cd backend` and `./mvnw spring-boot:run` (Windows: `mvnw.cmd spring-boot:run`).
5. Run tests with `./mvnw test` (Windows: `mvnw.cmd test`).


## Deployments
- Frontend is deployed through Vercel; verify the Vercel build output and environment variables.
- Backend is deployed through Render; verify service environment variables, logs, and health endpoints.
- After deployment, run the manual smoke checks in `RELEASE_STAGE_10.md`.

