# Fareway Stores Customer Survey — Comprehensive Engineering Plan

**Version:** 1.0 | **Date:** February 2026 | **Status:** Ready for Development

This document is a **self-contained engineering specification** for building the Fareway Stores Customer Survey application. It includes every detail needed to build, test, and deploy the complete system. Any developer or coding agent should be able to build the entire application from this document alone.

---

## Table of Contents

1. [Project Overview & Key Decisions](#1-project-overview--key-decisions)
2. [Tech Stack & Infrastructure](#2-tech-stack--infrastructure)
3. [Database Schema (Supabase/PostgreSQL)](#3-database-schema-supabasepostgresql)
4. [Application Structure (Next.js)](#4-application-structure-nextjs)
5. [Survey Flow & Routing Engine](#5-survey-flow--routing-engine)
6. [Block-by-Block Implementation Guide](#6-block-by-block-implementation-guide)
7. [Retailer Assignment & Least-Fill Algorithm](#7-retailer-assignment--least-fill-algorithm)
8. [Segment Classification Logic](#8-segment-classification-logic)
9. [Termination Logic](#9-termination-logic)
10. [Randomization Rules](#10-randomization-rules)
11. [Mobile UX Specifications](#11-mobile-ux-specifications)
12. [Admin Dashboard](#12-admin-dashboard)
13. [CSV Export Specification](#13-csv-export-specification)
14. [Data Quality Flags](#14-data-quality-flags)
15. [ZIP Code Lookup & Trade Area](#15-zip-code-lookup--trade-area)
16. [Signpost / Transition Screens](#16-signpost--transition-screens)
17. [Validation Rules](#17-validation-rules)
18. [Constants & Configuration](#18-constants--configuration)
19. [Deployment & Environment Variables](#19-deployment--environment-variables)
20. [Testing Checklist](#20-testing-checklist)

---

## 1. Project Overview & Key Decisions

### What We're Building
A web-based customer survey for Fareway Stores (a Midwest grocery chain) to support investment due diligence. The survey collects data on customer loyalty, competitive positioning, share of wallet, and macro sensitivity from 10,000 respondents.

### Key Decisions (locked in)
| Decision | Choice |
|---|---|
| Brand spelling | **Fareway** (not Fairway) |
| Tech stack | Next.js 14 (App Router) + TypeScript + Tailwind CSS + Supabase |
| Hosting | Vercel |
| Database | Supabase (PostgreSQL) — fresh instance, no existing tables |
| Session resume | **Not building** — respondents complete in one sitting |
| Panel redirects | **Not building** — show thank-you screen on complete/terminate/overquota |
| Admin auth | Simple username/password (JTP2125 / test123, to be changed pre-launch) |
| Verbatim minimums | 5 characters (not 10) for all open-ended fields |
| "Prefer not to say" on income/age | **Terminate** the respondent |
| R1/R2/R3 retailers | Same 3 retailers used across NPS (Block 2), KPC (Block 3), AND SOW Deep Dive (Block 4) |
| Admin dashboard | Simple table view — functional, not polished. Key numbers + CSV export |
| ZIP lookup | Configurable file/table — generate reasonable initial list, client refines |

### Survey Phases
- **Phase 1** (~4,000–5,000 respondents): Census-representative sample. Monitor demographics vs. census benchmarks.
- **Phase 2** (~5,000–6,000 respondents): Targeted oversample to fill segment quotas. Demographics relaxed.
- Phase is passed as a URL parameter (`phase=1` or `phase=2`).

### Target Segments & Quotas
| Segment | Code | Min | Max | Priority |
|---|---|---|---|---|
| Primary Shopper | `primary_shopper` | 2,500 | 3,000 | High |
| Secondary Shopper | `secondary_shopper` | 1,500 | 2,000 | High |
| Lapsed | `lapsed` | 800 | 1,000 | High |
| Aware Non-Customer | `aware_non_customer` | 1,500 | 2,000 | High |
| Unaware Non-Customer | `unaware_non_customer` | 500 | 800 | Medium |

---

## 2. Tech Stack & Infrastructure

### Stack
```
Frontend:  Next.js 14 (App Router) + TypeScript + Tailwind CSS
Backend:   Next.js API Routes (serverless functions on Vercel)
Database:  Supabase (PostgreSQL)
Auth:      Simple middleware check for admin routes (not Supabase Auth)
Hosting:   Vercel
```

### Key Dependencies (package.json)
```json
{
  "dependencies": {
    "next": "^14.2.0",
    "react": "^18.3.0",
    "react-dom": "^18.3.0",
    "@supabase/supabase-js": "^2.45.0",
    "papaparse": "^5.4.0",
    "cookie": "^0.6.0"
  },
  "devDependencies": {
    "typescript": "^5.5.0",
    "@types/react": "^18.3.0",
    "@types/node": "^20.14.0",
    "@types/cookie": "^0.6.0",
    "tailwindcss": "^3.4.0",
    "postcss": "^8.4.0",
    "autoprefixer": "^10.4.0"
  }
}
```

### Environment Variables (.env.local)
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
ADMIN_USERNAME=JTP2125
ADMIN_PASSWORD=test123
```

The `SUPABASE_SERVICE_ROLE_KEY` is used server-side only (API routes) for database writes. The anon key is used client-side for read operations where appropriate.

---

## 3. Database Schema (Supabase/PostgreSQL)

### Table 1: `respondents`
This is the master table. One row per respondent. Contains ALL survey data and maps directly to the CSV export. ~185 columns.

```sql
-- ============================================================
-- SYSTEM VARIABLES
-- ============================================================
CREATE TABLE respondents (
  id                    SERIAL PRIMARY KEY,
  respondent_id         TEXT UNIQUE NOT NULL,        -- from URL param 'rid'
  panel_source          TEXT,                         -- from URL param 'src'
  phase                 INT NOT NULL,                 -- 1 or 2 (from URL param)
  segment               TEXT,                         -- primary_shopper | secondary_shopper | lapsed | aware_non_customer | unaware_non_customer
  completion_status     TEXT NOT NULL DEFAULT 'partial', -- complete | terminated | partial
  termination_point     TEXT,                         -- S1 | S2 | S3 | S7 | S6_PNTS | S7_PNTS | quota_full | null
  start_timestamp       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  end_timestamp         TIMESTAMPTZ,
  duration_seconds      INT,
  device_type           TEXT,                         -- mobile | desktop | tablet
  current_block         TEXT DEFAULT 'consent',       -- tracks progress for partial saves

  -- ============================================================
  -- BLOCK 1: SCREENER S1-S3
  -- ============================================================
  zip_code              TEXT,                         -- S1: 5-digit ZIP
  dma                   TEXT,                         -- derived from zip_code
  grocery_decisionmaker INT,                          -- S2: 1=primary, 2=shared, 3=no (terminated)

  -- S3: Consideration Funnel (1-6 per retailer)
  -- 1=not aware, 2=aware, 3=considered, 4=shopped past not 12m, 5=shopped 12m not 3m, 6=shopped 3m
  funnel_fareway        INT,
  funnel_hyvee          INT,
  funnel_kroger         INT,
  funnel_aldi           INT,
  funnel_walmart        INT,
  funnel_costco         INT,
  funnel_meijer         INT,
  funnel_target         INT,
  funnel_wholefoods     INT,
  funnel_traderjoes     INT,
  funnel_samsclub       INT,
  funnel_pricechopper   INT,
  funnel_schnucks       INT,
  funnel_savealot       INT,
  funnel_other          INT,
  funnel_other_text     TEXT,                         -- write-in if Other selected

  -- ============================================================
  -- BLOCK 1: SCREENER S4 - Share of Wallet & Frequency
  -- ============================================================
  -- SOW allocation (sorted by descending %)
  sow_store1_name       TEXT,                         -- retailer name, highest SOW
  sow_store1_pct        INT,                          -- allocation % (0-100)
  sow_store2_name       TEXT,
  sow_store2_pct        INT,
  sow_store3_name       TEXT,
  sow_store3_pct        INT,
  sow_other_pct         INT,                          -- 'All other stores' allocation
  primary_store         TEXT,                          -- derived: retailer with highest SOW

  -- S4a: Frequency for top 3 stores
  -- 1=weekly+, 2=2-3x/mo, 3=monthly, 4=less
  freq_store1           INT,
  freq_store2           INT,
  freq_store3           INT,

  -- ============================================================
  -- BLOCK 1: SCREENER S5 - Historical Switching
  -- ============================================================
  switched_out_any      INT,                          -- S5: 1=yes, 0=no
  switched_out_fareway  INT,                          -- 1 if selected, else 0
  switched_out_hyvee    INT,
  switched_out_kroger   INT,
  switched_out_aldi     INT,
  switched_out_walmart  INT,
  switched_out_costco   INT,
  switched_out_meijer   INT,
  switched_out_target   INT,
  switched_out_wholefoods INT,
  switched_out_traderjoes INT,
  switched_out_samsclub INT,
  switched_out_pricechopper INT,
  switched_out_schnucks INT,
  switched_out_savealot INT,
  switched_out_other    INT,
  switched_out_other_text TEXT,

  -- ============================================================
  -- BLOCK 1: SCREENER S6-S8 - Demographics
  -- ============================================================
  income_band           INT,                          -- S6: 1=<$25K, 2=$25-50K, 3=$50-75K, 4=$75-100K, 5=$100-150K, 6=$150K+, 7=prefer not (TERMINATE)
  income_band_collapsed TEXT,                          -- derived: under_50k | 50_to_100k | over_100k
  age_cohort            INT,                          -- S7: 1=<18(term), 2=18-24, 3=25-34, 4=35-44, 5=45-54, 6=55-64, 7=65+, 8=pnts(term)
  age_cohort_collapsed  TEXT,                          -- derived: under_35 | 35_to_54 | 55_plus
  household_type        INT,                          -- S8: 1=alone, 2=couple no kids, 3=couple+kids, 4=single parent, 5=roommates, 6=other
  household_type_collapsed TEXT,                       -- derived: single | couple | family | other

  -- ============================================================
  -- RETAILER ASSIGNMENTS (computed after screener)
  -- ============================================================
  nps_r1_store          TEXT,                          -- R1: always primary store
  nps_r2_store          TEXT,                          -- R2: Fareway if secondary shopper, else least-fill
  nps_r3_store          TEXT,                          -- R3: least-fill (null if <3 stores)

  -- ============================================================
  -- BLOCK 2: NPS
  -- ============================================================
  nps_r1_score          INT,                          -- 0-10
  nps_r1_category       TEXT,                          -- derived: promoter | passive | detractor
  nps_r1_verbatim       TEXT,                          -- open-ended reason
  nps_r2_score          INT,
  nps_r2_category       TEXT,
  nps_r2_verbatim       TEXT,
  nps_r3_score          INT,                          -- null if <3 stores
  nps_r3_category       TEXT,
  nps_r3_verbatim       TEXT,

  -- ============================================================
  -- BLOCK 3: KPC IMPORTANCE (K1) — 13 attributes, asked once
  -- ============================================================
  k1_imp_lowest_price   INT,                          -- 1-5
  k1_imp_best_value     INT,
  k1_imp_prod_quality   INT,
  k1_imp_produce_fresh  INT,
  k1_imp_meat_seafood   INT,
  k1_imp_private_label  INT,
  k1_imp_assortment     INT,
  k1_imp_cleanliness    INT,
  k1_imp_checkout       INT,
  k1_imp_location       INT,
  k1_imp_digital        INT,
  k1_imp_prepared_foods INT,
  k1_imp_price_stability INT,

  -- ============================================================
  -- BLOCK 3: KPC PERFORMANCE (K2) — 13 attributes × 3 retailers = 39 columns
  -- ============================================================
  -- R1 performance
  k2_perf_r1_lowest_price   INT,
  k2_perf_r1_best_value     INT,
  k2_perf_r1_prod_quality   INT,
  k2_perf_r1_produce_fresh  INT,
  k2_perf_r1_meat_seafood   INT,
  k2_perf_r1_private_label  INT,
  k2_perf_r1_assortment     INT,
  k2_perf_r1_cleanliness    INT,
  k2_perf_r1_checkout       INT,
  k2_perf_r1_location       INT,
  k2_perf_r1_digital        INT,
  k2_perf_r1_prepared_foods INT,
  k2_perf_r1_price_stability INT,
  -- R2 performance
  k2_perf_r2_lowest_price   INT,
  k2_perf_r2_best_value     INT,
  k2_perf_r2_prod_quality   INT,
  k2_perf_r2_produce_fresh  INT,
  k2_perf_r2_meat_seafood   INT,
  k2_perf_r2_private_label  INT,
  k2_perf_r2_assortment     INT,
  k2_perf_r2_cleanliness    INT,
  k2_perf_r2_checkout       INT,
  k2_perf_r2_location       INT,
  k2_perf_r2_digital        INT,
  k2_perf_r2_prepared_foods INT,
  k2_perf_r2_price_stability INT,
  -- R3 performance
  k2_perf_r3_lowest_price   INT,
  k2_perf_r3_best_value     INT,
  k2_perf_r3_prod_quality   INT,
  k2_perf_r3_produce_fresh  INT,
  k2_perf_r3_meat_seafood   INT,
  k2_perf_r3_private_label  INT,
  k2_perf_r3_assortment     INT,
  k2_perf_r3_cleanliness    INT,
  k2_perf_r3_checkout       INT,
  k2_perf_r3_location       INT,
  k2_perf_r3_digital        INT,
  k2_perf_r3_prepared_foods INT,
  k2_perf_r3_price_stability INT,

  -- ============================================================
  -- BLOCK 4: SOW DEEP DIVE (W2-W5) — 10 columns × 3 retailers = 30 columns
  -- ============================================================
  -- Store 1 (R1 = primary store)
  sow_retro_store1_dir              INT,              -- W2: 1=dec sig, 2=dec some, 3=same, 4=inc some, 5=inc sig
  sow_retro_store1_reason_inc       INT,              -- W3a: reason code 1-9 (if W2=5)
  sow_retro_store1_reason_inc_text  TEXT,             -- W3a other write-in
  sow_retro_store1_reason_dec       INT,              -- W3b: reason code 1-9 (if W2=1)
  sow_retro_store1_reason_dec_text  TEXT,             -- W3b other write-in
  sow_fwd_store1_dir                INT,              -- W4: 1=decrease, 2=same, 3=increase
  sow_fwd_store1_reason_inc         INT,              -- W5a: reason code 1-8 (if W4=3)
  sow_fwd_store1_reason_inc_text    TEXT,
  sow_fwd_store1_reason_dec         INT,              -- W5b: reason code 1-8 (if W4=1)
  sow_fwd_store1_reason_dec_text    TEXT,
  -- Store 2 (R2)
  sow_retro_store2_dir              INT,
  sow_retro_store2_reason_inc       INT,
  sow_retro_store2_reason_inc_text  TEXT,
  sow_retro_store2_reason_dec       INT,
  sow_retro_store2_reason_dec_text  TEXT,
  sow_fwd_store2_dir                INT,
  sow_fwd_store2_reason_inc         INT,
  sow_fwd_store2_reason_inc_text    TEXT,
  sow_fwd_store2_reason_dec         INT,
  sow_fwd_store2_reason_dec_text    TEXT,
  -- Store 3 (R3)
  sow_retro_store3_dir              INT,
  sow_retro_store3_reason_inc       INT,
  sow_retro_store3_reason_inc_text  TEXT,
  sow_retro_store3_reason_dec       INT,
  sow_retro_store3_reason_dec_text  TEXT,
  sow_fwd_store3_dir                INT,
  sow_fwd_store3_reason_inc         INT,
  sow_fwd_store3_reason_inc_text    TEXT,
  sow_fwd_store3_reason_dec         INT,
  sow_fwd_store3_reason_dec_text    TEXT,

  -- ============================================================
  -- BLOCK 5: SWITCHING COSTS & LOYALTY
  -- ============================================================
  churn_risk_reason         INT,                      -- L1: 1-8 (customers only)
  churn_risk_reason_text    TEXT,                      -- L1 other write-in
  fareway_improve_verbatim  TEXT,                      -- L1a: open-ended (customers)
  acquisition_trigger       INT,                       -- L2: 1-8 (non-cust/lapsed)
  acquisition_trigger_text  TEXT,                      -- L2 other write-in
  fareway_tryme_verbatim    TEXT,                      -- L2a: open-ended (non-cust/lapsed)
  channel_current           INT,                       -- L3: 1=all in-store, 2=mostly in-store, 3=half, 4=mostly online, 5=all online
  channel_current_collapsed TEXT,                      -- derived: in_store | hybrid | online
  channel_change            INT,                       -- L4: 1=sig more online, 2=somewhat more, 3=same, 4=somewhat less, 5=sig less

  -- ============================================================
  -- BLOCK 6: FREQUENCY & BASKET
  -- ============================================================
  freq_total            INT,                          -- F1: 1=1-2x, 2=3-4x, 3=5-6x, 4=7-8x, 5=9+
  freq_fareway          INT,                          -- F2: 1=<1x, 2=1-2x, 3=3-4x, 4=5-6x, 5=7+ (customers only)
  avg_basket            INT,                          -- F3: 1=<$25, 2=$25-50, 3=$51-100, 4=$101-150, 5=$151-200, 6=>$200
  avg_basket_midpoint   FLOAT,                        -- derived: 12.50, 37.50, 75.50, 125.50, 175.50, 250.00
  trip_trend            INT,                          -- F4: 1=sig more, 2=somewhat more, 3=same, 4=somewhat fewer, 5=sig fewer

  -- ============================================================
  -- BLOCK 7: MACRO SENSITIVITY
  -- ============================================================
  budget_trend              INT,                      -- M1: 1=inc sig, 2=inc some, 3=same, 4=dec some, 5=dec sig
  macro_response            INT,                      -- M2: 1-7
  macro_response_text       TEXT,                     -- M2 other write-in
  tradedown_storebrand      INT DEFAULT 0,            -- M3: 1 if selected
  tradedown_organic         INT DEFAULT 0,
  tradedown_premium         INT DEFAULT 0,
  tradedown_discount_grocer INT DEFAULT 0,
  tradedown_coupons         INT DEFAULT 0,
  tradedown_food_waste      INT DEFAULT 0,
  tradedown_none            INT DEFAULT 0,
  tradedown_count           INT,                      -- derived: sum of flags excl none
  best_value_1              TEXT,                      -- M4: retailer name, primary pick
  best_value_2              TEXT,                      -- M4: tie pick (null if no tie)
  price_raised_rank_1       TEXT,                      -- M5a: ranked #1
  price_raised_rank_2       TEXT,
  price_raised_rank_3       TEXT,
  price_stable_rank_1       TEXT,                      -- M5b: ranked #1
  price_stable_rank_2       TEXT,
  price_stable_rank_3       TEXT,

  -- ============================================================
  -- BLOCK 8: DEMOGRAPHICS (all optional)
  -- ============================================================
  gender                INT,                          -- D1: 1=male, 2=female, 3=non-binary, 4=pnts
  education             INT,                          -- D2: 1-6
  employment            INT,                          -- D3: 1-8
  area_type             INT,                          -- D4: 1=urban, 2=suburban, 3=small town, 4=rural
  distance_fareway      INT,                          -- D5: 1=<5min, 2=5-10, 3=11-20, 4=21-30, 5=>30, 6=unsure
  household_size        INT,                          -- D6: 1-5
  ethnicity             INT,                          -- D7: 1-8
  ethnicity_other_text  TEXT,                         -- D7 write-in

  -- ============================================================
  -- DATA QUALITY FLAGS
  -- ============================================================
  qc_speeder            INT DEFAULT 0,               -- 1 if duration_seconds < 180
  qc_straightliner_k1   INT DEFAULT 0,               -- 1 if all K1 ratings identical
  qc_straightliner_k2   INT DEFAULT 0,               -- 1 if all K2 ratings identical for any retailer
  qc_gibberish_nps      INT DEFAULT 0,               -- 1 if any NPS verbatim is spam
  qc_gibberish_l1a      INT DEFAULT 0,
  qc_gibberish_l2a      INT DEFAULT 0,
  qc_sow_tie            INT DEFAULT 0                -- 1 if two retailers tied for highest SOW
);

-- Index for quick lookups
CREATE INDEX idx_respondents_rid ON respondents(respondent_id);
CREATE INDEX idx_respondents_segment ON respondents(segment);
CREATE INDEX idx_respondents_phase ON respondents(phase);
CREATE INDEX idx_respondents_status ON respondents(completion_status);
```

### Table 2: `retailer_fill_counts`
Atomic counter for least-fill retailer assignment in NPS/KPC/SOW blocks.

```sql
CREATE TABLE retailer_fill_counts (
  retailer_code TEXT PRIMARY KEY,
  count INT NOT NULL DEFAULT 0
);

-- Seed with all 14 retailers + other
INSERT INTO retailer_fill_counts (retailer_code) VALUES
  ('fareway'), ('hyvee'), ('kroger'), ('aldi'), ('walmart'),
  ('costco'), ('meijer'), ('target'), ('wholefoods'), ('traderjoes'),
  ('samsclub'), ('pricechopper'), ('schnucks'), ('savealot'), ('other');
```

### Table 3: `segment_quotas`
Tracks current fill against quota targets.

```sql
CREATE TABLE segment_quotas (
  segment TEXT PRIMARY KEY,
  current_count INT NOT NULL DEFAULT 0,
  min_target INT NOT NULL,
  max_target INT NOT NULL
);

INSERT INTO segment_quotas (segment, min_target, max_target) VALUES
  ('primary_shopper', 2500, 3000),
  ('secondary_shopper', 1500, 2000),
  ('lapsed', 800, 1000),
  ('aware_non_customer', 1500, 2000),
  ('unaware_non_customer', 500, 800);
```

### Table 4: `zip_lookup`
Trade area ZIP codes mapped to DMAs. Editable by client.

```sql
CREATE TABLE zip_lookup (
  zip_code TEXT PRIMARY KEY,
  dma TEXT NOT NULL,
  state TEXT NOT NULL
);

-- See Section 15 for seed data
```

---

## 4. Application Structure (Next.js)

```
fareway-survey/
├── .env.local                          # Environment variables
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── postcss.config.js
├── next.config.js
│
├── public/
│   └── (static assets if any)
│
├── src/
│   ├── app/
│   │   ├── layout.tsx                  # Root layout (global styles, fonts)
│   │   ├── page.tsx                    # Landing/redirect (not used by respondents)
│   │   │
│   │   ├── survey/
│   │   │   ├── page.tsx                # Survey entry point — reads URL params, creates respondent record, redirects to consent
│   │   │   ├── layout.tsx              # Survey layout — progress bar, consistent styling
│   │   │   ├── consent/
│   │   │   │   └── page.tsx            # Consent screen
│   │   │   ├── block1/
│   │   │   │   ├── s1/page.tsx         # ZIP code
│   │   │   │   ├── s2/page.tsx         # Decision-maker
│   │   │   │   ├── s3/page.tsx         # Consideration funnel matrix
│   │   │   │   ├── s4/page.tsx         # Share of wallet 100% allocation
│   │   │   │   ├── s4a/page.tsx        # Frequency matrix
│   │   │   │   ├── s5/page.tsx         # Historical switching (yes/no)
│   │   │   │   ├── s5a/page.tsx        # Which stores reduced (if S5=yes)
│   │   │   │   ├── s6/page.tsx         # Income
│   │   │   │   ├── s7/page.tsx         # Age
│   │   │   │   └── s8/page.tsx         # Household type
│   │   │   ├── block2/
│   │   │   │   └── page.tsx            # NPS: N1 + N2 for R1, R2, R3 (single page with sub-steps)
│   │   │   ├── block3/
│   │   │   │   ├── k1/page.tsx         # KPC Importance (all 13 attributes)
│   │   │   │   └── k2/page.tsx         # KPC Performance for R1, R2, R3
│   │   │   ├── block4/
│   │   │   │   └── page.tsx            # SOW Deep Dive loop for R1, R2, R3
│   │   │   ├── block5/
│   │   │   │   └── page.tsx            # Switching costs & loyalty (L1-L4)
│   │   │   ├── block6/
│   │   │   │   └── page.tsx            # Frequency & basket (F1-F4)
│   │   │   ├── block7/
│   │   │   │   └── page.tsx            # Macro sensitivity (M1-M5)
│   │   │   ├── block8/
│   │   │   │   └── page.tsx            # Demographics (D1-D7)
│   │   │   ├── thankyou/
│   │   │   │   └── page.tsx            # Thank you screen
│   │   │   └── terminated/
│   │   │       └── page.tsx            # Termination screen (dynamic message)
│   │   │
│   │   ├── admin/
│   │   │   ├── login/page.tsx          # Admin login page
│   │   │   └── dashboard/page.tsx      # Admin dashboard with tables + CSV export
│   │   │
│   │   └── api/
│   │       ├── survey/
│   │       │   ├── init/route.ts            # POST: Create respondent record from URL params
│   │       │   ├── submit-block/route.ts    # POST: Save block data + advance
│   │       │   ├── check-quota/route.ts     # POST: Check if segment quota is full
│   │       │   ├── assign-retailers/route.ts # POST: Least-fill assignment for R1/R2/R3
│   │       │   ├── terminate/route.ts       # POST: Mark respondent as terminated
│   │       │   └── complete/route.ts        # POST: Mark respondent as complete, compute QC flags
│   │       ├── admin/
│   │       │   ├── login/route.ts           # POST: Validate admin credentials
│   │       │   ├── dashboard/route.ts       # GET: Dashboard data (quotas, demographics, etc.)
│   │       │   └── export/route.ts          # GET: Generate and download CSV
│   │       └── zip-lookup/route.ts          # POST: Validate ZIP against trade area
│   │
│   ├── components/
│   │   ├── survey/
│   │   │   ├── ProgressBar.tsx              # Visual progress bar (no percentage)
│   │   │   ├── SignpostScreen.tsx            # Transition screen with yellow background
│   │   │   ├── SingleSelect.tsx             # Radio button group
│   │   │   ├── MultiSelect.tsx              # Checkbox group
│   │   │   ├── MatrixQuestion.tsx           # Matrix/grid (desktop) with mobile card fallback
│   │   │   ├── SOWAllocation.tsx            # 100% allocation with running total
│   │   │   ├── NPSScale.tsx                # 0-10 horizontal scale
│   │   │   ├── RatingScale.tsx             # 1-5 importance/performance buttons
│   │   │   ├── RankingQuestion.tsx          # Drag-and-drop (desktop) / tap-to-rank (mobile)
│   │   │   ├── OpenEndedText.tsx            # Text area with character counter
│   │   │   ├── ZIPInput.tsx                 # 5-digit ZIP with validation
│   │   │   ├── TerminationMessage.tsx       # Friendly termination display
│   │   │   └── QuestionWrapper.tsx          # Standard question layout (number, text, input)
│   │   └── admin/
│   │       ├── QuotaTable.tsx               # Segment quotas vs. actuals
│   │       ├── DemographicTable.tsx          # Phase 1 demographic fill rates
│   │       ├── LeastFillTable.tsx           # Retailer response counts
│   │       └── QualityFlagsTable.tsx        # QC flag summary
│   │
│   ├── lib/
│   │   ├── supabase.ts                      # Supabase client initialization
│   │   ├── supabase-server.ts               # Server-side Supabase client (service role key)
│   │   ├── constants.ts                     # All constants (retailer list, attributes, etc.)
│   │   ├── segment-logic.ts                 # Segment classification functions
│   │   ├── least-fill.ts                    # Least-fill algorithm
│   │   ├── derived-fields.ts                # Compute derived columns (NPS category, income collapse, etc.)
│   │   ├── quality-flags.ts                 # Compute QC flags on completion
│   │   ├── randomize.ts                     # Array randomization with anchor support
│   │   ├── validation.ts                    # Input validation functions
│   │   └── device-detect.ts                 # UA-based device type detection
│   │
│   ├── hooks/
│   │   ├── useSurveyState.ts                # Survey state management (respondent data, current block)
│   │   ├── useDeviceType.ts                 # Mobile/desktop/tablet detection
│   │   └── useRandomizedList.ts             # Memoized randomized option lists
│   │
│   └── types/
│       ├── survey.ts                        # TypeScript types for all survey data
│       ├── respondent.ts                    # Respondent record type (matches DB schema)
│       └── constants.ts                     # Type definitions for constants
│
├── supabase/
│   └── migrations/
│       └── 001_initial_schema.sql           # Full schema creation (copy from Section 3)
│
└── data/
    └── zip_lookup.csv                       # Seed file for trade area ZIPs (editable)
```

### Survey State Management

The survey uses a **server-driven state model**:

1. On entry (`/survey?rid=XXX&phase=1`), the API creates a respondent record in the database.
2. The `respondent_id` is stored in a cookie (or URL state) for the session.
3. Each page submission calls `POST /api/survey/submit-block` which:
   - Saves the block's data to the respondent record
   - Runs any termination checks
   - Returns the next page to navigate to (or a termination redirect)
4. On completion, `POST /api/survey/complete` computes derived fields and QC flags.

This means the source of truth is always the database. No complex client-side state management needed. Each page component:
- Fetches current respondent data (to know what to display — e.g., which retailers to show)
- Renders the question(s)
- On submit, POSTs answers to the API and navigates to the returned next route

---

## 5. Survey Flow & Routing Engine

### Complete Flow (with routing decisions)

```
ENTRY: /survey?rid=XXX&src=YYY&phase=1|2
  │
  ├─ Duplicate check: if rid exists → show "already taken" message
  ├─ Create respondent record (status=partial, store device_type)
  │
  ▼
CONSENT (/survey/consent)
  │ Click "Continue"
  ▼
[SIGNPOST: "First, we'd like to confirm a few things..."]
  │
  ▼
S1: ZIP Code (/survey/block1/s1)
  │ → API validates against zip_lookup table
  │ → If NOT in trade area → TERMINATE (termination_point = "S1")
  ▼
S2: Decision-maker (/survey/block1/s2)
  │ → If answer = 3 (no) → TERMINATE (termination_point = "S2")
  ▼
[SIGNPOST: "Which grocery stores are you familiar with..."]
  │
  ▼
S3: Consideration Funnel Matrix (/survey/block1/s3)
  │ → If NO retailer has funnel >= 5 → TERMINATE (termination_point = "S3")
  │ → Derive: STORES_LAST_3M (funnel=6), classify non-customers immediately
  │ → If Fareway funnel=1 → unaware_non_customer (preliminary)
  │ → If Fareway funnel=2,3 → aware_non_customer (preliminary)
  │ → If Fareway funnel=4,5 → lapsed (preliminary)
  │ → If Fareway funnel=6 → classify after S4
  ▼
[SIGNPOST: "How you divide your grocery spending..."]
  │
  ▼
S4: Share of Wallet (/survey/block1/s4)
  │ → Show only retailers where funnel=6, plus "All other stores"
  │ → Must sum to 100%
  │ → Derive: primary_store = highest SOW % (random tiebreak)
  │ → If Fareway funnel=6 AND primary_store=fareway → primary_shopper
  │ → If Fareway funnel=6 AND primary_store≠fareway → secondary_shopper
  │ → Sort stores by SOW desc → store1, store2, store3
  ▼
S4a: Frequency for top 3 stores (/survey/block1/s4a)
  │ → Show top 3 stores by SOW (or fewer if <3 stores)
  ▼
S5: Historical Switching (/survey/block1/s5)
  │ → If yes → S5a
  │ → If no → S6
  ▼
S5a: Which stores reduced (/survey/block1/s5a) [conditional]
  ▼
[SIGNPOST: "A few questions about your household..."]
  │
  ▼
S6: Income (/survey/block1/s6)
  │ → If answer = 7 (prefer not to say) → TERMINATE (termination_point = "S6_PNTS")
  ▼
S7: Age (/survey/block1/s7)
  │ → If answer = 1 (under 18) → TERMINATE (termination_point = "S7")
  │ → If answer = 8 (prefer not to say) → TERMINATE (termination_point = "S7_PNTS")
  ▼
S8: Household type (/survey/block1/s8)
  │ → Derive collapsed demographic fields
  │ → CHECK SEGMENT QUOTA → if segment is full → TERMINATE (termination_point = "quota_full")
  │ → INCREMENT segment quota counter
  │ → ASSIGN RETAILERS R1, R2, R3 (least-fill algorithm)
  ▼
[SIGNPOST: "Your experience with specific stores..."]
  │
  ▼
BLOCK 2: NPS (/survey/block2)
  │ → N1 + N2 for R1
  │ → N1 + N2 for R2 (if R2 assigned)
  │ → N1 + N2 for R3 (if R3 assigned)
  ▼
[SIGNPOST: "What matters most when choosing a store..."]
  │
  ▼
BLOCK 3: KPC (/survey/block3/k1 then /survey/block3/k2)
  │ → K1: Importance ratings (13 attributes, once)
  │ → K2: Performance ratings for R1 (13 attributes)
  │ → K2: Performance ratings for R2 (if assigned)
  │ → K2: Performance ratings for R3 (if assigned)
  ▼
[SIGNPOST: "How your spending has changed..."]
  │
  ▼
BLOCK 4: SOW Deep Dive (/survey/block4)
  │ → For each of R1, R2, R3 where SOW > 0%:
  │   → [SIGNPOST: "Questions about your spending at [RETAILER]"]
  │   → W2 (retrospective direction)
  │   → W3a (if W2=5, increased sig) OR W3b (if W2=1, decreased sig)
  │   → W4 (forward direction)
  │   → W5a (if W4=3, expect increase) OR W5b (if W4=1, expect decrease)
  ▼
[SIGNPOST: "What drives your store loyalty..."]
  │
  ▼
BLOCK 5: Switching & Loyalty (/survey/block5)
  │ → If segment = primary_shopper or secondary_shopper:
  │   → L1 (churn risk reason) + L1a (improvement verbatim)
  │ → If segment = aware_non_customer or lapsed:
  │   → L2 (acquisition trigger) + L2a (trial verbatim)
  │ → [SIGNPOST: "A couple of quick questions about how you shop..."]
  │ → L3 (channel current) + L4 (channel change)
  ▼
[SIGNPOST: "How often you shop and how much you spend..."]
  │
  ▼
BLOCK 6: Frequency & Basket (/survey/block6)
  │ → F1 (total frequency)
  │ → F2 (Fareway frequency — customers only)
  │ → F3 (average basket)
  │ → F4 (trip trend)
  ▼
[SIGNPOST: "How economic conditions affect your shopping..."]
  │
  ▼
BLOCK 7: Macro Sensitivity (/survey/block7)
  │ → M1 (budget trend)
  │ → M2 (hypothetical response)
  │ → M3 (trade-down behavior — check all)
  │ → M4 (best value retailer — select up to 2)
  │ → M5a (price raised ranking — rank up to 3)
  │ → M5b (price stable ranking — rank up to 3)
  ▼
[SIGNPOST: "Last section, a few optional questions..."]
  │
  ▼
BLOCK 8: Demographics (/survey/block8)
  │ → D1-D7 (all optional, can skip each)
  ▼
COMPLETE → Thank You Screen (/survey/thankyou)
  │ → Compute derived fields
  │ → Compute QC flags
  │ → Set completion_status = 'complete'
  │ → Record end_timestamp, compute duration_seconds
```

---

## 6. Block-by-Block Implementation Guide

### Block 1: Screener (S1–S8)

#### S1 — ZIP Code
- **Component:** `ZIPInput` — 5-digit numeric field
- **Validation:** Exactly 5 digits, numeric only
- **Server check:** Query `zip_lookup` table. If no match → terminate
- **Data saved:** `zip_code`, `dma` (from lookup)

#### S2 — Decision-maker
- **Component:** `SingleSelect` — 3 options
- **Options:**
  1. "Yes, I am the primary grocery decision-maker"
  2. "Yes, I share grocery shopping responsibility with someone else in my household"
  3. "No, someone else in my household makes most grocery shopping decisions"
- **Routing:** If 3 → terminate
- **Data saved:** `grocery_decisionmaker` (1, 2, or 3)

#### S3 — Consideration Funnel Matrix
- **Component:** `MatrixQuestion` — 15 retailer rows × 6 columns
- **Desktop:** Full matrix grid
- **Mobile:** Group 3 retailers per screen (5 screens). Each retailer shows 6 radio buttons with abbreviated labels
- **Column labels (fixed order L→R, NEVER randomize):**
  1. "Not aware of this store"
  2. "Aware but never considered shopping there"
  3. "Considered but never shopped there"
  4. "Shopped there in the past but not in the last 12 months"
  5. "Shopped there in the last 12 months but not the last 3 months"
  6. "Shopped there in the last 3 months"
- **Mobile abbreviated labels:** "Not aware" | "Aware" | "Considered" | "Past shopper" | "Last 12m" | "Last 3m"
- **Randomization:** Retailer rows randomized. "Other (please specify)" always last.
- **Validation:** Must answer for every retailer
- **Termination:** If no retailer has funnel >= 5 → terminate
- **Data saved:** `funnel_[retailer_code]` for each (1-6), `funnel_other_text` if applicable

**Retailer codes mapping:**
```typescript
const RETAILER_CODES: Record<string, string> = {
  'Fareway': 'fareway',
  'Hy-Vee': 'hyvee',
  'Kroger': 'kroger',
  'Aldi': 'aldi',
  'Walmart Grocery / Walmart Supercenter': 'walmart',
  'Costco': 'costco',
  'Meijer': 'meijer',
  'Target (grocery section)': 'target',
  'Whole Foods Market': 'wholefoods',
  "Trader Joe's": 'traderjoes',
  "Sam's Club": 'samsclub',
  'Price Chopper': 'pricechopper',
  'Schnucks': 'schnucks',
  'Save-A-Lot': 'savealot',
  'Other (please specify)': 'other'
};
```

#### S4 — Share of Wallet (100% Allocation)
- **Component:** `SOWAllocation`
- **Display:** Only retailers where funnel = 6 (shopped last 3 months), plus "All other stores" anchored last
- **Desktop:** Sliders with numeric input for each retailer, running total bar at top
- **Mobile:** Stacked number inputs (0-100) for each retailer, sticky running total bar at top
- **Validation:** Must sum to exactly 100. Real-time running total. Error message if ≠ 100%: "Your allocations must add up to 100%. Please adjust."
- **Derivation:**
  - Sort retailers by SOW % descending (exclude "All other stores")
  - `primary_store` = highest SOW retailer. If tie → random pick, set `qc_sow_tie = 1`
  - `sow_store1_name/pct` = highest, `sow_store2_name/pct` = 2nd, `sow_store3_name/pct` = 3rd
  - `sow_other_pct` = "All other stores" allocation
- **Segment update:**
  - If fareway funnel=6 AND primary_store='fareway' → `primary_shopper`
  - If fareway funnel=6 AND primary_store≠'fareway' → `secondary_shopper`

#### S4a — Frequency Matrix
- **Component:** `MatrixQuestion` — top 3 stores by SOW
- **Display:** Show as many as available (1-3). Randomize row order.
- **Columns (fixed order):**
  1. "About once a week or more"
  2. "2-3 times per month"
  3. "About once a month"
  4. "Less than once a month"
- **Data saved:** `freq_store1`, `freq_store2`, `freq_store3` (1-4)

#### S5 — Historical Switching
- **Component:** `SingleSelect` — Yes/No
- **Question:** "In the past 12 months, have you stopped or significantly reduced your shopping at any grocery store that you previously visited regularly?"
- **Routing:** If yes → S5a. If no → S6.
- **Data saved:** `switched_out_any` (1 or 0)

#### S5a — Which Stores Reduced
- **Component:** `MultiSelect` — full competitor list
- **Display:** Only if S5 = Yes. Randomize. "Other" anchored last.
- **Validation:** At least 1 selection
- **Data saved:** `switched_out_[retailer_code]` (1 or 0 for each), `switched_out_other_text`

#### S6 — Income
- **Component:** `SingleSelect` — 7 options
- **Options:**
  1. Under $25,000
  2. $25,000 – $49,999
  3. $50,000 – $74,999
  4. $75,000 – $99,999
  5. $100,000 – $149,999
  6. $150,000 or more
  7. Prefer not to say → **TERMINATE** (termination_point = "S6_PNTS")
- **Derivation:** `income_band_collapsed`:
  - 1-2 → "under_50k"
  - 3-4 → "50_to_100k"
  - 5-6 → "over_100k"
  - 7 → terminate (never stored as collapsed)
- **Data saved:** `income_band`, `income_band_collapsed`

#### S7 — Age
- **Component:** `SingleSelect` — 8 options
- **Options:**
  1. Under 18 → **TERMINATE** (termination_point = "S7")
  2. 18-24
  3. 25-34
  4. 35-44
  5. 45-54
  6. 55-64
  7. 65 or older
  8. Prefer not to say → **TERMINATE** (termination_point = "S7_PNTS")
- **Derivation:** `age_cohort_collapsed`:
  - 2-3 → "under_35"
  - 4-5 → "35_to_54"
  - 6-7 → "55_plus"
- **Data saved:** `age_cohort`, `age_cohort_collapsed`

#### S8 — Household Type
- **Component:** `SingleSelect` — 6 options
- **Options:**
  1. I live alone
  2. I live with a partner/spouse (no children under 18 at home)
  3. I live with a partner/spouse and children under 18
  4. I am a single parent with children under 18 at home
  5. I live with roommates or other adults (no children under 18)
  6. Other
- **Derivation:** `household_type_collapsed`:
  - 1 → "single"
  - 2 → "couple"
  - 3, 4 → "family"
  - 5, 6 → "other"
- **Data saved:** `household_type`, `household_type_collapsed`

**POST-S8 SERVER-SIDE ACTIONS (critical):**
1. Check segment quota → if full → terminate (termination_point = "quota_full")
2. Increment segment quota counter
3. Assign R1, R2, R3 using least-fill algorithm (see Section 7)
4. Save retailer assignments to respondent record

### Block 2: NPS (N1–N2)

Repeats for up to 3 retailers (R1, R2, R3). Each retailer gets its own sub-step within the block.

#### N1 — NPS Score
- **Component:** `NPSScale` — 0-10 horizontal scale
- **Question:** "On a scale of 0 to 10, where 0 means 'not at all likely' and 10 means 'extremely likely,' how likely are you to recommend [RETAILER] to a friend or family member?"
- **Desktop:** Horizontal row of 11 buttons (0-10) with "Not at all likely" on left, "Extremely likely" on right
- **Mobile:** Same horizontal row, tappable buttons, minimum 44×44px touch targets
- **Pipe:** Insert retailer display name into [RETAILER]
- **Data saved:** `nps_r[1|2|3]_score` (0-10)
- **Derivation:** `nps_r[1|2|3]_category`:
  - 9-10 → "promoter"
  - 7-8 → "passive"
  - 0-6 → "detractor"

#### N2 — NPS Verbatim
- **Component:** `OpenEndedText` — text area
- **Question:** "Why did you give that score?"
- **Validation:** Min 5 characters, max 500 characters. Show character counter.
- **Data saved:** `nps_r[1|2|3]_verbatim`

### Block 3: KPC (K1–K2)

#### K1 — Importance Ratings
- **Component:** `MatrixQuestion` or grouped `RatingScale`
- **Question:** "When choosing where to shop for groceries, how important are each of the following factors to you?"
- **Scale:** 1-5 (Not at all important → Extremely important)
- **Attributes (13 total — RANDOMIZE order):**
  1. Lowest prices (`lowest_price`)
  2. Best value for money (`best_value`)
  3. Product quality overall (`prod_quality`)
  4. Freshness of produce (`produce_fresh`)
  5. Quality of meat and seafood (`meat_seafood`)
  6. Private label / store brand offering (`private_label`)
  7. Breadth of product assortment (selection and variety) (`assortment`)
  8. Store cleanliness and appearance (`cleanliness`)
  9. Checkout speed and convenience (`checkout`)
  10. Store location / proximity to my home (`location`)
  11. Digital / online shopping experience (delivery, curbside pickup) (`digital`)
  12. Prepared foods, deli, and bakery (`prepared_foods`)
  13. Price stability / consistent pricing over time (`price_stability`)
- **Desktop:** Full 13-row matrix with 1-5 columns
- **Mobile:** Group 4-5 attributes per screen (3 screens). Each attribute gets a horizontal 1-5 button row.
- **Data saved:** `k1_imp_[attr_code]` (1-5) for each

#### K2 — Performance Ratings (per retailer)
- **Component:** Same as K1 but repeated for R1, R2, R3
- **Question:** "Now, thinking specifically about [RETAILER], how would you rate their performance on each of the following?"
- **Scale:** 1-5 (Very poor → Excellent)
- **Same 13 attributes as K1.** Randomize. Can match K1's random order for consistency.
- **Mobile:** Same grouping as K1 (4-5 per screen), repeated per retailer
- **Data saved:** `k2_perf_r[1|2|3]_[attr_code]` (1-5)

### Block 4: SOW Deep Dive (W2–W5)

Loops through R1, R2, R3. Only for retailers where SOW > 0%.

#### W2 — Retrospective Direction
- **Component:** `SingleSelect` — 5 options
- **Question:** "Compared to 12 months ago, how has your spending at [RETAILER] changed?"
- **Options:**
  1. Decreased significantly
  2. Decreased somewhat
  3. Stayed about the same
  4. Increased somewhat
  5. Increased significantly
- **Routing:** 5 (inc sig) → W3a. 1 (dec sig) → W3b. Otherwise → W4.
- **Data saved:** `sow_retro_store[1|2|3]_dir` (1-5)

#### W3a — Reason for Increase (only if W2 = 5)
- **Component:** `SingleSelect` — 9 options. Randomize 1-8, "Other" anchored last.
- **Options:**
  1. Prices at this store went down or I found better deals
  2. Product quality or freshness improved
  3. A new location opened that is more convenient for me
  4. They improved their product selection or assortment
  5. They launched or improved online ordering / delivery / curbside
  6. I switched spending away from a different store that disappointed me
  7. Someone I trust recommended this store
  8. I started using their loyalty program, coupons, or promotions more
  9. Other (please specify): [text field]
- **Data saved:** `sow_retro_store[1|2|3]_reason_inc`, `..._reason_inc_text`

#### W3b — Reason for Decrease (only if W2 = 1)
- **Component:** `SingleSelect` — 9 options. Randomize 1-8, "Other" anchored last.
- **Options:**
  1. Prices at this store went up
  2. Product quality or freshness declined
  3. A store location I used to visit closed or became less convenient
  4. Product selection or assortment got worse
  5. Their online ordering / delivery experience was poor or unavailable
  6. I found a better alternative at another store
  7. My household budget tightened and I needed to cut costs
  8. The store became less clean, organized, or pleasant to shop at
  9. Other (please specify): [text field]
- **Data saved:** `sow_retro_store[1|2|3]_reason_dec`, `..._reason_dec_text`

#### W4 — Forward-Looking Direction
- **Component:** `SingleSelect` — 3 options
- **Question:** "Over the next 12 months, do you expect your spending at [RETAILER] to change?"
- **Options:**
  1. Expect to decrease spending
  2. Expect spending to stay about the same
  3. Expect to increase spending
- **Routing:** 3 (increase) → W5a. 1 (decrease) → W5b. 2 (same) → end loop.
- **Data saved:** `sow_fwd_store[1|2|3]_dir` (1-3)

#### W5a — Reason for Expected Increase (only if W4 = 3)
- **Component:** `SingleSelect` — 8 options. Randomize 1-7, "Other" anchored last.
- **Options:**
  1. I expect them to offer competitive prices or better deals
  2. I expect product quality or freshness to continue being strong
  3. A new location is opening that is more convenient for me
  4. They are improving their product selection or assortment
  5. They are launching or improving online ordering / delivery
  6. I plan to consolidate more of my shopping at fewer stores
  7. My household income or budget is expected to increase
  8. Other (please specify): [text field]
- **Data saved:** `sow_fwd_store[1|2|3]_reason_inc`, `..._reason_inc_text`

#### W5b — Reason for Expected Decrease (only if W4 = 1)
- **Component:** `SingleSelect` — 8 options. Randomize 1-7, "Other" anchored last.
- **Options:**
  1. I expect prices at this store to continue rising
  2. I expect product quality or freshness to decline
  3. A store location I visit may close or become less convenient
  4. Their product selection is not meeting my needs
  5. I plan to switch to more online / delivery at another retailer
  6. I expect my household budget to tighten
  7. I've found or plan to try a better alternative
  8. Other (please specify): [text field]
- **Data saved:** `sow_fwd_store[1|2|3]_reason_dec`, `..._reason_dec_text`

### Block 5: Switching Costs & Loyalty (L1–L4)

#### L1 — Churn Risk Reason (customers only: primary_shopper or secondary_shopper)
- **Component:** `SingleSelect` — 8 options. Randomize 1-6. Last two anchored.
- **Question:** "What would be the most likely reason for you to reduce or stop shopping at Fareway?"
- **Options:**
  1. A lower-cost competitor opening or expanding near me
  2. A significant price increase at Fareway
  3. A noticeable decline in product quality at Fareway
  4. My regular Fareway store closing or relocating
  5. A competitor offering a much better online/delivery experience
  6. A competitor offering better product selection or specialty items
  7. Other (please specify): [text field] — **anchored**
  8. Nothing — I can't imagine a reason to stop shopping at Fareway — **anchored**
- **Data saved:** `churn_risk_reason` (1-8), `churn_risk_reason_text`

#### L1a — Improvement Verbatim (customers only)
- **Component:** `OpenEndedText`
- **Question:** "If there is one thing Fareway could do to improve your shopping experience, what would it be?"
- **Validation:** Max 500 characters. Min 5 characters.
- **Data saved:** `fareway_improve_verbatim`

#### L2 — Acquisition Trigger (aware_non_customer or lapsed)
- **Component:** `SingleSelect` — 8 options. Randomize 1-6. Last two anchored.
- **Question:** "What would most likely cause you to start shopping at Fareway?"
- **Options:**
  1. A Fareway store opening closer to where I live
  2. Lower prices than my current primary store
  3. Better product quality or selection than my current store
  4. A strong recommendation from someone I trust
  5. A strong online/delivery offering
  6. Better prepared foods, deli, or bakery options
  7. Other (please specify): [text field] — **anchored**
  8. Nothing — I'm not interested in shopping at Fareway — **anchored**
- **Data saved:** `acquisition_trigger` (1-8), `acquisition_trigger_text`

#### L2a — Trial Verbatim (aware_non_customer or lapsed)
- **Component:** `OpenEndedText`
- **Question:** "If there is one thing Fareway could do to get you to try shopping there, what would it be?"
- **Validation:** Max 500 characters. Min 5 characters.
- **Data saved:** `fareway_tryme_verbatim`

#### L3 — Channel Current (all respondents)
- **Component:** `SingleSelect` — 5 options
- **Question:** "How do you primarily do your grocery shopping today?"
- **Options:**
  1. Entirely in-store
  2. Mostly in-store, with some online ordering (delivery or curbside)
  3. About half in-store, half online
  4. Mostly online (delivery or curbside), with some in-store trips
  5. Entirely online (delivery or curbside)
- **Derivation:** `channel_current_collapsed`:
  - 1-2 → "in_store"
  - 3 → "hybrid"
  - 4-5 → "online"
- **Data saved:** `channel_current`, `channel_current_collapsed`

#### L4 — Channel Change (all respondents)
- **Component:** `SingleSelect` — 5 options
- **Question:** "How has your grocery shopping channel mix changed compared to 2 years ago?"
- **Options:**
  1. I do significantly more online grocery shopping now
  2. I do somewhat more online grocery shopping now
  3. My mix of in-store vs. online has stayed about the same
  4. I do somewhat less online grocery shopping now (more in-store)
  5. I do significantly less online grocery shopping now (more in-store)
- **Data saved:** `channel_change` (1-5)

### Block 6: Frequency & Basket (F1–F4)

#### F1 — Total Frequency
- **Component:** `SingleSelect` — 5 options
- **Question:** "On average, how many times per month do you shop for groceries across all stores?"
- **Options:**
  1. 1-2 times per month
  2. 3-4 times per month
  3. 5-6 times per month
  4. 7-8 times per month (about twice a week)
  5. 9 or more times per month
- **Data saved:** `freq_total` (1-5)

#### F2 — Fareway Frequency (customers only: primary_shopper or secondary_shopper)
- **Component:** `SingleSelect` — 5 options
- **Question:** "How many times per month do you shop at Fareway specifically?"
- **Options:**
  1. Less than once a month
  2. 1-2 times per month
  3. 3-4 times per month
  4. 5-6 times per month
  5. 7 or more times per month
- **Data saved:** `freq_fareway` (1-5)

#### F3 — Average Basket
- **Component:** `SingleSelect` — 6 options
- **Question:** "What is your approximate average spend per grocery shopping trip (at any store)?"
- **Options:**
  1. Under $25
  2. $25 – $50
  3. $51 – $100
  4. $101 – $150
  5. $151 – $200
  6. Over $200
- **Derivation:** `avg_basket_midpoint`: 12.50, 37.50, 75.50, 125.50, 175.50, 250.00
- **Data saved:** `avg_basket` (1-6), `avg_basket_midpoint`

#### F4 — Trip Trend
- **Component:** `SingleSelect` — 5 options
- **Question:** "Compared to 12 months ago, are you making more, about the same number, or fewer grocery shopping trips overall?"
- **Options:**
  1. Significantly more trips
  2. Somewhat more trips
  3. About the same number of trips
  4. Somewhat fewer trips
  5. Significantly fewer trips
- **Data saved:** `trip_trend` (1-5)

### Block 7: Macro Sensitivity (M1–M5)

#### M1 — Budget Trend
- **Component:** `SingleSelect` — 5 options
- **Question:** "Over the past 12 months, has your household grocery budget increased, stayed about the same, or decreased?"
- **Options:**
  1. Increased significantly (up more than 20%)
  2. Increased somewhat (up roughly 5-20%)
  3. Stayed about the same
  4. Decreased somewhat (down roughly 5-20%)
  5. Decreased significantly (down more than 20%)
- **Data saved:** `budget_trend` (1-5)

#### M2 — Macro Response
- **Component:** `SingleSelect` — 7 options. Randomize 1-5. "Other" and "I would not change" anchored bottom.
- **Question:** "If your household were to face a significant financial challenge, how would you most likely adjust your grocery spending?"
- **Options:**
  1. I would buy lower-cost items or store brands at the same stores
  2. I would switch to lower-cost grocery stores
  3. I would reduce the overall quantity of groceries I buy
  4. I would cut back on premium, organic, or specialty items
  5. I would use more coupons, seek out deals, and shop sales more intentionally
  6. Other (please specify): [text field] — **anchored**
  7. I would not change my grocery spending — **anchored**
- **Data saved:** `macro_response` (1-7), `macro_response_text`

#### M3 — Trade-Down Behavior
- **Component:** `MultiSelect` — 7 options. Randomize 1-6. "None of the above" anchored bottom.
- **Question:** "Have you made any of the following changes to your grocery shopping in the past 12 months due to cost concerns?"
- **Options:**
  1. Switched from name-brand to store-brand / private-label products (`tradedown_storebrand`)
  2. Reduced purchases of organic items (`tradedown_organic`)
  3. Bought fewer premium or specialty products (`tradedown_premium`)
  4. Shopped at a discount grocer (e.g., Aldi, Save-A-Lot) more often (`tradedown_discount_grocer`)
  5. Used more coupons or actively sought out deals and promotions (`tradedown_coupons`)
  6. Reduced food waste by buying less overall or planning meals more carefully (`tradedown_food_waste`)
  7. None of the above — I have not made changes due to cost concerns (`tradedown_none`) — **anchored**
- **Validation:** "None of the above" is mutually exclusive with other options. If selected, deselect all others. If any other option selected, deselect "None."
- **Derivation:** `tradedown_count` = sum of options 1-6 selected (excluding "none")
- **Data saved:** `tradedown_[option]` (1 or 0 each), `tradedown_count`

#### M4 — Best Value Retailer
- **Component:** `MultiSelect` with max 2 selections
- **Question:** "Which grocery retailer do you believe offers the best overall value for money in your area?"
- **Display:** Show only retailers where respondent's funnel >= 2 (aware or better). Randomize. "Other" and "No opinion / not sure" anchored bottom.
- **Validation:** Select 1-2 retailers OR "No opinion." "No opinion" is mutually exclusive.
- **Data saved:** `best_value_1`, `best_value_2` (retailer names, null if fewer selected)

#### M5a — Price Raised Ranking
- **Component:** `RankingQuestion`
- **Question:** "Which grocery retailers in your area have raised prices the most?"
- **Display:** Only retailers where funnel >= 2. Randomize.
- **Desktop:** Drag-and-drop. Left panel = available retailers. Right panel = ranking slots (1st, 2nd, 3rd).
- **Mobile:** Sequential tap-to-rank. Tap a retailer → it gets assigned the next rank (1st, 2nd, 3rd). Tap again to deselect. Clear visual of current rankings.
- **Validation:** Must rank at least 1 retailer OR select "No opinion / not sure"
- **Data saved:** `price_raised_rank_1`, `price_raised_rank_2`, `price_raised_rank_3` (retailer names, null if fewer)

#### M5b — Price Stable Ranking
- Same as M5a but for "Which grocery retailers have done the best job keeping prices stable or low?"
- **Independent randomization** from M5a
- **Data saved:** `price_stable_rank_1`, `price_stable_rank_2`, `price_stable_rank_3`

### Block 8: Demographics (D1–D7)

**All questions optional.** Respondent can skip any/all. Show "Skip" button alongside "Continue."

#### D1 — Gender
- **Options:** 1=Male, 2=Female, 3=Non-binary/third gender, 4=Prefer not to say
- **Data:** `gender`

#### D2 — Education
- **Options:** 1=Less than high school, 2=High school diploma or GED, 3=Some college or associate degree, 4=Bachelor's degree, 5=Graduate or professional degree, 6=Prefer not to say
- **Data:** `education`

#### D3 — Employment
- **Options:** 1=Employed full-time, 2=Employed part-time, 3=Self-employed, 4=Unemployed and looking for work, 5=Retired, 6=Student, 7=Homemaker/stay-at-home parent, 8=Other/prefer not to say
- **Data:** `employment`

#### D4 — Area Type
- **Options:** 1=Urban, 2=Suburban, 3=Small town (population under 25,000), 4=Rural
- **Data:** `area_type`

#### D5 — Distance to Fareway
- **Options:** 1=Less than 5 minutes by car, 2=5-10 minutes, 3=11-20 minutes, 4=21-30 minutes, 5=More than 30 minutes, 6=I'm not sure / don't know where the nearest Fareway is
- **Data:** `distance_fareway`

#### D6 — Household Size
- **Options:** 1=1 (just me), 2=2, 3=3, 4=4, 5=5 or more
- **Data:** `household_size`

#### D7 — Ethnicity
- **Options:** 1=White/Caucasian, 2=Black/African American, 3=Hispanic/Latino, 4=Asian/Asian American, 5=Native American/Alaska Native, 6=Two or more races/Multiracial, 7=Other (please specify), 8=Prefer not to say
- **Data:** `ethnicity`, `ethnicity_other_text`

---

## 7. Retailer Assignment & Least-Fill Algorithm

### When It Runs
After S8, once the segment is confirmed and quotas are checked.

### Input
- `stores_last_3m`: array of retailer codes where funnel = 6
- `primary_store`: retailer with highest SOW from S4
- `segment`: respondent's segment

### Algorithm

```typescript
async function assignRetailers(
  storesLast3m: string[],
  primaryStore: string,
  segment: string
): Promise<{ r1: string; r2: string | null; r3: string | null }> {
  
  // R1: Always the primary store
  const r1 = primaryStore;
  let remaining = storesLast3m.filter(s => s !== r1);
  
  // R2: Fareway if secondary shopper, else least-fill
  let r2: string | null = null;
  if (segment === 'secondary_shopper' && remaining.includes('fareway')) {
    r2 = 'fareway';
    remaining = remaining.filter(s => s !== 'fareway');
  } else if (remaining.length > 0) {
    r2 = await leastFillSelect(remaining);
    remaining = remaining.filter(s => s !== r2);
  }
  
  // R3: Least-fill from remaining
  let r3: string | null = null;
  if (remaining.length > 0) {
    r3 = await leastFillSelect(remaining);
  }
  
  return { r1, r2, r3 };
}
```

### Least-Fill Select (atomic database operation)

```typescript
async function leastFillSelect(eligibleStores: string[]): Promise<string> {
  // This must be atomic — use a Supabase RPC function or transaction
  
  // 1. Query current counts for eligible stores
  const { data: counts } = await supabase
    .from('retailer_fill_counts')
    .select('retailer_code, count')
    .in('retailer_code', eligibleStores);
  
  // 2. Find minimum count
  const minCount = Math.min(...counts.map(c => c.count));
  
  // 3. Filter to candidates at minimum
  const candidates = counts.filter(c => c.count === minCount);
  
  // 4. Random pick from candidates
  const selected = candidates[Math.floor(Math.random() * candidates.length)];
  
  // 5. Increment counter (atomic)
  await supabase.rpc('increment_retailer_count', { 
    retailer: selected.retailer_code 
  });
  
  return selected.retailer_code;
}
```

### Supabase RPC Function (create via SQL)

```sql
CREATE OR REPLACE FUNCTION increment_retailer_count(retailer TEXT)
RETURNS void AS $$
BEGIN
  UPDATE retailer_fill_counts
  SET count = count + 1
  WHERE retailer_code = retailer;
END;
$$ LANGUAGE plpgsql;
```

**Note:** For true atomicity under concurrent load, the select + increment should be wrapped in a transaction with row-level locking:

```sql
CREATE OR REPLACE FUNCTION least_fill_select(eligible_stores TEXT[])
RETURNS TEXT AS $$
DECLARE
  selected_retailer TEXT;
BEGIN
  SELECT retailer_code INTO selected_retailer
  FROM retailer_fill_counts
  WHERE retailer_code = ANY(eligible_stores)
  ORDER BY count ASC, RANDOM()
  LIMIT 1
  FOR UPDATE;
  
  UPDATE retailer_fill_counts
  SET count = count + 1
  WHERE retailer_code = selected_retailer;
  
  RETURN selected_retailer;
END;
$$ LANGUAGE plpgsql;
```

---

## 8. Segment Classification Logic

```typescript
function classifySegment(
  farewayFunnel: number,
  primaryStore: string | null
): string {
  if (farewayFunnel === 6 && primaryStore === 'fareway') {
    return 'primary_shopper';
  }
  if (farewayFunnel === 6 && primaryStore !== 'fareway') {
    return 'secondary_shopper';
  }
  if (farewayFunnel === 4 || farewayFunnel === 5) {
    return 'lapsed';
  }
  if (farewayFunnel === 2 || farewayFunnel === 3) {
    return 'aware_non_customer';
  }
  if (farewayFunnel === 1) {
    return 'unaware_non_customer';
  }
  throw new Error(`Invalid fareway funnel value: ${farewayFunnel}`);
}
```

### When Segments Affect Display
| Segment | Shows L1/L1a | Shows L2/L2a | Shows F2 | Shows Block 4 SOW loop |
|---|---|---|---|---|
| primary_shopper | ✅ | ❌ | ✅ | ✅ (for stores with SOW > 0) |
| secondary_shopper | ✅ | ❌ | ✅ | ✅ |
| lapsed | ❌ | ✅ | ❌ | ❌ (no stores with funnel=6, or very few) |
| aware_non_customer | ❌ | ✅ | ❌ | ❌ |
| unaware_non_customer | ❌ | ❌* | ❌ | ❌ |

*Note: Unaware non-customers skip both L1 and L2 (they don't know about Fareway). They still answer L3 and L4.

**IMPORTANT CORRECTION:** Looking at the dev spec, L2 shows for `aware_non_customer` or `lapsed` only. Unaware non-customers skip L1/L1a AND L2/L2a, but still answer L3 and L4. This is confirmed in the display conditions table.

---

## 9. Termination Logic

| Point | Condition | `termination_point` value | Message |
|---|---|---|---|
| S1 | ZIP not in trade area | `S1` | "Thank you for your interest, but you are not eligible for this survey at this time." |
| S2 | grocery_decisionmaker = 3 | `S2` | "Thank you, but we are looking for household grocery decision-makers for this survey." |
| S3 | No retailer has funnel >= 5 | `S3` | "Thank you, but we are looking for active grocery shoppers for this survey." |
| S6 | income_band = 7 (prefer not to say) | `S6_PNTS` | "Thank you for your time. You may now close this window." |
| S7 | age_cohort = 1 (under 18) | `S7` | "Thank you, but you must be 18 or older to participate in this survey." |
| S7 | age_cohort = 8 (prefer not to say) | `S7_PNTS` | "Thank you for your time. You may now close this window." |
| Post-S8 | Segment quota is full | `quota_full` | "Thank you for your interest, but we have received enough responses in your category. We appreciate your time." |

**On termination:**
1. Set `completion_status = 'terminated'`
2. Set `termination_point` to the appropriate value
3. Record `end_timestamp` and compute `duration_seconds`
4. Redirect to `/survey/terminated?reason=[termination_point]`
5. The terminated page shows the appropriate message

---

## 10. Randomization Rules

### Core Principle
**NEVER randomize scales** (1-5, 0-10, increase/decrease). Only randomize lists where order could introduce primacy/recency bias.

### Implementation

```typescript
function randomizeWithAnchors(
  items: Array<{ value: any; label: string; anchored?: boolean }>,
  seed?: string  // optional seed for reproducibility
): typeof items {
  const anchored = items.filter(i => i.anchored);
  const randomizable = items.filter(i => !i.anchored);
  
  // Fisher-Yates shuffle on randomizable items
  for (let i = randomizable.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [randomizable[i], randomizable[j]] = [randomizable[j], randomizable[i]];
  }
  
  // Anchored items go at the end, in their original relative order
  return [...randomizable, ...anchored];
}
```

### Randomization Table
| Question | What to Randomize | Anchored (always last) |
|---|---|---|
| S3 | Retailer rows | "Other (please specify)" |
| S4 | Retailer list | "All other stores" |
| S4a | Retailer rows | N/A |
| S5a | Retailer checkboxes | "Other" |
| K1 | Attribute rows | N/A (all randomize) |
| K2 | Attribute rows | Can match K1 random order |
| L1 | Options 1-6 | "Other" + "Nothing" |
| L2 | Options 1-6 | "Other" + "Nothing" |
| M2 | Options 1-5 | "Other" + "I would not change" |
| M3 | Checkboxes 1-6 | "None of the above" |
| M4 | Retailer list | "Other" + "No opinion" |
| M5a | Retailer list | "No opinion" as skip |
| M5b | Retailer list (independent randomization from M5a) | "No opinion" as skip |
| W3a | Options 1-8 | "Other" |
| W3b | Options 1-8 | "Other" |
| W5a | Options 1-7 | "Other" |
| W5b | Options 1-7 | "Other" |

---

## 11. Mobile UX Specifications

### Breakpoints
```css
/* Mobile: < 768px */
/* Tablet: 768px - 1023px */
/* Desktop: >= 1024px */
```

### Component Behavior by Device

| Component | Desktop | Mobile |
|---|---|---|
| **S3 Funnel Matrix** | Full 15×6 grid | 3 retailers per card/screen (5 screens). Abbreviated column labels. |
| **S4 SOW Allocation** | Sliders with numeric input | Stacked number inputs with sticky running total |
| **K1/K2 Matrix** | Full 13×5 grid | 4-5 attributes per screen with horizontal 1-5 buttons |
| **NPS 0-10 Scale** | Horizontal button row | Horizontal button row (44px min tap targets) |
| **M5 Ranking** | Drag-and-drop (left/right panels) | Tap-to-rank sequential selection |
| **All radio/checkbox** | Standard styling | Min 44×44px tap targets, generous spacing |
| **Text inputs** | Standard | Full-width, min 16px font (prevents iOS zoom) |

### Design Tokens
```css
:root {
  --color-primary: #2563EB;        /* Blue - buttons, active states */
  --color-primary-hover: #1D4ED8;
  --color-bg: #FFFFFF;             /* Main background */
  --color-bg-signpost: #FFF8E1;   /* Warm yellow - transition screens */
  --color-text: #1F2937;          /* Dark gray - body text */
  --color-text-secondary: #6B7280; /* Medium gray - labels */
  --color-border: #D1D5DB;        /* Light gray - borders */
  --color-error: #DC2626;         /* Red - validation errors */
  --color-success: #059669;       /* Green - valid states */
  --font-body: 'Inter', system-ui, sans-serif;
  --font-size-body: 16px;
  --font-size-question: 18px;
  --font-size-small: 14px;
}
```

### Progress Bar
- Visual only — no percentage shown
- Advances proportionally through 8 main blocks
- Signpost screens do NOT advance the progress bar
- Use a thin bar at the top of the survey layout (4px height)
- Block weights for progress calculation:
  - Block 1 (Screener): 20%
  - Block 2 (NPS): 10%
  - Block 3 (KPC): 20%
  - Block 4 (SOW Deep Dive): 15%
  - Block 5 (Switching): 10%
  - Block 6 (Frequency): 5%
  - Block 7 (Macro): 15%
  - Block 8 (Demographics): 5%

---

## 12. Admin Dashboard

### URL: `/admin/dashboard`
### Auth: `/admin/login` — simple form, validates against env vars

### Dashboard Layout (simple tables)

**Section 1: Segment Quotas**
| Segment | Current | Min | Max | % of Max | Status |
|---|---|---|---|---|---|
| primary_shopper | 1,247 | 2,500 | 3,000 | 41.6% | Filling |
| ... | ... | ... | ... | ... | ... |

**Section 2: Phase 1 Demographic Fill Rates**
| Dimension | Category | Current % | Census Target % | Delta |
|---|---|---|---|---|
| Income | Under $50K | 34% | 38% | -4pp |
| Income | $50-100K | 41% | 35% | +6pp |
| ... | ... | ... | ... | ... |

**Section 3: Least-Fill Counters**
| Retailer | NPS/KPC Response Count |
|---|---|
| Fareway | 2,341 |
| Hy-Vee | 1,892 |
| ... | ... |

**Section 4: Completion Metrics**
| Metric | Value |
|---|---|
| Total starts | 8,432 |
| Total completes | 6,891 |
| Total terminated | 1,241 |
| Total partial/abandoned | 300 |
| Average completion time | 9m 42s |
| Median completion time | 8m 55s |

**Section 5: Quality Flags**
| Flag | Count | % of Completes |
|---|---|---|
| Speeders (<3 min) | 42 | 0.6% |
| Straightliners (K1) | 18 | 0.3% |
| Straightliners (K2) | 23 | 0.3% |
| Gibberish (NPS) | 7 | 0.1% |
| SOW Ties | 89 | 1.3% |

**Export Button:** Prominently placed at top. "Export All Responses (CSV)" — generates server-side, triggers browser download.

---

## 13. CSV Export Specification

### Format
- Encoding: UTF-8 with BOM
- Delimiter: Comma
- Text qualifier: Double quotes (escape internal quotes as "")
- One row per respondent (including terminated)
- Null values = empty cell (not 'NULL' string)
- Filename: `fareway_survey_export_YYYYMMDD_HHMM.csv`

### Column Order
Exact order as specified in Section 3 (Database Schema), reading top to bottom. Every column present in every row, even if null.

### Implementation
Use `papaparse` library to generate CSV server-side:

```typescript
import Papa from 'papaparse';

// In /api/admin/export/route.ts
export async function GET(req: Request) {
  // Auth check...
  
  const { data: respondents } = await supabase
    .from('respondents')
    .select('*')
    .order('start_timestamp', { ascending: true });
  
  const csv = Papa.unparse(respondents, {
    columns: CSV_COLUMN_ORDER,  // from constants.ts
    header: true
  });
  
  // Add BOM for Excel compatibility
  const bom = '\uFEFF';
  const blob = bom + csv;
  
  return new Response(blob, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="fareway_survey_export_${timestamp}.csv"`
    }
  });
}
```

---

## 14. Data Quality Flags

Computed on survey completion (in `/api/survey/complete`).

```typescript
function computeQualityFlags(respondent: Respondent): QualityFlags {
  return {
    qc_speeder: respondent.duration_seconds < 180 ? 1 : 0,
    
    qc_straightliner_k1: allIdentical([
      respondent.k1_imp_lowest_price,
      respondent.k1_imp_best_value,
      respondent.k1_imp_prod_quality,
      respondent.k1_imp_produce_fresh,
      respondent.k1_imp_meat_seafood,
      respondent.k1_imp_private_label,
      respondent.k1_imp_assortment,
      respondent.k1_imp_cleanliness,
      respondent.k1_imp_checkout,
      respondent.k1_imp_location,
      respondent.k1_imp_digital,
      respondent.k1_imp_prepared_foods,
      respondent.k1_imp_price_stability,
    ]) ? 1 : 0,
    
    qc_straightliner_k2: (
      allIdentical(getK2Values(respondent, 'r1')) ||
      allIdentical(getK2Values(respondent, 'r2')) ||
      allIdentical(getK2Values(respondent, 'r3'))
    ) ? 1 : 0,
    
    qc_gibberish_nps: (
      isGibberish(respondent.nps_r1_verbatim) ||
      isGibberish(respondent.nps_r2_verbatim) ||
      isGibberish(respondent.nps_r3_verbatim)
    ) ? 1 : 0,
    
    qc_gibberish_l1a: isGibberish(respondent.fareway_improve_verbatim) ? 1 : 0,
    qc_gibberish_l2a: isGibberish(respondent.fareway_tryme_verbatim) ? 1 : 0,
    
    // qc_sow_tie is set during S4 processing
  };
}

function allIdentical(values: (number | null)[]): boolean {
  const nonNull = values.filter(v => v !== null);
  if (nonNull.length < 2) return false;
  return nonNull.every(v => v === nonNull[0]);
}

function isGibberish(text: string | null): boolean {
  if (!text) return false;
  // Check for keyboard spam patterns
  const hasRealWords = /[a-zA-Z]{3,}/.test(text);
  const hasExcessiveRepeats = /(.)\1{4,}/.test(text);
  const hasOnlyConsonants = /^[^aeiouAEIOU\s]{5,}$/.test(text.replace(/[^a-zA-Z]/g, ''));
  return !hasRealWords || hasExcessiveRepeats || hasOnlyConsonants;
}
```

---

## 15. ZIP Code Lookup & Trade Area

### Seed Data
The ZIP lookup table should be seeded with ZIPs within a ~15-minute drive of Fareway stores across IA, IL, KS, MN, MO, NE, SD.

**Key DMAs:** Des Moines, Cedar Rapids, Sioux City, Iowa City, Waterloo/Cedar Falls, Quad Cities, Omaha, Lincoln, Sioux Falls, Kansas City, Rochester/Owatonna, Fairmont/Worthington

Create the seed file as `/data/zip_lookup.csv` with columns: `zip_code,dma,state`

The client should review and edit this file before launch. It can be re-imported to the `zip_lookup` table via a simple admin function or SQL insert.

### Sample Store ZIPs (from project docs)
```
50313, 50310, 50265, 50266, 50321, 50327, 50131, 50021, 50009, 50010,
50014, 50023, 50036, 50112, 50126, 50158, 50201, 50208, 50219, 50248,
50309, 50315, 50322, 50613, 50616, 50677, 50701, 51301, 51334, 51360,
52001, 52040, 52240, 52302, 52404, 52501, 52601, 52761, 52801, 61254,
61265, 66012, 66062, 64106, 68028, 68046, 68510, 57049, 57106, 55920,
55021, 56031
```

These are store ZIPs only — the full trade area includes surrounding ZIPs. I'll generate an expanded list (~500-800 ZIPs) covering nearby areas.

---

## 16. Signpost / Transition Screens

### Component: `SignpostScreen`
- Background: `#FFF8E1` (warm yellow)
- Full-width container, centered text
- "Continue" button at bottom
- Does NOT count toward progress bar
- No questions — display only

### Signpost Content & Placement
| Position | Text |
|---|---|
| Before S1 | "First, we'd like to confirm a few things about you and your household." |
| Before S3 | "Now we'd like to understand which grocery stores you're familiar with and where you've shopped." |
| Before S4 | "Next, we'd like to understand how you divide your grocery spending." |
| Before S6 | "Finally in this section, a few questions about you and your household. This helps us ensure we're hearing from a representative group of shoppers." |
| Before Block 2 | "We'd now like to ask about your experience with a few specific grocery stores. For each store, we'll ask you one quick question." |
| Before Block 3 | "Now we'd like to understand what matters most to you when choosing a grocery store, and how the stores you shop at measure up." |
| Before Block 4 | "Now we'd like to understand how your grocery spending has changed recently and where you see it going. We'll ask about a few stores one at a time." |
| Block 4 loop (per retailer) | "The next few questions are about your spending at [RETAILER]." |
| Before Block 5 | "Now we have a few questions about what drives your loyalty to the stores you shop at — and what might cause you to change your habits." |
| Before L3 | "A couple of quick questions about how you shop for groceries." |
| Before Block 6 | "Almost there! The next few questions are about how often you shop and how much you typically spend." |
| Before Block 7 | "The last few questions are about how economic conditions have affected your grocery shopping." |
| Before Block 8 | "Last section! Just a few optional questions about you to help us analyze the results." |

---

## 17. Validation Rules

| Field | Rule | Error Message |
|---|---|---|
| S1 ZIP | Exactly 5 numeric digits | "Please enter a valid 5-digit ZIP code." |
| S1 ZIP | Must be in zip_lookup table | (Terminate — not an error message) |
| S4 SOW | Must sum to exactly 100% | "Your allocations must add up to 100%. Please adjust." |
| S4 SOW | Each value 0-100, integer | "Please enter a whole number between 0 and 100." |
| N2 verbatim | Min 5 chars, max 500 | "Please provide at least 5 characters." / "Maximum 500 characters." |
| L1a, L2a verbatim | Min 5 chars, max 500 | Same as above |
| M5 ranking | At least 1 ranked OR "No opinion" | "Please rank at least one retailer or select 'No opinion.'" |
| Single-select | Exactly 1 selected | "Please select one option." |
| Multi-select | At least 1 (unless "None" present) | "Please select at least one option." |
| M3 "None" | Mutually exclusive | Auto-deselect others when "None" checked, and vice versa |
| M4 | Max 2 selections | "Please select up to 2 retailers." |

---

## 18. Constants & Configuration

### `lib/constants.ts`

```typescript
// === RETAILERS ===
export const RETAILERS = [
  { code: 'fareway', display: 'Fareway', shortDisplay: 'Fareway' },
  { code: 'hyvee', display: 'Hy-Vee', shortDisplay: 'Hy-Vee' },
  { code: 'kroger', display: 'Kroger', shortDisplay: 'Kroger' },
  { code: 'aldi', display: 'Aldi', shortDisplay: 'Aldi' },
  { code: 'walmart', display: 'Walmart Grocery / Walmart Supercenter', shortDisplay: 'Walmart' },
  { code: 'costco', display: 'Costco', shortDisplay: 'Costco' },
  { code: 'meijer', display: 'Meijer', shortDisplay: 'Meijer' },
  { code: 'target', display: 'Target (grocery section)', shortDisplay: 'Target' },
  { code: 'wholefoods', display: 'Whole Foods Market', shortDisplay: 'Whole Foods' },
  { code: 'traderjoes', display: "Trader Joe's", shortDisplay: "Trader Joe's" },
  { code: 'samsclub', display: "Sam's Club", shortDisplay: "Sam's Club" },
  { code: 'pricechopper', display: 'Price Chopper', shortDisplay: 'Price Chopper' },
  { code: 'schnucks', display: 'Schnucks', shortDisplay: 'Schnucks' },
  { code: 'savealot', display: 'Save-A-Lot', shortDisplay: 'Save-A-Lot' },
  { code: 'other', display: 'Other (please specify)', shortDisplay: 'Other' },
] as const;

// === KPC ATTRIBUTES ===
export const KPC_ATTRIBUTES = [
  { code: 'lowest_price', label: 'Lowest prices' },
  { code: 'best_value', label: 'Best value for money' },
  { code: 'prod_quality', label: 'Product quality overall' },
  { code: 'produce_fresh', label: 'Freshness of produce' },
  { code: 'meat_seafood', label: 'Quality of meat and seafood' },
  { code: 'private_label', label: 'Private label / store brand offering' },
  { code: 'assortment', label: 'Breadth of product assortment (selection and variety)' },
  { code: 'cleanliness', label: 'Store cleanliness and appearance' },
  { code: 'checkout', label: 'Checkout speed and convenience' },
  { code: 'location', label: 'Store location / proximity to my home' },
  { code: 'digital', label: 'Digital / online shopping experience (delivery, curbside pickup)' },
  { code: 'prepared_foods', label: 'Prepared foods, deli, and bakery' },
  { code: 'price_stability', label: 'Price stability / consistent pricing over time' },
] as const;

// === FUNNEL LABELS ===
export const FUNNEL_LABELS = [
  { value: 1, label: 'Not aware of this store', shortLabel: 'Not aware' },
  { value: 2, label: 'Aware but never considered shopping there', shortLabel: 'Aware' },
  { value: 3, label: 'Considered but never shopped there', shortLabel: 'Considered' },
  { value: 4, label: 'Shopped there in the past but not in the last 12 months', shortLabel: 'Past shopper' },
  { value: 5, label: 'Shopped there in the last 12 months but not the last 3 months', shortLabel: 'Last 12m' },
  { value: 6, label: 'Shopped there in the last 3 months', shortLabel: 'Last 3m' },
] as const;

// === IMPORTANCE SCALE ===
export const IMPORTANCE_SCALE = [
  { value: 1, label: 'Not at all important' },
  { value: 2, label: 'Slightly important' },
  { value: 3, label: 'Moderately important' },
  { value: 4, label: 'Very important' },
  { value: 5, label: 'Extremely important' },
] as const;

// === PERFORMANCE SCALE ===
export const PERFORMANCE_SCALE = [
  { value: 1, label: 'Very poor' },
  { value: 2, label: 'Below average' },
  { value: 3, label: 'Average' },
  { value: 4, label: 'Good' },
  { value: 5, label: 'Excellent' },
] as const;

// === BASKET MIDPOINTS ===
export const BASKET_MIDPOINTS: Record<number, number> = {
  1: 12.50,
  2: 37.50,
  3: 75.50,
  4: 125.50,
  5: 175.50,
  6: 250.00,
};

// === SEGMENT QUOTAS ===
export const SEGMENT_QUOTAS = {
  primary_shopper: { min: 2500, max: 3000 },
  secondary_shopper: { min: 1500, max: 2000 },
  lapsed: { min: 800, max: 1000 },
  aware_non_customer: { min: 1500, max: 2000 },
  unaware_non_customer: { min: 500, max: 800 },
} as const;

// === CSV COLUMN ORDER ===
export const CSV_COLUMN_ORDER = [
  'respondent_id', 'phase', 'segment', 'completion_status', 'termination_point',
  'start_timestamp', 'end_timestamp', 'duration_seconds', 'device_type',
  'zip_code', 'dma', 'grocery_decisionmaker',
  'funnel_fareway', 'funnel_hyvee', 'funnel_kroger', 'funnel_aldi',
  'funnel_walmart', 'funnel_costco', 'funnel_meijer', 'funnel_target',
  'funnel_wholefoods', 'funnel_traderjoes', 'funnel_samsclub',
  'funnel_pricechopper', 'funnel_schnucks', 'funnel_savealot',
  'funnel_other', 'funnel_other_text',
  'sow_store1_name', 'sow_store1_pct', 'sow_store2_name', 'sow_store2_pct',
  'sow_store3_name', 'sow_store3_pct', 'sow_other_pct', 'primary_store',
  'freq_store1', 'freq_store2', 'freq_store3',
  'switched_out_any', 'switched_out_fareway', 'switched_out_hyvee',
  'switched_out_kroger', 'switched_out_aldi', 'switched_out_walmart',
  'switched_out_costco', 'switched_out_meijer', 'switched_out_target',
  'switched_out_wholefoods', 'switched_out_traderjoes', 'switched_out_samsclub',
  'switched_out_pricechopper', 'switched_out_schnucks', 'switched_out_savealot',
  'switched_out_other', 'switched_out_other_text',
  'income_band', 'income_band_collapsed', 'age_cohort', 'age_cohort_collapsed',
  'household_type', 'household_type_collapsed',
  'nps_r1_store', 'nps_r1_score', 'nps_r1_category', 'nps_r1_verbatim',
  'nps_r2_store', 'nps_r2_score', 'nps_r2_category', 'nps_r2_verbatim',
  'nps_r3_store', 'nps_r3_score', 'nps_r3_category', 'nps_r3_verbatim',
  'k1_imp_lowest_price', 'k1_imp_best_value', 'k1_imp_prod_quality',
  'k1_imp_produce_fresh', 'k1_imp_meat_seafood', 'k1_imp_private_label',
  'k1_imp_assortment', 'k1_imp_cleanliness', 'k1_imp_checkout',
  'k1_imp_location', 'k1_imp_digital', 'k1_imp_prepared_foods',
  'k1_imp_price_stability',
  // K2 R1
  'k2_perf_r1_lowest_price', 'k2_perf_r1_best_value', 'k2_perf_r1_prod_quality',
  'k2_perf_r1_produce_fresh', 'k2_perf_r1_meat_seafood', 'k2_perf_r1_private_label',
  'k2_perf_r1_assortment', 'k2_perf_r1_cleanliness', 'k2_perf_r1_checkout',
  'k2_perf_r1_location', 'k2_perf_r1_digital', 'k2_perf_r1_prepared_foods',
  'k2_perf_r1_price_stability',
  // K2 R2
  'k2_perf_r2_lowest_price', 'k2_perf_r2_best_value', 'k2_perf_r2_prod_quality',
  'k2_perf_r2_produce_fresh', 'k2_perf_r2_meat_seafood', 'k2_perf_r2_private_label',
  'k2_perf_r2_assortment', 'k2_perf_r2_cleanliness', 'k2_perf_r2_checkout',
  'k2_perf_r2_location', 'k2_perf_r2_digital', 'k2_perf_r2_prepared_foods',
  'k2_perf_r2_price_stability',
  // K2 R3
  'k2_perf_r3_lowest_price', 'k2_perf_r3_best_value', 'k2_perf_r3_prod_quality',
  'k2_perf_r3_produce_fresh', 'k2_perf_r3_meat_seafood', 'k2_perf_r3_private_label',
  'k2_perf_r3_assortment', 'k2_perf_r3_cleanliness', 'k2_perf_r3_checkout',
  'k2_perf_r3_location', 'k2_perf_r3_digital', 'k2_perf_r3_prepared_foods',
  'k2_perf_r3_price_stability',
  // Block 4 SOW Deep Dive
  'sow_retro_store1_dir', 'sow_retro_store1_reason_inc', 'sow_retro_store1_reason_inc_text',
  'sow_retro_store1_reason_dec', 'sow_retro_store1_reason_dec_text',
  'sow_fwd_store1_dir', 'sow_fwd_store1_reason_inc', 'sow_fwd_store1_reason_inc_text',
  'sow_fwd_store1_reason_dec', 'sow_fwd_store1_reason_dec_text',
  'sow_retro_store2_dir', 'sow_retro_store2_reason_inc', 'sow_retro_store2_reason_inc_text',
  'sow_retro_store2_reason_dec', 'sow_retro_store2_reason_dec_text',
  'sow_fwd_store2_dir', 'sow_fwd_store2_reason_inc', 'sow_fwd_store2_reason_inc_text',
  'sow_fwd_store2_reason_dec', 'sow_fwd_store2_reason_dec_text',
  'sow_retro_store3_dir', 'sow_retro_store3_reason_inc', 'sow_retro_store3_reason_inc_text',
  'sow_retro_store3_reason_dec', 'sow_retro_store3_reason_dec_text',
  'sow_fwd_store3_dir', 'sow_fwd_store3_reason_inc', 'sow_fwd_store3_reason_inc_text',
  'sow_fwd_store3_reason_dec', 'sow_fwd_store3_reason_dec_text',
  // Block 5
  'churn_risk_reason', 'churn_risk_reason_text', 'fareway_improve_verbatim',
  'acquisition_trigger', 'acquisition_trigger_text', 'fareway_tryme_verbatim',
  'channel_current', 'channel_current_collapsed', 'channel_change',
  // Block 6
  'freq_total', 'freq_fareway', 'avg_basket', 'avg_basket_midpoint', 'trip_trend',
  // Block 7
  'budget_trend', 'macro_response', 'macro_response_text',
  'tradedown_storebrand', 'tradedown_organic', 'tradedown_premium',
  'tradedown_discount_grocer', 'tradedown_coupons', 'tradedown_food_waste',
  'tradedown_none', 'tradedown_count',
  'best_value_1', 'best_value_2',
  'price_raised_rank_1', 'price_raised_rank_2', 'price_raised_rank_3',
  'price_stable_rank_1', 'price_stable_rank_2', 'price_stable_rank_3',
  // Block 8
  'gender', 'education', 'employment', 'area_type', 'distance_fareway',
  'household_size', 'ethnicity', 'ethnicity_other_text',
  // QC flags
  'qc_speeder', 'qc_straightliner_k1', 'qc_straightliner_k2',
  'qc_gibberish_nps', 'qc_gibberish_l1a', 'qc_gibberish_l2a', 'qc_sow_tie',
] as const;
```

---

## 19. Deployment & Environment Variables

### Vercel Configuration
```json
// vercel.json (if needed)
{
  "framework": "nextjs",
  "regions": ["iad1"]  // US East for low latency to Midwest respondents
}
```

### Environment Variables (Vercel Dashboard)
| Variable | Value | Notes |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://xxx.supabase.co` | Client will provide |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJ...` | Client will provide |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJ...` | Server-side only |
| `ADMIN_USERNAME` | `JTP2125` | Change before launch |
| `ADMIN_PASSWORD` | `test123` | **Change before launch** |

### Supabase Setup Steps
1. Create new Supabase project
2. Run migration SQL from `supabase/migrations/001_initial_schema.sql`
3. Create the `least_fill_select` RPC function
4. Import ZIP lookup data from `data/zip_lookup.csv`
5. Copy project URL, anon key, and service role key to environment variables

---

## 20. Testing Checklist

### Pre-Launch Verification
- [ ] All termination paths work (S1, S2, S3, S6 PNTS, S7, S7 PNTS, quota full)
- [ ] Duplicate rid rejection works
- [ ] ZIP validation works for valid and invalid ZIPs
- [ ] S4 SOW allocation enforces 100% sum
- [ ] S4 primary store derivation is correct (including tie-breaking)
- [ ] Segment classification matches expected logic for all 5 segments
- [ ] Segment quota check terminates when appropriate
- [ ] Least-fill algorithm assigns retailers correctly
- [ ] R1, R2, R3 are consistent across NPS, KPC, and SOW deep dive
- [ ] NPS scale works (0-10) on both desktop and mobile
- [ ] K1/K2 matrices render correctly on mobile (grouped cards)
- [ ] M5 ranking works on both desktop (drag-and-drop) and mobile (tap-to-rank)
- [ ] All conditional skip logic works (S5→S5a, W2→W3a/W3b, W4→W5a/W5b, L1 vs L2)
- [ ] L1/L1a only shown to customers, L2/L2a only shown to non-customers/lapsed
- [ ] F2 only shown to Fareway customers
- [ ] M4 and M5 filter retailers by funnel >= 2
- [ ] All randomization works (options randomized, anchors stay at bottom)
- [ ] Scales are NEVER randomized
- [ ] Block 8 demographics are all optional (can skip)
- [ ] Progress bar advances correctly
- [ ] Signpost screens show correct text and yellow background
- [ ] CSV export includes all columns in correct order
- [ ] CSV export includes terminated respondents
- [ ] Admin dashboard shows correct quota counts
- [ ] Admin login works
- [ ] Survey works on iPhone Safari, Android Chrome, desktop Chrome/Firefox/Safari
- [ ] All text is legible at default mobile zoom (min 16px)
- [ ] Touch targets are minimum 44×44px on mobile
- [ ] Quality flags are computed correctly on completion
- [ ] phase parameter (1 or 2) is correctly stored
- [ ] device_type is correctly detected
- [ ] Timestamps and duration are recorded

### Pilot Test (50-100 respondents)
- [ ] Median completion time is under 12 minutes
- [ ] No broken routing or display issues
- [ ] Data export is clean and complete
- [ ] Identify any confusing or slow questions for potential trimming

---

## Appendix: Estimated Completion Times by Segment

| Segment | Estimated Time | Notes |
|---|---|---|
| Primary/Secondary Shopper | 9-12 min | Most questions (L1, F2, full SOW loop) |
| Lapsed Shopper | 8-11 min | Fewer SOW deep dive questions |
| Aware Non-Customer | 7-10 min | No SOW deep dive, no F2 |
| Unaware Non-Customer | 6-9 min | Fewest Fareway-specific questions |

If pilot median exceeds 12 minutes, flag for trimming decisions.
