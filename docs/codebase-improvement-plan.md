# Hire Lens Codebase Improvement Plan

This plan is ordered by risk and impact from the current audit of the repo. Effort is a rough estimate for a single developer familiar with the codebase.

Priority scale: `P0` = fix first, `P1` = next, `P2` = refactor/optimize, `P3` = cleanup.

| Priority | Description | Location | Suggested fix | Est. effort |
| --- | --- | --- | --- | --- |
| P0 | Gemini API key is pushed into the PersonaProbe client bundle, which exposes the secret in built JavaScript and makes the browser app the wrong trust boundary for model calls. | [apps/persona_probe/vite.config.ts:6-12](apps/persona_probe/vite.config.ts#L6) and [apps/persona_probe/src/services/geminiService.ts:10-16](apps/persona_probe/src/services/geminiService.ts#L10) | Move Gemini calls behind a backend endpoint or server action, remove the Vite `define` for `GEMINI_API_KEY`, and keep the key server-side only. | 4-6h |
| P0 | The backend auth flow is not hardened: `JWT_SECRET` is hardcoded, `/auth/github` trusts an untyped dict, env vars are never validated, and `/auth/logout` only prints the header instead of validating or revoking anything. | [services/backend/backend.py:23-65](services/backend/backend.py#L23) | Load all secrets from env with startup validation, parse requests with `CodePayload`, check the OAuth exchange result, and implement real token verification or remove logout until token lifecycle exists. | 4-6h |
| P0 | The Telegram link flow is hardcoded to `http://localhost:3000`, so the bot will generate broken links outside the local dev setup. | [apps/telegram-bot/src/bot.ts:252-267](apps/telegram-bot/src/bot.ts#L252) | Read the dashboard base URL from env/config (`APP_URL`) and build the deep link from that value instead of hardcoding localhost. | 0.5-1h |
| P1 | Mock Firebase linking is not actually shared between apps: the bot writes linking codes to an in-memory `mockCodes` map, but the web app only reads Firestore, so local linking fails whenever Firebase is unavailable. | [apps/telegram-bot/src/services/firebaseService.ts:49-71](apps/telegram-bot/src/services/firebaseService.ts#L49) and [apps/persona_probe/src/App.tsx:75-108](apps/persona_probe/src/App.tsx#L75) | Either require real Firestore for the link flow or implement a shared mock store that both apps can read; failing loudly is simpler and safer. | 2-3h |
| P1 | Backend CORS is overly permissive for a public API surface, with wildcard methods and headers enabled even though the app only needs a small set. | [services/backend/backend.py:15-21](services/backend/backend.py#L15) | Restrict allowed origins to the deployed frontend(s) and limit methods/headers to the exact ones used by the auth routes. | 1h |
| P1 | PersonaProbe falls back to the real Firebase project values in source code, which leaks deployment details and hides missing env config. | [apps/persona_probe/src/firebase.ts:5-12](apps/persona_probe/src/firebase.ts#L5) | Replace the hardcoded defaults with placeholder-only values or fail fast when required env vars are missing. | 0.5-1h |
| P1 | Shared logic is duplicated across both apps: GitHub/Gemini services, type definitions, and the demo profile appear in parallel app folders instead of one shared contract. | [apps/persona_probe/src/services/githubService.ts](apps/persona_probe/src/services/githubService.ts), [apps/persona_probe/src/services/geminiService.ts](apps/persona_probe/src/services/geminiService.ts), [apps/persona_probe/src/types/index.ts](apps/persona_probe/src/types/index.ts), and the equivalent files under [apps/telegram-bot/src](apps/telegram-bot/src) | Move common DTOs, helpers, and demo data into `packages/shared`, then keep only app-specific wiring in each app. | 5-8h |
| P2 | The PersonaProbe GitHub fetch path does extra work and logs too much: it makes sequential public/all-events requests, prints debug output, and casts raw JSON without validation. | [apps/persona_probe/src/services/githubService.ts:17-84](apps/persona_probe/src/services/githubService.ts#L17) | Validate response shapes, return typed `GitHubEvent[]`, remove production `console.log` calls, and cache or simplify the fallback request strategy. | 2-3h |
| P2 | Telegram quota and linking fallback data live only in process memory, so usage data disappears on restart and the app can silently appear healthy while it is not persisting anything. | [apps/telegram-bot/src/services/firebaseService.ts:49-128](apps/telegram-bot/src/services/firebaseService.ts#L49) | Keep mock behavior only for tests/dev fixtures, or make the app fail loudly when Firestore is unavailable instead of silently degrading. | 1-2h |
| P3 | `analyzeCommitPattern` has an unused `totalEvents` parameter and still uses `any`-typed inputs, which makes the helper harder to trust and maintain. | [apps/persona_probe/src/utils/analyzeCommitPattern.ts:3-57](apps/persona_probe/src/utils/analyzeCommitPattern.ts#L3) | Remove the unused parameter or use it meaningfully, and replace `any` with the concrete GitHub event/repo types. | 0.5h |
| P3 | `analyzeLanguages` contains redundant property access (`repo["language"]`) and a debug log that should not stay in production code. | [apps/persona_probe/src/utils/analyzeLanguages.ts:3-17](apps/persona_probe/src/utils/analyzeLanguages.ts#L3) | Use the typed property access only and remove the console log once the fallback behavior is settled. | 0.5h |
| P3 | The Terraform module declares a `function_image` variable, but the Functions module still deploys a fixed dotnet-isolated app and never uses the image path. | [terraform/variables.tf:40-44](terraform/variables.tf#L40) and [terraform/modules/functions/main.tf:21-43](terraform/modules/functions/main.tf#L21) | Either wire the image variable into an actual containerized Functions deployment or remove the dead variable until that path exists. | 1-2h |

## Recommended Execution Order

1. Remove the client-side Gemini secret exposure.
2. Harden the backend auth flow and CORS rules.
3. Fix the Telegram deep-link base URL and the mock Firebase linking path.
4. Clean up the Firebase fallback config and shared-code duplication.
5. Tackle the GitHub fetch typing/performance issues.
6. Finish the small refactors in the utilities and Terraform.

## Notes

- The repo already has the right high-level folder boundaries in [docs/repo-structure.md](docs/repo-structure.md); the biggest improvement now is to make the shared contracts real instead of duplicated.
- Several of the P2/P3 items are small individually, but they unblock cleaner testing and safer refactors later.
