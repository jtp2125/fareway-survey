# Fareway Survey — Build Status

**Last updated:** February 26, 2026  
**Status:** Foundation complete, survey pages in progress

---

## What's Done

### Infrastructure (100%)
- [x] Supabase database schema — all 4 tables created and populated
  - `respondents` (207 columns)
  - `retailer_fill_counts` (15 rows seeded)
  - `segment_quotas` (5 rows seeded)
  - `zip_lookup` (369 ZIPs seeded)
- [x] RPC functions: `least_fill_select()` and `check_and_increment_quota()`
- [x] Row Level Security policies
- [x] Next.js 14 project scaffold (App Router + TypeScript + Tailwind)
- [x] Supabase clients (browser + server-side with service role key)
- [x] Environment variables template (`.env.local`)

### API Routes (100%)
- [x] `POST /api/survey/init` — creates respondent record, detects device, checks duplicates
- [x] `POST /api/survey/submit-block` — saves block data, updates current_block
- [x] `POST /api/survey/terminate` — marks terminated, records timestamp + duration
- [x] `POST /api/survey/complete` — marks complete, computes QC flags + duration
- [x] `POST /api/survey/check-quota` — atomic segment quota check + increment
- [x] `POST /api/survey/assign-retailers` — least-fill R1/R2/R3 assignment
- [x] `POST /api/zip-lookup` — validates ZIP against trade area

### Library / Utilities (100%)
- [x] `lib/constants.ts` — all retailers, attributes, scales, signposts, termination messages, CSV column order
- [x] `lib/segment-logic.ts` — segment classification, all collapse functions, NPS category
- [x] `lib/randomize.ts` — Fisher-Yates shuffle with anchor support
- [x] `lib/quality-flags.ts` — speeder, straightliner, gibberish detection
- [x] `lib/device-detect.ts` — UA-based mobile/tablet/desktop detection
- [x] `lib/supabase.ts` + `lib/supabase-server.ts` — client initialization

### Shared Components (100%)
- [x] `ProgressBar` — thin bar, 0-100% driven by block weights
- [x] `SignpostScreen` — yellow background transition screen
- [x] `QuestionWrapper` — standard question layout with number, text, error
- [x] `SingleSelect` — radio button cards
- [x] `MultiSelect` — checkbox cards with exclusive option support + max selections
- [x] `NPSScale` — 0-10 horizontal button row with endpoint labels
- [x] `RatingScale` — 1-5 button row (for K1/K2)
- [x] `OpenEndedText` — textarea with min/max character counter
- [x] `globals.css` — Tailwind setup, Inter font, custom radio/checkbox/button styles

### Survey Pages (Partial)
- [x] `/survey` — entry point (reads URL params, creates record, redirects)
- [x] `/survey/consent` — consent screen with Begin Survey button
- [x] `/survey/block1/s1` — ZIP code with signpost, validation, termination
- [x] `/survey/block1/s2` — decision-maker with termination on "no"
- [x] `/survey/thankyou` — completion screen, triggers `/api/survey/complete`
- [x] `/survey/terminated` — dynamic termination message based on reason code

### Verified Working
- [x] Full flow: entry → consent → S1 → S2 tested end-to-end
- [x] ZIP validation against Supabase zip_lookup table
- [x] Termination on invalid ZIP (S1) — writes to DB, shows message
- [x] Termination on non-decision-maker (S2)
- [x] Duplicate respondent_id rejection
- [x] Database writes confirmed in Supabase Table Editor

---

## What's Remaining

### Survey Pages — Block 1 (Screener)
- [ ] `/survey/block1/s3` — Consideration funnel matrix (15 retailers × 6 options)
  - Desktop: full grid. Mobile: 3 retailers per card (5 screens)
  - Randomize retailer rows, "Other" anchored last
  - "Other" shows text input when selected
  - Terminate if no retailer has funnel >= 5
  - See engineering plan Section 6 for full option text and retailer codes
- [ ] `/survey/block1/s4` — Share of wallet 100% allocation
  - Show only retailers where funnel = 6
  - Plus "All other stores" anchored last
  - Desktop: sliders + numeric. Mobile: stacked inputs + sticky total bar
  - Must sum to exactly 100%
  - Derive: primary_store, sow_store1/2/3, segment classification
  - See engineering plan Section 6 for derivation logic
- [ ] `/survey/block1/s4a` — Frequency matrix for top 3 SOW stores
  - 4 frequency options per store
  - See engineering plan Section 6
- [ ] `/survey/block1/s5` — Historical switching yes/no
  - If yes → S5a. If no → S6.
