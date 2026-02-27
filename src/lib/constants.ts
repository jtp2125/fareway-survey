// ============================================================
// FAREWAY SURVEY — CONSTANTS
// ============================================================

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

export type RetailerCode = typeof RETAILERS[number]['code'];

export function getRetailerDisplay(code: string): string {
  return RETAILERS.find(r => r.code === code)?.display ?? code;
}

export function getRetailerShort(code: string): string {
  return RETAILERS.find(r => r.code === code)?.shortDisplay ?? code;
}

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

// === SCALES (NEVER randomize these) ===
export const IMPORTANCE_SCALE = [
  { value: 1, label: 'Not at all important' },
  { value: 2, label: 'Slightly important' },
  { value: 3, label: 'Moderately important' },
  { value: 4, label: 'Very important' },
  { value: 5, label: 'Extremely important' },
] as const;

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

export type SegmentType = keyof typeof SEGMENT_QUOTAS;

// === PROGRESS BAR WEIGHTS (by block) ===
export const BLOCK_PROGRESS: Record<string, number> = {
  consent: 0,
  block1: 0.20,
  block2: 0.30,
  block3: 0.50,
  block4: 0.65,
  block5: 0.75,
  block6: 0.80,
  block7: 0.95,
  block8: 1.00,
};

// === SIGNPOST TEXTS ===
export const SIGNPOST_TEXTS: Record<string, string> = {
  before_s1: "First, we'd like to confirm a few things about you and your household.",
  before_s3: "Now we'd like to understand which grocery stores you're familiar with and where you've shopped.",
  before_s4: "Next, we'd like to understand how you divide your grocery spending.",
  before_s6: "Finally in this section, a few questions about you and your household. This helps us ensure we're hearing from a representative group of shoppers.",
  before_block2: "We'd now like to ask about your experience with a few specific grocery stores. For each store, we'll ask you one quick question.",
  before_block3: "Now we'd like to understand what matters most to you when choosing a grocery store, and how the stores you shop at measure up.",
  before_block4: "Now we'd like to understand how your grocery spending has changed recently and where you see it going. We'll ask about a few stores one at a time.",
  before_block5: "Now we have a few questions about what drives your loyalty to the stores you shop at — and what might cause you to change your habits.",
  before_l3: "A couple of quick questions about how you shop for groceries.",
  before_block6: "Almost there! The next few questions are about how often you shop and how much you typically spend.",
  before_block7: "The last few questions are about how economic conditions have affected your grocery shopping.",
  before_block8: "Last section! Just a few optional questions about you to help us analyze the results.",
};

// === TERMINATION MESSAGES ===
export const TERMINATION_MESSAGES: Record<string, string> = {
  S1: "Thank you for your interest, but you are not eligible for this survey at this time.",
  S2: "Thank you, but we are looking for household grocery decision-makers for this survey.",
  S3: "Thank you, but we are looking for active grocery shoppers for this survey.",
  S6_PNTS: "Thank you for your time. You may now close this window.",
  S7: "Thank you, but you must be 18 or older to participate in this survey.",
  S7_PNTS: "Thank you for your time. You may now close this window.",
  quota_full: "Thank you for your interest, but we have received enough responses in your category. We appreciate your time.",
  default: "Thank you for your time. You may now close this window.",
};

// === CSV COLUMN ORDER ===
export const CSV_COLUMN_ORDER = [
  'respondent_id', 'panel_source', 'phase', 'segment', 'completion_status', 'termination_point',
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
  'k2_perf_r1_lowest_price', 'k2_perf_r1_best_value', 'k2_perf_r1_prod_quality',
  'k2_perf_r1_produce_fresh', 'k2_perf_r1_meat_seafood', 'k2_perf_r1_private_label',
  'k2_perf_r1_assortment', 'k2_perf_r1_cleanliness', 'k2_perf_r1_checkout',
  'k2_perf_r1_location', 'k2_perf_r1_digital', 'k2_perf_r1_prepared_foods',
  'k2_perf_r1_price_stability',
  'k2_perf_r2_lowest_price', 'k2_perf_r2_best_value', 'k2_perf_r2_prod_quality',
  'k2_perf_r2_produce_fresh', 'k2_perf_r2_meat_seafood', 'k2_perf_r2_private_label',
  'k2_perf_r2_assortment', 'k2_perf_r2_cleanliness', 'k2_perf_r2_checkout',
  'k2_perf_r2_location', 'k2_perf_r2_digital', 'k2_perf_r2_prepared_foods',
  'k2_perf_r2_price_stability',
  'k2_perf_r3_lowest_price', 'k2_perf_r3_best_value', 'k2_perf_r3_prod_quality',
  'k2_perf_r3_produce_fresh', 'k2_perf_r3_meat_seafood', 'k2_perf_r3_private_label',
  'k2_perf_r3_assortment', 'k2_perf_r3_cleanliness', 'k2_perf_r3_checkout',
  'k2_perf_r3_location', 'k2_perf_r3_digital', 'k2_perf_r3_prepared_foods',
  'k2_perf_r3_price_stability',
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
  'churn_risk_reason', 'churn_risk_reason_text', 'fareway_improve_verbatim',
  'acquisition_trigger', 'acquisition_trigger_text', 'fareway_tryme_verbatim',
  'channel_current', 'channel_current_collapsed', 'channel_change',
  'freq_total', 'freq_fareway', 'avg_basket', 'avg_basket_midpoint', 'trip_trend',
  'budget_trend', 'macro_response', 'macro_response_text',
  'tradedown_storebrand', 'tradedown_organic', 'tradedown_premium',
  'tradedown_discount_grocer', 'tradedown_coupons', 'tradedown_food_waste',
  'tradedown_none', 'tradedown_count',
  'best_value_1', 'best_value_2',
  'price_raised_rank_1', 'price_raised_rank_2', 'price_raised_rank_3',
  'price_stable_rank_1', 'price_stable_rank_2', 'price_stable_rank_3',
  'gender', 'education', 'employment', 'area_type', 'distance_fareway',
  'household_size', 'ethnicity', 'ethnicity_other_text',
  'qc_speeder', 'qc_straightliner_k1', 'qc_straightliner_k2',
  'qc_gibberish_nps', 'qc_gibberish_l1a', 'qc_gibberish_l2a', 'qc_sow_tie',
] as const;
