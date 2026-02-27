# Fareway Survey — Build Status

**Last updated:** February 26, 2026
**Status:** All survey pages, components, and admin dashboard complete. Production build passes.

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
- [x] `POST /api/admin/login` — validates credentials against env vars, sets httpOnly cookie
- [x] `GET /api/admin/dashboard` — aggregate queries for quotas, demographics, fill counts, metrics, QC flags
- [x] `GET /api/admin/export` — full CSV export using papaparse with UTF-8 BOM

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
- [x] `MatrixQuestion` — desktop full grid + mobile grouped cards with pagination (used by S3, S4a, K1, K2)
- [x] `SOWAllocation` — slider + numeric inputs with sticky running total bar, must sum to 100% (used by S4)
- [x] `RankingQuestion` — desktop drag-and-drop + mobile tap-to-rank (used by M5a, M5b)
- [x] `globals.css` — Tailwind setup, Inter font, custom radio/checkbox/button styles

### Survey Pages — Block 1 Screener (100%)
- [x] `/survey` — entry point (reads URL params, creates record, redirects)
- [x] `/survey/consent` — consent screen with Begin Survey button
- [x] `/survey/block1/s1` — ZIP code with signpost, validation, termination
- [x] `/survey/block1/s2` — decision-maker with termination on "no"
- [x] `/survey/block1/s3` — funnel matrix (15 retailers × 6 levels), randomized rows, "Other" anchored, text input for Other, terminates if no funnel >= 5
- [x] `/survey/block1/s4` — SOW allocation for funnel=6 stores + "All other stores", derives primary_store/segment, stores SOW data in sessionStorage
- [x] `/survey/block1/s4a` — frequency matrix for top 3 SOW stores, randomized row order
- [x] `/survey/block1/s5` — switching yes/no gate (routes to S5a or S6)
- [x] `/survey/block1/s5a` — multi-select switched-out stores, randomized with Other anchored
- [x] `/survey/block1/s6` — income band with signpost, terminates on "prefer not to say", derives collapsed band
- [x] `/survey/block1/s7` — age cohort, terminates on under-18 or PNTS, derives collapsed cohort
- [x] `/survey/block1/s8` — household type + post-S8 critical sequence: save → quota check → assign R1/R2/R3 → route to Block 2

### Survey Pages — Block 2 NPS (100%)
- [x] `/survey/block2` — NPS loop for R1, R2, R3 with signpost. Each retailer: 0-10 NPS scale → verbatim. Derives nps_category.

### Survey Pages — Block 3 KPC (100%)
- [x] `/survey/block3/k1` — importance ratings (13 attributes, 1-5 scale) with signpost. Randomized order stored in sessionStorage for K2.
- [x] `/survey/block3/k2` — performance ratings per R1, R2, R3. Same 13 attributes in K1's randomized order.

### Survey Pages — Block 4 SOW Deep Dive (100%)
- [x] `/survey/block4` — loop for R1, R2, R3 (where SOW > 0%) with signpost. W2 (retro direction) → conditional W3 (reason) → W4 (forward direction) → conditional W5 (reason). Other text input for reason=6.

### Survey Pages — Block 5 Switching & Loyalty (100%)
- [x] `/survey/block5` — segment-conditional with signpost. Customers: L1 + L1a. Non-customers/lapsed: L2 + L2a. Unaware: skip. All: signpost → L3 + L4. Derives channel_current_collapsed.

### Survey Pages — Block 6 Frequency & Basket (100%)
- [x] `/survey/block6` — F1 (all) → F2 (customers only) → F3 → F4 with signpost. Derives avg_basket_midpoint.

### Survey Pages — Block 7 Macro Sensitivity (100%)
- [x] `/survey/block7` — M1 → M2 → M3 (multi-select with exclusive "None") → M4 (max 2 best value) → M5a (price raised ranking) → M5b (price stable ranking) with signpost. Derives tradedown_count.

### Survey Pages — Block 8 Demographics (100%)
- [x] `/survey/block8` — D1–D7 (all optional) with signpost. One question per sub-screen with Skip + Continue buttons. Ethnicity "Other" text input.

### Completion Pages (100%)
- [x] `/survey/thankyou` — completion screen, triggers `/api/survey/complete`
- [x] `/survey/terminated` — dynamic termination message based on reason code

### Admin Dashboard (100%)
- [x] `/admin/login` — username/password form, authenticates against env vars
- [x] `/admin/dashboard` — tables for: segment quotas, retailer fill counts (least-fill order), termination breakdown, income/age distributions, QC flags, device breakdown, completion metrics. Export CSV button.

---

## Verified Working
- [x] TypeScript: zero errors (`tsc --noEmit` passes)
- [x] Production build: 38 pages compiled successfully (`next build` passes)
- [x] Full flow tested: entry → consent → S1 → S2 end-to-end
- [x] ZIP validation against Supabase zip_lookup table
- [x] Termination on invalid ZIP (S1), non-decision-maker (S2)
- [x] Duplicate respondent_id rejection
- [x] Database writes confirmed in Supabase Table Editor

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
| **All API routes** | `src/app/api/survey/` and `src/app/api/admin/` |

---

## sessionStorage Keys

| Key | Set After | Used By |
|---|---|---|
| `respondent_id` | Entry | All pages |
| `phase` | Entry | — |
| `funnel_data` | S3 | S4, S4a, M4, M5 |
| `stores_last_3m` | S3 | S8 (assign-retailers) |
| `sow_data` | S4 | S4a, Block 4 |
| `sow_stores` | S4 | S4a, Block 4 |
| `primary_store` | S4 | S8 |
| `segment` | S4 | S8, Block 5, Block 6 |
| `r1`, `r2`, `r3` | S8 | Block 2, Block 3, Block 4 |
| `k1_order` | K1 | K2 |