- [ ] `/survey/block1/s5a` — Which stores reduced (multi-select, conditional)
- [ ] `/survey/block1/s6` — Income band (terminate on "prefer not to say")
- [ ] `/survey/block1/s7` — Age cohort (terminate on under 18 or "prefer not to say")
- [ ] `/survey/block1/s8` — Household type
  - **POST-S8 CRITICAL:** derive collapsed demographics, check segment quota,
    assign R1/R2/R3 via least-fill, then advance to Block 2

### Survey Pages — Block 2 (NPS)
- [ ] `/survey/block2` — NPS loop for R1, R2, R3
  - N1 (0-10 scale) + N2 (verbatim, min 5 chars) per retailer
  - Use NPSScale and OpenEndedText components
  - Derive nps_category per retailer
  - Show signpost before block

### Survey Pages — Block 3 (KPC)
- [ ] `/survey/block3/k1` — Importance ratings (13 attributes, 1-5 scale)
  - Randomize attribute order. Use RatingScale component.
  - Desktop: full matrix. Mobile: 4-5 attributes per screen.
  - Show signpost before block
- [ ] `/survey/block3/k2` — Performance ratings per R1, R2, R3
  - Same 13 attributes, 1-5 scale. Can match K1's random order.

### Survey Pages — Block 4 (SOW Deep Dive)
- [ ] `/survey/block4` — Loop for R1, R2, R3 (where SOW > 0%)
  - W2 → conditional W3a or W3b → W4 → conditional W5a or W5b
  - Show per-retailer signpost within loop
  - See engineering plan Section 6 for all options and routing

### Survey Pages — Block 5 (Switching & Loyalty)
- [ ] `/survey/block5` — Conditional on segment:
  - Customers: L1 + L1a
  - Non-customers/lapsed: L2 + L2a
  - Unaware: skip L1/L2 entirely
  - All: L3 + L4
  - See engineering plan Section 6

### Survey Pages — Block 6 (Frequency & Basket)
- [ ] `/survey/block6` — F1 (all), F2 (customers only), F3, F4

### Survey Pages — Block 7 (Macro Sensitivity)
- [ ] `/survey/block7` — M1, M2, M3 (multi-select with exclusive), M4 (max 2), M5a/M5b (ranking)
  - M5 needs RankingQuestion component:
    Desktop: drag-and-drop. Mobile: tap-to-rank.
  - This component has NOT been built yet

### Survey Pages — Block 8 (Demographics)
- [ ] `/survey/block8` — D1-D7 (all optional, skip button per question)

### Admin Dashboard
- [ ] `/admin/login` — simple username/password form
- [ ] `/admin/dashboard` — tables for quotas, demographics, least-fill, metrics, QC flags
- [ ] `/api/admin/login` — validate against env vars, set cookie
- [ ] `/api/admin/dashboard` — aggregate queries for dashboard data
- [ ] `/api/admin/export` — CSV export using papaparse

### Components Not Yet Built
- [ ] `RankingQuestion` — drag-and-drop (desktop) / tap-to-rank (mobile) for M5a/M5b
- [ ] `SOWAllocation` — 100% allocation UI with running total for S4
- [ ] `MatrixQuestion` — responsive matrix grid for S3, S4a, K1, K2 (desktop grid, mobile cards)

---

## Key Reference Files

| What | Where |
|---|---|
| **Engineering plan** (complete build spec) | `FAREWAY_ENGINEERING_PLAN.md` in project knowledge |
| **Developer spec** (original) | `fareway_developer_spec_v3_final.docx` in project knowledge |
| **Survey instrument** (full questionnaire) | `fareway_survey_instrument_v3.docx` in project knowledge |
| **Database migration** | `001_initial_schema_fixed.sql` (already run in Supabase) |
| **Constants & config** | `src/lib/constants.ts` |
| **Segment logic** | `src/lib/segment-logic.ts` |
| **All API routes** | `src/app/api/survey/` and `src/app/api/zip-lookup/` |

---

## Instructions for Continuing Development

1. Read `FAREWAY_ENGINEERING_PLAN.md` first — it has the complete spec for every page
2. Each survey page follows the same pattern:
   - Import shared components (SingleSelect, MultiSelect, etc.)
   - Manage local state with useState
   - On submit: call `/api/survey/submit-block` with the block data
   - Handle termination by calling `/api/survey/terminate` and redirecting
   - Navigate to next page with `router.push()`
3. For conditional routing (S5→S5a, W2→W3a/W3b, etc.), use the respondent's stored data
4. For Block 2-4 loops, read R1/R2/R3 from sessionStorage or fetch from DB
5. The admin dashboard is independent — build it last
6. Test each page by navigating directly: `/survey/block1/s3` etc.
