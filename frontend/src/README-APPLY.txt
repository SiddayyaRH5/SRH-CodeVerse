SRH CodeVerse – Global API Cache Patch

Apply this patch by extracting it into the ROOT of your existing frontend project
(the folder that contains package.json), allowing the files to overwrite.

Files included:
- src/utils/cache.js
- src/api/*Api.js (the API service modules)

What it does:
- Caches successful GET API responses in browser memory for 2 minutes.
- Reuses cached responses when navigating between pages in the same SPA session.
- Deduplicates simultaneous identical GET requests.
- Separates cache entries by the current srhcodeverse_token.
- Clears cache on logout through the existing AuthContext integration.
- Invalidates related cache entries after course progress, profile, trainer problem,
  daily challenge, and problem submission mutations.
- Keeps the existing cachedFetch/invalidate exports for compatibility with existing pages.
- Does not change axiosInstance.js, authentication headers, routing, or page components.

Important:
- This is an in-memory cache. A full browser refresh or closing the tab clears it.
- First-time loads still call the backend. This does not prevent Render/Aiven free-tier
  cold starts on the first request after inactivity.
- The cache TTL is 2 minutes. Data may therefore be up to 2 minutes old unless a related
  mutation invalidates it.
- External YouTube requests are not part of this API cache.

Verification:
- JavaScript syntax checks passed for all 13 modified files.
- A full Vite build could not be verified in this environment because the uploaded
  node_modules contained a platform-specific missing native Lightning CSS binary.
  Run npm install and npm run build on your Windows development machine before pushing.
