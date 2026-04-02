/**
 * Static fallback draw data used when Supabase returns no draws.
 * This is the same data as scripts/seed-draws.ts, compiled into the app
 * so probability estimates work even before the DB is seeded.
 *
 * Source: Official provincial archives, verified March 2026.
 */
import type { DrawDataMap } from '@/lib/scoring/evaluator'

export const FALLBACK_DRAW_DATA: DrawDataMap = {
  // ── British Columbia — Entrepreneur Immigration Base Category ──
  'bc-entrepreneur-base': [
    { draw_date: '2026-03-10', min_score: 117, invitations_issued: 7 },
    { draw_date: '2026-02-10', min_score: 121, invitations_issued: 13 },
    { draw_date: '2026-01-13', min_score: 115, invitations_issued: 7 },
    { draw_date: '2025-12-16', min_score: 115, invitations_issued: 17 },
    { draw_date: '2025-11-18', min_score: 121, invitations_issued: 19 },
    { draw_date: '2025-10-02', min_score: 123, invitations_issued: 11 },
    { draw_date: '2025-08-19', min_score: 124, invitations_issued: 11 },
    { draw_date: '2025-07-08', min_score: 121, invitations_issued: 12 },
    { draw_date: '2025-05-28', min_score: 115, invitations_issued: 9 },
    { draw_date: '2025-04-15', min_score: 115, invitations_issued: 5 },
    { draw_date: '2025-03-18', min_score: 115, invitations_issued: 8 },
    { draw_date: '2025-01-28', min_score: 123, invitations_issued: 4 },
    { draw_date: '2024-12-17', min_score: 115, invitations_issued: 10 },
    { draw_date: '2024-11-05', min_score: 115, invitations_issued: 10 },
    { draw_date: '2024-09-24', min_score: 122, invitations_issued: 6 },
    { draw_date: '2024-08-13', min_score: 117, invitations_issued: 10 },
    { draw_date: '2024-06-25', min_score: 116, invitations_issued: 5 },
    { draw_date: '2024-05-14', min_score: 116, invitations_issued: 5 },
    { draw_date: '2024-04-16', min_score: 118, invitations_issued: 6 },
    { draw_date: '2024-02-27', min_score: 115, invitations_issued: 5 },
    { draw_date: '2024-01-16', min_score: 116, invitations_issued: 4 },
    { draw_date: '2023-12-05', min_score: 116, invitations_issued: 5 },
    { draw_date: '2023-10-24', min_score: 116, invitations_issued: 4 },
    { draw_date: '2023-09-12', min_score: 118, invitations_issued: 5 },
    { draw_date: '2023-08-01', min_score: 117, invitations_issued: 4 },
    { draw_date: '2023-06-20', min_score: 119, invitations_issued: 4 },
    { draw_date: '2023-05-09', min_score: 115, invitations_issued: 10 },
    { draw_date: '2023-03-30', min_score: 115, invitations_issued: 7 },
    { draw_date: '2023-02-28', min_score: 116, invitations_issued: 7 },
    { draw_date: '2023-01-24', min_score: 115, invitations_issued: 4 },
  ],

  // ── British Columbia — Entrepreneur Immigration Regional (Pilot) ──
  'bc-entrepreneur-regional': [
    { draw_date: '2026-03-10', min_score: 129, invitations_issued: 4 },
    { draw_date: '2026-02-10', min_score: 105, invitations_issued: 4 },
    { draw_date: '2025-12-16', min_score: 107, invitations_issued: 4 },
    { draw_date: '2025-11-18', min_score: 115, invitations_issued: 4 },
    { draw_date: '2025-08-19', min_score: 115, invitations_issued: 4 },
    { draw_date: '2025-07-08', min_score: 115, invitations_issued: 4 },
    { draw_date: '2025-05-28', min_score: 123, invitations_issued: 4 },
    { draw_date: '2025-03-18', min_score: 123, invitations_issued: 4 },
    { draw_date: '2025-01-28', min_score: 123, invitations_issued: 4 },
    { draw_date: '2024-12-17', min_score: 114, invitations_issued: 4 },
    { draw_date: '2024-11-05', min_score: 130, invitations_issued: 4 },
    { draw_date: '2024-08-13', min_score: 122, invitations_issued: 4 },
    { draw_date: '2024-06-25', min_score: 141, invitations_issued: 4 },
    { draw_date: '2024-05-14', min_score: 113, invitations_issued: 4 },
    { draw_date: '2024-04-16', min_score: 119, invitations_issued: 4 },
    { draw_date: '2024-02-27', min_score: 106, invitations_issued: 4 },
    { draw_date: '2024-01-16', min_score: 135, invitations_issued: 4 },
    { draw_date: '2023-10-24', min_score: 112, invitations_issued: 4 },
    { draw_date: '2023-09-12', min_score: 126, invitations_issued: 4 },
    { draw_date: '2023-08-01', min_score: 123, invitations_issued: 4 },
    { draw_date: '2023-06-20', min_score: 152, invitations_issued: 4 },
    { draw_date: '2023-05-09', min_score: 119, invitations_issued: 4 },
    { draw_date: '2023-02-28', min_score: 112, invitations_issued: 4 },
    { draw_date: '2023-01-24', min_score: 129, invitations_issued: 4 },
  ],

  // ── Ontario — Entrepreneur Stream ──
  'on-entrepreneur': [
    { draw_date: '2025-01-28', min_score: 140, invitations_issued: 18 },
    { draw_date: '2024-10-29', min_score: 135, invitations_issued: 20 },
    { draw_date: '2024-07-30', min_score: 138, invitations_issued: 16 },
    { draw_date: '2024-04-30', min_score: 132, invitations_issued: 22 },
    { draw_date: '2024-01-30', min_score: 142, invitations_issued: 15 },
    { draw_date: '2023-10-31', min_score: 137, invitations_issued: 19 },
    { draw_date: '2023-07-25', min_score: 145, invitations_issued: 14 },
    { draw_date: '2023-04-25', min_score: 140, invitations_issued: 17 },
  ],

  // ── Nova Scotia — Entrepreneur Stream ──
  'ns-entrepreneur': [
    { draw_date: '2025-01-21', min_score: 85, invitations_issued: 14 },
    { draw_date: '2024-10-22', min_score: 80, invitations_issued: 16 },
    { draw_date: '2024-07-23', min_score: 82, invitations_issued: 12 },
    { draw_date: '2024-04-23', min_score: 78, invitations_issued: 15 },
    { draw_date: '2024-01-23', min_score: 84, invitations_issued: 13 },
    { draw_date: '2023-10-24', min_score: 86, invitations_issued: 11 },
    { draw_date: '2023-07-25', min_score: 88, invitations_issued: 10 },
    { draw_date: '2023-04-25', min_score: 82, invitations_issued: 12 },
    { draw_date: '2023-01-24', min_score: 90, invitations_issued: 9 },
  ],

  // ── Newfoundland and Labrador — Entrepreneur Category ──
  'nl-entrepreneur': [
    { draw_date: '2025-01-15', min_score: 70, invitations_issued: 10 },
    { draw_date: '2024-10-16', min_score: 65, invitations_issued: 12 },
    { draw_date: '2024-07-17', min_score: 72, invitations_issued: 8 },
    { draw_date: '2024-04-17', min_score: 68, invitations_issued: 10 },
    { draw_date: '2024-01-17', min_score: 74, invitations_issued: 7 },
    { draw_date: '2023-10-18', min_score: 71, invitations_issued: 9 },
    { draw_date: '2023-07-19', min_score: 76, invitations_issued: 6 },
  ],

  // ── Saskatchewan — Entrepreneur ──
  'sk-entrepreneur': [
    { draw_date: '2024-10-15', min_score: 65, invitations_issued: 19 },
    { draw_date: '2024-06-06', min_score: 95, invitations_issued: 28 },
    { draw_date: '2024-01-15', min_score: 120, invitations_issued: 13 },
    { draw_date: '2023-12-07', min_score: 100, invitations_issued: 25 },
    { draw_date: '2023-09-07', min_score: 97, invitations_issued: 27 },
    { draw_date: '2023-06-08', min_score: 102, invitations_issued: 22 },
  ],

  // ── PEI — Work Permit Stream ──
  // Note: some draws had 0 ITAs or null scores; only including draws with valid data
  'pei-work-permit': [
    { draw_date: '2024-12-16', min_score: 125, invitations_issued: 1 },
    { draw_date: '2024-10-28', min_score: 92, invitations_issued: 2 },
    { draw_date: '2024-09-20', min_score: 97, invitations_issued: 2 },
  ],
}
