# GenesisLink PNP Assessment Tool

**Live:** https://assessment.genesislink.ca

A Next.js 16 + TypeScript app that scores a candidate's eligibility across the **21 Canadian provincial entrepreneur immigration streams** (Provincial Nominee Programs — "PNP"), runs an AI deep-dive analysis using Anthropic's Claude Sonnet 4, generates a branded PDF intelligence report, and auto-emails the report to the candidate via Resend.

This repo is the **PNP tool only**. The marketing website at [genesislink.ca](https://genesislink.ca) lives in a separate repo: [`rezaarash-arch/GenesisLink`](https://github.com/rezaarash-arch/GenesisLink). The two share no code; they integrate via cross-domain CTAs and a shared GA4 cross-domain linker.

## Documentation

| Doc | Purpose |
|---|---|
| **[`docs/PROJECT_STATE.md`](docs/PROJECT_STATE.md)** | **Living source of truth** — what's shipped, what's intentional, what's left, full feature inventory + changelog. **Read this first.** |
| [`CLAUDE.md`](CLAUDE.md) | Repo-specific norms for Claude sessions (commit identity, push targets, hard rules, layout cheat-sheet). |
| [`docs/plans/2026-03-05-pnp-assessment-tool-design.md`](docs/plans/2026-03-05-pnp-assessment-tool-design.md) | Original tool design (UX flow, scoring contract, program coverage). |
| [`docs/plans/2026-03-05-pnp-assessment-implementation-plan.md`](docs/plans/2026-03-05-pnp-assessment-implementation-plan.md) | Original 31-task implementation plan (all phases shipped). |
| [`docs/plans/2026-03-29-ai-intelligence-agent-design.md`](docs/plans/2026-03-29-ai-intelligence-agent-design.md) | AI Intelligence Agent design (biweekly research crons, dark-theme dashboard). |
| [`docs/plans/2026-03-29-ai-intelligence-agent-plan.md`](docs/plans/2026-03-29-ai-intelligence-agent-plan.md) | AI Intelligence Agent build plan. |

## Architecture (one-pager)

- **Stack**: Next.js 16.1.6 (App Router, TypeScript), React 19, Tailwind 4
- **Persistence**: Supabase (optional — degrades gracefully without env vars)
- **AI**: `@anthropic-ai/sdk` — `claude-sonnet-4-20250514` (pinned)
- **PDF**: `@react-pdf/renderer` for the branded intelligence report
- **Email**: Resend for transactional report delivery
- **Validation**: Zod 4 input contract on `/api/assessment/compute`
- **Rules engine**: `json-logic-js` — declarative eligibility rules, one JSON file per program in `lib/data/rules/`
- **Tests**: Vitest (unit) + Playwright (e2e) + axe accessibility checks
- **Deploy**: Vercel (separate project from the marketing site)

See `docs/PROJECT_STATE.md` §1 for the full architecture table and §1.2 for the request flow diagram.

## Local development

```bash
# Install
npm install

# Copy env template + fill in Supabase / Anthropic / Resend keys (or skip Supabase to run without persistence)
cp .env.local.example .env.local

# Dev server (http://localhost:3000)
npm run dev

# Tests
npm run test          # vitest
npm run lint          # eslint
npx playwright test   # e2e (requires local server running)
```

## Deployment

Deploys to Vercel automatically on push to `feat/pnp-assessment` (the long-lived production branch). The Vercel project is **separate** from the marketing site's project — env vars must be set independently:

| Var | Required for |
|---|---|
| `ANTHROPIC_API_KEY` | AI analysis + biweekly research cron |
| `RESEND_API_KEY` | Auto-email of assessment reports |
| `SESSION_ENCRYPTION_KEY` | Save-and-resume tokens |
| `CRON_SECRET` | All `/api/pipeline/*` + `/api/cleanup` crons |
| `ADMIN_PASSWORD` | `/admin/*` routes |
| `ALERT_EMAIL` | Cron failure notifications |
| `ASSESSMENT_ENABLED` | Feature flag — set to `"true"` in production |
| `NEXT_PUBLIC_SUPABASE_URL` + `_ANON_KEY` + `SUPABASE_SERVICE_ROLE_KEY` | Optional — persistence + admin pipeline |

Cron schedule lives in `vercel.json` — 9 daily provincial scrapers + daily cleanup + biweekly AI research agent.

## Live smoke check

```bash
curl -s -o /dev/null -w "%{http_code}\n" -L https://assessment.genesislink.ca/
```

Expected: `200` and the page title `PNP Assessment | GenesisLink`.
