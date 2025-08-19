# Codex Checkpoint — Vibe Frontend (Single‑Operator Control Center)

This document captures the current state, decisions, and next steps, so future work can continue smoothly.

## Summary
- Goal: Turn this Next.js app into a single‑operator “control center” to manage services (APIs, Apple App Store Connect, Stripe) from one interface with an Orchestrator/AI agent.
- Deployment target: Vercel.
- Backend DB: PostgreSQL via Drizzle ORM (`postgres-js`). Primary env var: `POSTGRES_URL`.
- Memory Service: External service proxied via `/api/memory` (secured with `MEMORY_SERVICE_SECRET`).

## Key Changes in This Session
1) Environment validation
- Added `lib/env.ts` with Zod to validate runtime envs.

2) Security headers
- Extended headers in `next.config.ts`: HSTS, CSP, X-Frame-Options, NoSniff, Referrer-Policy.

3) Apple App Store Connect integration (scaffold)
- JWT signing via `jose`, API client, and dashboard UI.
- Files:
  - `lib/apple/appstore.ts` — signs JWT (ES256), clients for Apps/Builds/Beta Groups.
  - `app/api/appstore/apps/route.ts` — list apps.
  - `app/api/appstore/builds/route.ts` — list builds.
  - `app/api/appstore/apps/[id]/beta-groups/route.ts` — list TestFlight beta groups by app id.
  - `app/(dashboard)/dashboard/appstore/page.tsx` — dashboard tabs for Apps, Builds, TestFlight (app selector).
  - Sidebar addition: App Store link in `app/(dashboard)/dashboard/layout.tsx`.
- Env required:
  - `ENABLE_APPLE_CONNECT` (true/false), `APPLE_ISSUER_ID`, `APPLE_KEY_ID`, `APPLE_PRIVATE_KEY` (raw or base64).

4) AI Agent tools (Apple + Stripe)
- Extended `lib/ai-agent/tools.ts` with:
  - `apple_list_apps`, `apple_list_builds`, `apple_list_beta_groups`.
  - `stripe_get_portal_url` (returns Stripe customer portal link).
- Supporting API: `app/api/stripe/portal/route.ts`.

5) Rate limiting (single‑user friendly)
- `lib/security/rate-limit.ts` (in‑memory sliding window).
- Enforced in `middleware.ts` for POST:
  - Sign‑in: 5/min per IP.
  - Memory API: 60/min per IP.

6) Deployment docs & env examples
- `DEPLOYMENT.md` updated with Vercel steps and envs.
- `.env.example` updated with Apple, Memory, MCP, and `POSTGRES_URL`.

## Orchestrator & AI Agent
- Orchestrator (`lib/orchestrator/service.ts`, `components/orchestrator/OrchestratorInterface.tsx`):
  - Supports memory commands (search/create/list/stats), UI navigation, service health checks, MCP connect/status/tools.
  - Shows service/MCP status badges.
- AI Agent (`lib/ai-agent/*`):
  - Tool calling; prefers MCP when available, falls back to REST.
  - Now includes Apple and Stripe tools listed above.

## Database & Auth
- DB: PostgreSQL via Drizzle; schema in `lib/db/schema.ts` for users/teams/invitations/activity_logs.
- Auth: Cookie JWT (jose) with bcrypt; `middleware.ts` protects `/dashboard` and refreshes session on GET.
- Single‑user posture: Works today; “team” artifacts remain but can be suppressed later via an “Owner Mode”.

## Stripe
- Checkout session (`createCheckoutSession`) and customer portal (`createCustomerPortalSession`) implemented.
- New endpoint: `GET /api/stripe/portal` returns portal URL for the current user’s team.

## Remote History & Branches
- Local `main` now ahead of `origin/main` (committed changes in this session).
- `origin/deploy` points at 854d1b4 (MCP integration) — last known remote checkpoint.
- `origin/ai_main_f9ff7d90cd3e` contains Supabase auth work divergent from current cookie‑JWT approach.
- Recommendation: Stay on cookie‑JWT for single‑user simplicity; evaluate Supabase later in a feature branch.

## Environment Variables (Production on Vercel)
- Required:
  - `POSTGRES_URL`, `AUTH_SECRET`, `BASE_URL`
- Memory Service:
  - `MEMORY_SERVICE_URL`, `MEMORY_SERVICE_SECRET`, `NEXT_PUBLIC_MEMORY_API_URL=/api/memory`
- MCP (optional):
  - `NEXT_PUBLIC_ENABLE_MCP=true`, `NEXT_PUBLIC_MCP_MODE=auto`,
  - `NEXT_PUBLIC_MCP_SERVER_URL` (local dev) or `NEXT_PUBLIC_GATEWAY_URL` (remote)
- Stripe (optional):
  - `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- Apple (optional):
  - `ENABLE_APPLE_CONNECT=true`, `APPLE_ISSUER_ID`, `APPLE_KEY_ID`, `APPLE_PRIVATE_KEY`

## Sanity Checklist
- Apple: Set envs → open `/dashboard/appstore` → AI tool `apple_list_apps`.
- Memory: `/api/memory` GET/POST via proxy; test Orchestrator commands; confirm MCP badge.
- Stripe: Ensure `stripeCustomerId` on your team; use dashboard Manage Subscription or `stripe_get_portal_url` tool.
- Auth: Sign up once; session refresh works on GET; middleware redirects correctly.
- CSP: Confirm no blocked resources in browser console; whitelist new origins if needed.

## Phased Plan & Status
- Phase 0 — Verify & Align: completed.
- Phase 1 — DB & Migrations: provision Postgres; run `npm run db:generate && npm run db:migrate` for prod.
- Phase 2 — Security: headers in place; basic rate limiting added; CSRF acceptable via server actions; consider route‑level tokens if adding form POSTs.
- Phase 3 — Observability: pending (add Sentry/Datadog, Vercel Analytics).
- Phase 4 — Memory/MCP hardening: pending (confirm CORS, secrets, and timeouts in memory service).
- Phase 5 — Apple/TestFlight UI: completed (apps/builds/groups list); can extend with testers, submissions.
- Phase 6 — Vercel Deploy: pending (configure envs; connect repo; build).
- Phase 7 — Post‑Deploy Checks: pending (CSP, auth/session, Stripe webhooks).

## Known Gaps / Risks
- Rate limiting is in‑memory per instance (stateless). For durability, add Redis/Upstash.
- Owner Mode (hide team/members) not yet implemented.
- CSP is conservative; adjust if adding third‑party scripts.
- Type‑check locally may error against `.next/types` in this environment; CI install fixes that.

## Next Candidates
- Add Owner Mode toggle to simplify UI for single user.
- Redis‑backed rate limiting.
- Extend AI agent + orchestrator intent parsing for Apple/Stripe (e.g., “show latest builds for <app>”, “open billing portal”).
- Observability (Sentry) + error boundaries for critical pages.

---
Authored by Codex session to mark this checkpoint.
