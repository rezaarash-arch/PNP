# CLAUDE.md — PNP Assessment Tool

> Repo-specific norms for Claude sessions working in `rezaarash-arch/PNP`. The big-picture state lives in [`docs/PROJECT_STATE.md`](docs/PROJECT_STATE.md) — read that **first**.

## What this repo is

The **GenesisLink PNP Assessment Tool** — Next.js 16 + TypeScript app deployed at https://assessment.genesislink.ca. It scores a candidate's eligibility across the 21 Canadian provincial entrepreneur immigration streams, runs an AI deep-dive analysis (Anthropic Sonnet 4), generates a branded PDF intelligence report, and auto-emails the report to the candidate via Resend.

This is a **separate codebase from the marketing site** (which lives at [`rezaarash-arch/GenesisLink`](https://github.com/rezaarash-arch/GenesisLink)). They share no code and deploy as separate Vercel projects.

## Before you do anything

1. **Read [`docs/PROJECT_STATE.md`](docs/PROJECT_STATE.md) end-to-end.** It tells you what's shipped, what's intentional, what's deliberate scope cut, and how to update the doc when you finish a task. The §0 Quick Start gets you productive in ~10 minutes.
2. **Confirm you're in the right repo.** If the task is about `<ChatWidget>`, the blog, the Helena bridge, `/business-consulting`, the `/api/contact` form, or anything Sanity-related → you want the marketing repo, not this one.
3. **Check the changelog (§8).** It's the institutional memory. Many product behaviors that look like bugs (e.g. the 80% business-plan score estimator, federal programs not appearing, the AI disclosure being shown) are deliberate decisions documented there.

## Hard rules

### Commit identity (Vercel will reject other authors)

```bash
git config user.name  "rezaarash-6824"
git config user.email "reza.arash@genesislink.ca"
```

### Push targets

- Local remote `pnp` → `rezaarash-arch/PNP` — **this is the source of truth**.
- Branch is `feat/pnp-assessment` (long-lived); `main` carries the latest merge via PR.
- **Never push to `origin`** if it points at the old `mohsen-beep` mirror.

### `git add` — be explicit

`git commit -am` silently drops untracked files and ships broken builds. When a commit creates new files (PDFs, route handlers, lib modules, rule JSONs, anything), use:

```bash
git add path/to/specific/file.ts path/to/other.json
git commit -m "..."
```

This bit us before — see the marketing-repo memory note about it.

### Tests must pass

```bash
npm run test    # vitest unit + integration
npm run lint    # eslint
npx playwright test   # e2e (only when wiring user-visible flows)
```

The scoring engine has fixture-based snapshot tests (`lib/scoring/__fixtures__/`). If you change scoring logic, update the affected fixtures **deliberately** — don't let a snapshot diff slip in unreviewed.

### Don't bump the AI model without testing the analyze flow

The Anthropic model is **pinned** in `lib/ai/client.ts` to `claude-sonnet-4-20250514`. There's a §8 changelog entry from 2026-04-06 documenting why we reverted from `claude-sonnet-4-6` (transient compatibility issue with the analyze-route prompt). If you bump the model, run the full `/api/assessment/analyze` flow end-to-end against a real candidate fixture before pushing.

## Atomic doc updates

When you finish a task that changes user-visible behavior, scoring, schema, or AI behavior:

1. Append a dated bullet to [`docs/PROJECT_STATE.md`](docs/PROJECT_STATE.md) §8 Changelog.
2. Update the relevant section in §3 (feature inventory) if you added/removed a feature.
3. Bump the **Last verified** line at the top of `PROJECT_STATE.md` to today's date + new HEAD SHA.
4. Commit the doc update **in the same commit** as the code change. Never let state drift.

## Known intentional behaviors (do NOT "fix" these)

- **Federal programs are filtered out of results** ([`56e7b88`](https://github.com/rezaarash-arch/PNP/commit/56e7b88)). The rule files (`fed-self-employed.json`, `fed-start-up-visa.json`) are kept on disk but `evaluateAllPrograms` excludes them. PNP-only is the product scope.
- **80% business-plan score estimator** ([`9db65c9`](https://github.com/rezaarash-arch/PNP/commit/9db65c9)). Business Concept / Business Plan scoring categories auto-grant 80% of max with a footnote that GenesisLink's services are factored in. This is product-by-design, not a bug.
- **AI analysis is disclosed in the PDF + on web results.** The marketing site hides AI disclosure on Helena posts; this tool does NOT. They're different products with different disclosure norms.
- **Supabase is optional.** The tool degrades gracefully when Supabase env vars are absent — save/resume just becomes no-ops. Don't add `Supabase env required` checks at the route level; the helpers in `lib/db/` already handle the missing-config case.

## Project layout (cheat-sheet)

```
app/
├─ assessment/         # candidate-facing UI (questionnaire, results, contact, report, dashboard, review)
├─ admin/              # admin pipeline UI (programs catalog, scraper review queue)
├─ api/
│  ├─ assessment/      # compute, analyze, save, resume, pdf, send-report
│  ├─ pipeline/        # cron-triggered scrapers + biweekly research agent
│  ├─ admin/           # admin-only review queue
│  ├─ programs/        # public catalog
│  └─ cleanup/         # cron-triggered cleanup
lib/
├─ scoring/            # eligibility engine, evaluators, json-logic wrapper, sensitivity, fixtures
├─ ai/                 # Anthropic SDK client, analyze, biweekly research, types (IneligibilityInsight)
├─ data/rules/         # 21 PNP stream eligibility rules (json-logic)
├─ db/                 # Supabase wrappers (assessments, draws, programs)
├─ email/              # Resend client + branded HTML templates
├─ pdf/                # @react-pdf/renderer — basic + intelligence reports (with letterhead)
├─ pipeline/           # Provincial scrapers + change detection + normalization
├─ session/            # AES-encrypted resume tokens
├─ types/              # Assessment, Program, Results TS types
├─ middleware/         # In-process rate limiter
└─ validation/         # Zod schemas (the input contract for compute)
supabase/migrations/    # Single migration: 001_initial_schema.sql
docs/plans/             # Original design + implementation plans (Phases 1-5 done)
public/                 # Letterhead PNGs + favicons
```

## When in doubt

Read [`docs/PROJECT_STATE.md`](docs/PROJECT_STATE.md). If the answer isn't there, check the §8 Changelog. If it's still not there, the answer is "ask before changing it."
