# GenesisLink PNP Assessment Tool — Project State

**Last verified:** 2026-04-28 — `feat/pnp-assessment` HEAD [`3e2d972`](https://github.com/rezaarash-arch/PNP/commit/3e2d972) (2026-04-08, auto-email reports + PDF letterhead). Repo unchanged since 2026-04-08; tool is in steady-state production with all 21 PNP entrepreneur streams scored, AI analysis live, and Resend email delivery wired.
**Scope:** PNP Assessment Tool — eligibility scoring + AI analysis + branded PDF report + auto-emailed delivery for the 21 provincial entrepreneur immigration streams across Canada.

> This is the single source of truth for "what's done / what's left" on the **PNP repo specifically**. The marketing site has its own [`PROJECT_STATE.md`](https://github.com/rezaarash-arch/GenesisLink/blob/main/docs/PROJECT_STATE.md) — do not confuse the two. A new Claude session should read this file **before** re-listing commits, re-extracting design docs, or re-discovering the architecture. Update per the protocol below.

---

## 0. Quick start (for a new session)

**You are continuing work on the PNP Assessment Tool**, the TypeScript Next.js app deployed at https://assessment.genesislink.ca. It is its own repo — separate from the marketing site.

1. **Read this file** end-to-end (~10 min). Then read [`CLAUDE.md`](../CLAUDE.md) at repo root for repo-specific norms.
2. **Repo selection** — if the task is not in this list, you might be in the wrong repo:
   - Anything under `/assessment/*` (questionnaire, results, dashboard, contact, report)
   - Eligibility scoring engine (`lib/scoring/`), 21 PNP rule files (`lib/data/rules/`)
   - AI analysis (`lib/ai/`, `app/api/assessment/analyze`)
   - PDF intelligence report (`lib/pdf/`, `@react-pdf/renderer`)
   - Email delivery (`lib/email/`, Resend, `app/api/assessment/send-report`)
   - Provincial scrapers + crons (`lib/pipeline/scrapers/`, `vercel.json` crons)
   - Supabase schema (`supabase/migrations/`)
   - Admin pipeline UI (`app/admin/*`)

   **NOT here** (marketing site lives at [`rezaarash-arch/GenesisLink`](https://github.com/rezaarash-arch/GenesisLink)): `<ChatWidget>`, `/business-consulting`, `/insights` blog, Helena bridge, Sanity, the `/api/contact` + `/api/careers` form handlers.
3. **Where to look without re-discovering:**
   - §1 = architecture (stack, deploy, data flow)
   - §2 = source design + plan docs
   - §3 = current feature inventory (what the tool actually does end-to-end)
   - §4 = data model (21 PNP streams + scoring contract)
   - §5 = environment variables + Vercel config
   - §6 = "what's left" punch list
   - §7 = live-tool smoke check
   - §8 = changelog
4. **Commit identity is enforced** — must be `rezaarash-6824 <reza.arash@genesislink.ca>` or Vercel rejects the deploy:
   ```bash
   git config user.name  "rezaarash-6824"
   git config user.email "reza.arash@genesislink.ca"
   ```
5. **Use explicit `git add <files>`**, not `git commit -am`, when a commit creates new files. `-am` silently drops untracked files and ships broken builds.
6. **Update protocol — after any task that changes user-visible behavior, scoring, or schema:**
   - Append a dated bullet to §8 Changelog
   - Update the relevant section in §3 if a feature was added/removed
   - Bump the **Last verified** line at top of file
   - Commit the doc update **atomically with** the code change — never let state drift

**Live URL:** [assessment.genesislink.ca](https://assessment.genesislink.ca)
**Marketing-site cross-link:** assessment is reached via CTAs on [genesislink.ca](https://genesislink.ca); GA4 cross-domain linker is wired so analytics flow as one funnel.

**Operator (Reza) decisions to know up front:**
- **Resend** sends the auto-email assessment report (`info@genesislink.ca` → candidate, BCC ops). Sender domain `genesislink.ca` is DKIM-verified.
- The `ANTHROPIC_API_KEY` on this Vercel project is **separate from** the marketing-site project's key. Not interchangeable — both projects need their own.
- **Federal programs are out of scope.** PNP only (21 provincial entrepreneur streams). Federal SUV + self-employed live as JSON rule files in `lib/data/rules/` for legacy reasons but are NOT shown in results.
- **80% business-plan score estimator**: scoring categories tied to "Business Concept" / "Business Plan" auto-grant 80% of max as an estimate, with a footnote that GenesisLink's business-development services are factored in. Do not "fix" this — it's intentional product behavior.
- **AI disclosure**: PDF + web results both show that AI was used to generate the analysis. Do not remove the disclosure (the marketing-site Helena posts hide it; this tool does not).

---

## 1. Architecture

| Aspect | Detail |
|---|---|
| Repo | [`rezaarash-arch/PNP`](https://github.com/rezaarash-arch/PNP) — local remote `pnp` |
| Branch | `feat/pnp-assessment` (long-lived feature branch; `main` carries the latest merge via PR #19) |
| Stack | Next.js 16.1.6 (App Router, TypeScript), React 19, Tailwind 4 |
| Persistence | Supabase (assessments + draws + programs); optional — tool degrades gracefully when env vars are absent (see §5) |
| AI | `@anthropic-ai/sdk@^0.80.0` — `claude-sonnet-4-20250514` for analysis (model pinned, see §8 entry 2026-04-06) |
| PDF | `@react-pdf/renderer@^4.3.2` for the intelligence report (server-side, with letterhead + watermark) |
| Email | `resend@^6.10.0` for transactional report delivery |
| Validation | Zod 4 schemas in `lib/validation/schemas.ts` — input contract for `POST /api/assessment/compute` |
| Rules engine | `json-logic-js@^2.0.5` — declarative eligibility rules, one JSON file per program in `lib/data/rules/` |
| Tests | Vitest (unit) + Playwright (e2e), happy-dom DOM emulation, axe accessibility checks |
| Logging | `pino@^10.3.1` (structured JSON) |
| Sessions | AES-encrypted resume tokens (`lib/session/crypto.ts`) — candidate can pause + resume questionnaire |
| Rate limiting | In-process token bucket (`lib/middleware/rate-limiter.ts`) |
| Cron jobs | 11 daily/biweekly Vercel crons (see §1.1) |
| Deploy | Vercel (separate project from the marketing site) |
| Production URL | https://assessment.genesislink.ca |

### 1.1 Cron schedule (`vercel.json`)

| Path | Schedule | Purpose |
|---|---|---|
| `/api/pipeline/scrape/{bc,ab,mb,nb,ns,nl,pe,nt,yt}` | `0 2 * * *` (daily 02:00 UTC) | Scrape provincial PNP program pages for changes |
| `/api/cleanup` | `0 3 * * *` (daily 03:00 UTC) | Delete expired session tokens + old draft assessments |
| `/api/pipeline/research` | `0 4 1,15 * *` (1st + 15th of month, 04:00 UTC) | AI agent re-researches PNP trends + draw patterns biweekly |

Ontario + Quebec scrapers exist as scaffolding but are not in the cron list — ON-PNP entrepreneur stream changes are typically annual; QC has no PNP entrepreneur stream.

### 1.2 Request flow (happy path)

```
Candidate fills /assessment/questionnaire (multi-step React form)
   ↓
   ├─ optional: POST /api/assessment/save → encrypted resume token in localStorage
   ↓
On submit → POST /api/assessment/compute
   ├─ Zod validates UserProfile
   ├─ evaluateAllPrograms(profile, drawData) iterates 21 PNP programs:
   │     - load lib/data/rules/<prog>.json
   │     - apply json-logic eligibility filter
   │     - score via lib/scoring/{evaluator,jsonlogic,probability,sensitivity}.ts
   │     - 80% estimator on Business Concept / Business Plan categories
   │     - estimate ineligibility insights (barriers + feasibility + suggestion)
   ↓
Results saved → POST /api/assessment/save (Supabase if configured)
   ↓
Redirect to /assessment/results — renders eligible programs, scores, gaps
   ↓
Candidate hits /assessment/contact → POST /api/assessment/send-report:
   ├─ render PDF via lib/pdf/intelligence-report.tsx (with letterhead)
   ├─ Resend.send( admin_notification + branded_html_to_candidate + PDF attachment )
   ↓
Optional: AI deep-dive via POST /api/assessment/analyze
   ├─ Anthropic Sonnet 4 with full PNP eligibility criteria embedded in prompt
   ├─ returns IneligibilityInsight[] + program-by-program qualitative analysis
```

---

## 2. Source design + plan docs

| Doc | Purpose |
|---|---|
| [`docs/plans/2026-03-05-pnp-assessment-tool-design.md`](plans/2026-03-05-pnp-assessment-tool-design.md) | Original tool design — UX flow, scoring contract, program coverage |
| [`docs/plans/2026-03-05-pnp-assessment-implementation-plan.md`](plans/2026-03-05-pnp-assessment-implementation-plan.md) | 31-task implementation plan (all phases now complete) |
| [`docs/plans/2026-03-29-ai-intelligence-agent-design.md`](plans/2026-03-29-ai-intelligence-agent-design.md) | AI Intelligence Agent design — biweekly research crons, dark-theme dashboard |
| [`docs/plans/2026-03-29-ai-intelligence-agent-plan.md`](plans/2026-03-29-ai-intelligence-agent-plan.md) | AI Intelligence Agent build plan |

The 31-task original plan is **complete** (Phases 1–5 shipped pre-2026-04-02). Everything shipped after 2026-04-02 is post-plan production iteration — see §3.

---

## 3. Feature inventory (what ships today)

### 3.1 Candidate-facing routes

| Route | Purpose | Notes |
|---|---|---|
| `/` | Marketing landing for the tool | Title *"PNP Assessment \| GenesisLink"*, headline *"Find Your Best Path to Canadian Entrepreneurship"*, scope copy *"21 entrepreneur streams"* |
| `/assessment` | Tool entry point | Redirects to `/assessment/questionnaire` (or `/assessment/resume?t=…` if resume token present) |
| `/assessment/questionnaire` | Multi-step form (profile, finances, business, intent) | Save-and-resume via encrypted token; Zod-validated client + server |
| `/assessment/results` | Eligibility scorecards + "Why You Don't Qualify (Yet)" section | Per-program score, eligibility verdict, gap analysis with feasibility (achievable / difficult / impractical) + suggestions |
| `/assessment/contact` | Lead capture + consent for report email | On submit, fires `/api/assessment/send-report` |
| `/assessment/report` | On-screen rendition of the PDF report | Same data shape as the emailed PDF |
| `/assessment/dashboard` | AI Intelligence dashboard (premium dark theme) | Biweekly-refreshed PNP trends, recent draws, program-change alerts |
| `/assessment/review` | Re-review previously-saved assessment | Loads saved profile, re-runs compute |

### 3.2 API routes (`app/api/`)

| Route | Method | Purpose |
|---|---|---|
| `/api/assessment/compute` | POST | Zod-validated scoring across all 21 PNP programs; returns `ProgramResult[]` + disclaimer |
| `/api/assessment/analyze` | POST | Anthropic Sonnet 4 deep analysis — full eligibility criteria embedded in prompt; returns `IneligibilityInsight[]` |
| `/api/assessment/save` | POST | Save draft to Supabase (or no-op if env not configured) |
| `/api/assessment/resume` | GET | Decrypt resume token + reload draft |
| `/api/assessment/pdf` | GET | Stream the basic React-PDF report |
| `/api/assessment/report/pdf` | GET | Stream the **intelligence** report (with letterhead + watermark + ineligibility section) |
| `/api/assessment/send-report` | POST | Render intelligence PDF + Resend.send (admin notification + branded HTML to candidate + PDF attachment) |
| `/api/programs` | GET | Public catalog of the 21 PNP programs |
| `/api/admin/review-queue` | GET | Admin-only: scraped programs awaiting human review |
| `/api/cleanup` | POST | Cron-triggered: prune expired sessions + old drafts (gated by `CRON_SECRET` header) |
| `/api/pipeline/scrape/[province]` | POST | Cron-triggered per-province scraper (gated by `CRON_SECRET`) |
| `/api/pipeline/research` | POST | Cron-triggered biweekly AI research agent (gated by `CRON_SECRET`) |

### 3.3 Admin routes

| Route | Purpose | Auth |
|---|---|---|
| `/admin/programs` | View + edit PNP program catalog | `ADMIN_PASSWORD` env var |
| `/admin/pipeline` | Review scraper outputs, approve detected changes | `ADMIN_PASSWORD` env var |

### 3.4 Scoring engine (`lib/scoring/`)

| File | Purpose |
|---|---|
| `engine.ts` | Top-level entry: `evaluateAllPrograms(profile, drawData) → ProgramResult[]` |
| `evaluator.ts` | Per-program eligibility + scoring orchestration |
| `jsonlogic.ts` | json-logic-js wrapper for rule evaluation |
| `pathways.ts` | Pathway recommendation logic (which program best matches the profile) |
| `probability.ts` | Probabilistic scoring (e.g. CRS-style draw probability where applicable) |
| `sensitivity.ts` | Sensitivity analysis — what's the smallest change to flip a verdict |
| `__fixtures__/` | 5 candidate fixtures (graduate, high-net-worth-low-exp, ineligible-all, minimal, strong) for snapshot tests |

Test coverage: `engine.test.ts`, `evaluator.test.ts`, `jsonlogic.test.ts`, `pathways.test.ts`, `probability.test.ts`, `sensitivity.test.ts`, `__fixtures__/fixtures.test.ts` — all green.

### 3.5 PDF report (`lib/pdf/`)

| File | Purpose |
|---|---|
| `generator.tsx` | Basic results PDF (legacy; kept for `/api/assessment/pdf`) |
| `intelligence-report.tsx` | Branded intelligence report — GenesisLink letterhead header + footer, watermark, eligibility scores, ineligibility insights, AI analysis. Used by `/api/assessment/report/pdf` and the auto-email flow |

Letterhead assets: `public/letterhead-header.png` + `public/letterhead-footer.png`.

### 3.6 Email (`lib/email/`)

| File | Purpose |
|---|---|
| `send-report.ts` | Resend client + send-report function (60 lines) |
| `templates/report-email.ts` | 223-line branded HTML email template (candidate-facing) |

Triggered from `app/api/assessment/send-report/route.ts` after the candidate consents on `/assessment/contact`. Sends two emails: an admin notification to ops + a polished branded confirmation to the candidate, with the intelligence PDF attached.

### 3.7 AI module (`lib/ai/`)

| File | Purpose |
|---|---|
| `client.ts` | Anthropic SDK wrapper (model pinned, see §8 entry 2026-04-06) |
| `analyze.ts` | Per-assessment deep analysis — embeds full eligibility criteria for each PNP program in the prompt for accuracy (see §8 entry 2026-04-07) |
| `research.ts` | Biweekly research agent — pulls PNP changes, draw patterns, regulatory updates |
| `types.ts` | `IneligibilityInsight` type (`programId`, `barriers[]`, `feasibility`, `suggestion`) + analysis result types |

---

## 4. Data model

### 4.1 21 PNP entrepreneur streams (in `lib/data/rules/`)

| Province | Streams | Files |
|---|---|---|
| Alberta | 4 | `ab-farm`, `ab-foreign-graduate`, `ab-graduate-entrepreneur`, `ab-rural-entrepreneur` |
| British Columbia | 3 | `bc-entrepreneur-base`, `bc-entrepreneur-regional`, `bc-entrepreneur-strategic` |
| Manitoba | 2 | `mb-entrepreneur`, `mb-farm-investor` |
| New Brunswick | 2 | `nb-entrepreneurial`, `nb-post-grad` |
| Newfoundland & Labrador | 2 | `nl-entrepreneur`, `nl-graduate-entrepreneur` |
| Nova Scotia | 2 | `ns-entrepreneur`, `ns-graduate-entrepreneur` |
| Northwest Territories | 1 | `nwt-business` |
| Ontario | 1 | `on-entrepreneur` |
| Prince Edward Island | 1 | `pei-work-permit` |
| Saskatchewan | 2 | `sk-entrepreneur`, `sk-graduate-entrepreneur` |
| Yukon | 1 | `yk-business-nominee` |
| **Federal** (legacy, **NOT shown in results**) | 2 | `fed-self-employed`, `fed-start-up-visa` |

Total displayed in results: **21 PNP streams** (federal-removed scope per [`56e7b88`](https://github.com/rezaarash-arch/PNP/commit/56e7b88)).

### 4.2 Rule-file schema

Each `lib/data/rules/<program>.json` contains:
- `id`, `name`, `province`, `programType`, `url`
- `eligibility`: json-logic predicate evaluated against the user profile
- `scoring`: per-category weights + max scores (Business Concept, Net Worth, Experience, Language, etc.)
- `requirements`: human-readable list rendered in the PDF + AI prompt
- `lastVerified` + `source` for audit trail

### 4.3 Supabase schema

Single migration: `supabase/migrations/001_initial_schema.sql`. Tables:
- `assessments` — saved drafts + completed evaluations (encrypted PII)
- `programs` — synced from `lib/data/rules/` for admin editing + scraper diffs
- `draws` — historical PNP draw data per program (where available)

Tool degrades gracefully if Supabase env vars are absent (see §8 entry 2026-04-02 [`7a2017d`](https://github.com/rezaarash-arch/PNP/commit/7a2017d), [`795709c`](https://github.com/rezaarash-arch/PNP/commit/795709c)).

---

## 5. Environment variables (Vercel)

From `.env.local.example`:

| Var | Required for | Notes |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Persistence | Optional — tool runs without it (no save/resume) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Persistence | Optional |
| `SUPABASE_SERVICE_ROLE_KEY` | Admin + cron writes | Optional |
| `SESSION_ENCRYPTION_KEY` | Save-and-resume tokens | AES — generate a fresh 32-byte hex key per environment |
| `CRON_SECRET` | All `/api/pipeline/*` + `/api/cleanup` crons | Vercel cron jobs send this in the `Authorization` header |
| `ADMIN_PASSWORD` | `/admin/*` routes | Single-user gate |
| `ALERT_EMAIL` | Cron failure notifications | Where the cron error report goes |
| `ASSESSMENT_ENABLED` | Feature flag (default `false`) | Set to `"true"` in production |

**Not in `.env.local.example` but required in production:**
| Var | Required for | Source |
|---|---|---|
| `ANTHROPIC_API_KEY` | AI analysis + biweekly research | Anthropic console — **separate key from the marketing-site Vercel project** |
| `RESEND_API_KEY` | Auto-email of assessment reports | Resend dashboard — sender `info@genesislink.ca` already DKIM-verified |

---

## 6. What's left

### Operator / Vercel config (no code)

| Action | Why |
|---|---|
| Confirm `ANTHROPIC_API_KEY` is set on the **PNP Vercel project** | Required for `/api/assessment/analyze` + the biweekly `/api/pipeline/research` cron. Distinct from the marketing-site key. |
| Confirm `RESEND_API_KEY` is set on the **PNP Vercel project** | Required for `/api/assessment/send-report` auto-email. Distinct from any other project's key. |
| Verify `vercel.json` cron schedule matches expectations | 9 provincial scrapers + cleanup + biweekly research. `CRON_SECRET` must be set or all crons return 401. |

### Future engineering (when scheduled)

| Item | Estimate |
|---|---|
| Add Quebec entrepreneur program if/when QC introduces one | Net-new — currently no PNP entrepreneur stream in QC |
| Wire the Ontario + Quebec scrapers into `vercel.json` | ~10 min config change once ON-PNP entrepreneur stream changes are worth daily polling |
| Migrate scoring tests from fixtures-only to property-based (fast-check) | ~half day; would catch off-by-one edge cases the 5 fixtures miss |
| Re-tune AI prompt as new programs launch | Ongoing — each new program needs its eligibility criteria added to the prompt for accuracy (per [`9858af9`](https://github.com/rezaarash-arch/PNP/commit/9858af9) pattern) |
| Consider adding French UI translation | Not in original review; would mirror the marketing-site G7 work |

### Out-of-scope (deliberate)

- **Federal programs** — removed per [`56e7b88`](https://github.com/rezaarash-arch/PNP/commit/56e7b88); rule files retained in `lib/data/rules/` but not displayed.
- **Atlantic Immigration Program** — federal, not PNP; out of scope.
- **Express Entry / CRS** — federal, not PNP; out of scope.
- **Real-time draw data scraping for every program** — many provinces don't publish draws on a predictable schedule; we use `lib/data/draws-fallback.ts` for those.

---

## 7. Live-tool smoke check (copy-paste)

```bash
# Public reachability
curl -s -o /dev/null -w "%{http_code}\n" -L https://assessment.genesislink.ca/
curl -s -o /dev/null -w "%{http_code}\n" -L https://assessment.genesislink.ca/assessment

# Marketing-site cross-domain CTAs
for url in \
  "https://genesislink.ca/" \
  "https://genesislink.ca/assessment" \
  "https://assessment.genesislink.ca/"; do
  s=$(curl -s -o /dev/null -w "%{http_code}" -L --max-time 20 "$url")
  echo "$s  $url"
done

# Confirm the PNP-only scope copy is live
curl -sL https://assessment.genesislink.ca/ | grep -i "21 entrepreneur"
```

Expected: all 200 (or 307 → 200), and the "21 entrepreneur streams" copy present.

---

## 8. Changelog

- **2026-04-02** — **Repo split.** PNP assessment tool extracted from `rezaarash-arch/GenesisLink` (where it lived as the `feat/pnp-assessment` branch) into its own dedicated repo `rezaarash-arch/PNP`. The branch on the marketing repo is now stale at `5dd145e` and should not be used. All subsequent PNP work lands here. Validation hardening shipped same day: country-code length relaxed ([`6d1670f`](https://github.com/rezaarash-arch/PNP/commit/6d1670f)), field-error alerts ([`f1d2972`](https://github.com/rezaarash-arch/PNP/commit/f1d2972)), CLB 0 → null Zod transform ([`370f8ad`](https://github.com/rezaarash-arch/PNP/commit/370f8ad)), contact-page compute error reporting ([`6001165`](https://github.com/rezaarash-arch/PNP/commit/6001165)), Supabase made optional for builds without env vars ([`7a2017d`](https://github.com/rezaarash-arch/PNP/commit/7a2017d) + [`795709c`](https://github.com/rezaarash-arch/PNP/commit/795709c)).

- **2026-04-03** — **Province-code handling.** `'no-preference'` no longer trips Zod ([`3843ffb`](https://github.com/rezaarash-arch/PNP/commit/3843ffb)); province codes validated against the canonical 13-province enum.

- **2026-04-06** — **AI model fixes + ineligibility insights.** Series of commits addressing analyze-route reliability:
  - [`8d904f6`](https://github.com/rezaarash-arch/PNP/commit/8d904f6) Surface API-key status in error responses (debug aid).
  - [`d945851`](https://github.com/rezaarash-arch/PNP/commit/d945851) Switch to `claude-sonnet-4-6` + improved error logging.
  - [`17282a7`](https://github.com/rezaarash-arch/PNP/commit/17282a7) **Revert to `claude-sonnet-4-20250514`** + expose error details. Sonnet 4.6 had a transient incompatibility with the analyze-route prompt structure; pinning to the dated Sonnet 4 release stabilized it. Model is **pinned**; do not bump without testing the analyze flow end-to-end.
  - [`1705c12`](https://github.com/rezaarash-arch/PNP/commit/1705c12) Unwrap analysis from API response envelope (the SDK's structured response shape changed mid-week).
  - [`e3c9b8f`](https://github.com/rezaarash-arch/PNP/commit/e3c9b8f) **New `IneligibilityInsight` type** — `programId`, `barriers[]`, `feasibility` (achievable / difficult / impractical), `suggestion`. AI prompt extended to populate it.
  - [`56e7b88`](https://github.com/rezaarash-arch/PNP/commit/56e7b88) **Federal programs removed from results.** Rule files retained in `lib/data/rules/` but `evaluateAllPrograms` filters them out. Ineligibility insights baked into the PDF intelligence report.
  - [`3bff65f`](https://github.com/rezaarash-arch/PNP/commit/3bff65f) **"Why You Don't Qualify (Yet)" section** added to `/assessment/results` — per-program barriers, feasibility verdict, and what to change.

- **2026-04-07** — **AI prompt accuracy fix** ([`9858af9`](https://github.com/rezaarash-arch/PNP/commit/9858af9)). Embedded the full eligibility criteria for each of the 21 PNP streams directly in the analyze-route system prompt. Prior to this, the AI was working from a summarized version and occasionally invented criteria that didn't match the rule files. Now the prompt and the rule files are the same source. **Lesson**: when an AI is reasoning over structured rules, give it the rules verbatim — abstracted summaries lose the precision the model needs.

- **2026-04-08** — **PDF letterhead + 80% business-plan estimator + auto-email delivery.**
  - [`bb94566`](https://github.com/rezaarash-arch/PNP/commit/bb94566) **GenesisLink letterhead + watermark on PDF report.** New `public/letterhead-header.png` + `letterhead-footer.png`; rendered on every page of the React-PDF intelligence report.
  - [`9db65c9`](https://github.com/rezaarash-arch/PNP/commit/9db65c9) **80% business-plan score estimator.** Scoring categories tied to "Business Concept" / "Business Plan" auto-grant 80% of max as an estimate, with a footnote on web results + PDF that GenesisLink's business-development services are factored in. **Intentional product decision** — do not "fix" this.
  - [`443036a`](https://github.com/rezaarash-arch/PNP/commit/443036a) Field-name mismatches resolved + letterhead sizing fix on PDF.
  - [`3e2d972`](https://github.com/rezaarash-arch/PNP/commit/3e2d972) **Auto-send report email with PDF attachment.** New `POST /api/assessment/send-report` route (183 lines), `lib/email/send-report.ts` (60 lines), `lib/email/templates/report-email.ts` (223 lines branded HTML). Triggered from `/assessment/contact` after consent. Sends an admin notification email to `info@genesislink.ca` (with applicant Reply-To) AND a polished branded auto-reply to the candidate, with the intelligence PDF attached. Cumulative delta since the repo split (2026-04-02): 23 files changed, +1,066 / −50 lines.

- **2026-04-28** — **Living state docs created.** Net-new `docs/PROJECT_STATE.md` (this file) + `CLAUDE.md` at repo root. Brings the PNP repo to parity with the marketing repo's documentation. README also refreshed from create-next-app boilerplate to actual project info. No code changes — docs only. Future PNP commits should append to §8 here per the update protocol in §0.
