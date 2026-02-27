import {
  SEGMENT_LABELS, INCOME_LABELS, AGE_LABELS, HH_LABELS,
  NPS_CAT_LABELS, RETAILER_LABELS, RETAILERS, FUNNEL_LABELS,
  SOW_DIR_LABELS, CHURN_LABELS, ACQ_LABELS, CHANNEL_LABELS,
  FREQ_LABELS, BASKET_LABELS, TRIP_LABELS, BUDGET_LABELS,
  MACRO_RESPONSE_LABELS, GENDER_LABELS, EDUCATION_LABELS,
  EMPLOYMENT_LABELS, AREA_LABELS, DISTANCE_LABELS, DEVICE_LABELS,
  KPC_ATTRIBUTES,
} from './labels';

export interface FilterOption {
  v: string;
  l: string;
}

export interface FilterableDef {
  id: string;
  block: string;
  label: string;
  filterType: 'categorical' | 'categorical_dynamic' | 'numeric' | 'binary';
  field: string;
  options?: FilterOption[];
  labelMap?: Record<string, string>;
  min?: number;
  max?: number;
}

function mapEntries(labels: Record<string, string>): FilterOption[] {
  return Object.entries(labels).map(([v, l]) => ({ v: String(v), l }));
}

export const FILTERABLE_QUESTIONS: FilterableDef[] = [
  { id: 'fq_segment', block: 'Screener', label: 'Segment', filterType: 'categorical', field: 'segment', options: mapEntries(SEGMENT_LABELS) },
  { id: 'fq_dma', block: 'Screener', label: 'DMA / Market', filterType: 'categorical_dynamic', field: 'dma' },
  { id: 'fq_decisionmaker', block: 'Screener', label: 'S2. Decision-Maker Role', filterType: 'categorical', field: 'grocery_decisionmaker', options: [{ v: '1', l: 'Primary' }, { v: '2', l: 'Shared' }, { v: '3', l: 'Not DM' }] },
  { id: 'fq_primary_store', block: 'Screener', label: 'S4. Primary Store', filterType: 'categorical_dynamic', field: 'primary_store', labelMap: RETAILER_LABELS },
  { id: 'fq_switched_any', block: 'Screener', label: 'S5. Switched Out (any)', filterType: 'categorical', field: 'switched_out_any', options: [{ v: '1', l: 'Yes' }, { v: '0', l: 'No' }] },
  { id: 'fq_income', block: 'Screener', label: 'S6. Income Band', filterType: 'categorical', field: 'income_band_collapsed', options: mapEntries(INCOME_LABELS) },
  { id: 'fq_age', block: 'Screener', label: 'S7. Age Cohort', filterType: 'categorical', field: 'age_cohort_collapsed', options: mapEntries(AGE_LABELS) },
  { id: 'fq_hh', block: 'Screener', label: 'S8. Household Type', filterType: 'categorical', field: 'household_type_collapsed', options: mapEntries(HH_LABELS) },
  // Funnel per retailer
  ...RETAILERS.filter(r => r !== 'other').map(r => ({
    id: `fq_funnel_${r}`, block: 'Screener', label: `S3. Funnel: ${RETAILER_LABELS[r]}`, filterType: 'categorical' as const,
    field: `funnel_${r}`, options: Object.entries(FUNNEL_LABELS).map(([v, l]) => ({ v: String(v), l }))
  })),
  { id: 'fq_sow1_pct', block: 'Screener', label: 'S4. SOW % \u2014 Store 1', filterType: 'numeric', field: 'sow_store1_pct' },
  { id: 'fq_sow2_pct', block: 'Screener', label: 'S4. SOW % \u2014 Store 2', filterType: 'numeric', field: 'sow_store2_pct' },
  // NPS
  { id: 'fq_nps_r1_score', block: 'NPS', label: 'N1. NPS Score \u2014 R1', filterType: 'numeric', field: 'nps_r1_score', min: 0, max: 10 },
  { id: 'fq_nps_r1_cat', block: 'NPS', label: 'N1. NPS Category \u2014 R1', filterType: 'categorical', field: 'nps_r1_category', options: mapEntries(NPS_CAT_LABELS) },
  { id: 'fq_nps_r1_store', block: 'NPS', label: 'N1. NPS Retailer \u2014 R1', filterType: 'categorical_dynamic', field: 'nps_r1_store', labelMap: RETAILER_LABELS },
  { id: 'fq_nps_r2_score', block: 'NPS', label: 'N1. NPS Score \u2014 R2', filterType: 'numeric', field: 'nps_r2_score', min: 0, max: 10 },
  { id: 'fq_nps_r2_cat', block: 'NPS', label: 'N1. NPS Category \u2014 R2', filterType: 'categorical', field: 'nps_r2_category', options: mapEntries(NPS_CAT_LABELS) },
  { id: 'fq_nps_r3_score', block: 'NPS', label: 'N1. NPS Score \u2014 R3', filterType: 'numeric', field: 'nps_r3_score', min: 0, max: 10 },
  // KPC Importance
  ...KPC_ATTRIBUTES.map(a => ({
    id: `fq_k1_${a.key}`, block: 'KPC', label: `K1. Importance: ${a.label}`, filterType: 'numeric' as const, field: `k1_imp_${a.key}`, min: 1, max: 5
  })),
  // KPC Performance R1
  ...KPC_ATTRIBUTES.map(a => ({
    id: `fq_k2r1_${a.key}`, block: 'KPC', label: `K2. Perf R1: ${a.label}`, filterType: 'numeric' as const, field: `k2_perf_r1_${a.key}`, min: 1, max: 5
  })),
  // SOW Direction
  { id: 'fq_retro_s1', block: 'SOW Deep Dive', label: 'W2. Retro Direction \u2014 Store 1', filterType: 'categorical', field: 'sow_retro_store1_dir', options: mapEntries(SOW_DIR_LABELS) },
  { id: 'fq_fwd_s1', block: 'SOW Deep Dive', label: 'W4. Forward Direction \u2014 Store 1', filterType: 'categorical', field: 'sow_fwd_store1_dir', options: mapEntries(SOW_DIR_LABELS) },
  // Loyalty
  { id: 'fq_churn', block: 'Loyalty', label: 'L1. Churn Risk Reason', filterType: 'categorical', field: 'churn_risk_reason', options: mapEntries(CHURN_LABELS) },
  { id: 'fq_acq', block: 'Loyalty', label: 'L2. Acquisition Trigger', filterType: 'categorical', field: 'acquisition_trigger', options: mapEntries(ACQ_LABELS) },
  { id: 'fq_channel', block: 'Loyalty', label: 'L3. Current Channel', filterType: 'categorical', field: 'channel_current', options: mapEntries(CHANNEL_LABELS) },
  { id: 'fq_channel_chg', block: 'Loyalty', label: 'L4. Channel Change', filterType: 'categorical', field: 'channel_change', options: [{ v: '1', l: 'More in-store' }, { v: '2', l: 'More online' }, { v: '3', l: 'About the same' }, { v: '4', l: 'Started curbside' }, { v: '5', l: 'No change' }] },
  // Frequency
  { id: 'fq_freq_total', block: 'Frequency', label: 'F1. Total Frequency', filterType: 'categorical', field: 'freq_total', options: mapEntries(FREQ_LABELS) },
  { id: 'fq_freq_fw', block: 'Frequency', label: 'F2. Fareway Frequency', filterType: 'categorical', field: 'freq_fareway', options: mapEntries(FREQ_LABELS) },
  { id: 'fq_basket', block: 'Frequency', label: 'F3. Average Basket', filterType: 'categorical', field: 'avg_basket', options: mapEntries(BASKET_LABELS) },
  { id: 'fq_trip', block: 'Frequency', label: 'F4. Trip Trend', filterType: 'categorical', field: 'trip_trend', options: mapEntries(TRIP_LABELS) },
  // Macro
  { id: 'fq_budget', block: 'Macro', label: 'M1. Budget Trend', filterType: 'categorical', field: 'budget_trend', options: mapEntries(BUDGET_LABELS) },
  { id: 'fq_macro_resp', block: 'Macro', label: 'M2. Hypothetical Response', filterType: 'categorical', field: 'macro_response', options: mapEntries(MACRO_RESPONSE_LABELS) },
  { id: 'fq_td_storebrand', block: 'Macro', label: 'M3. Trade-down: Store brand', filterType: 'binary', field: 'tradedown_storebrand' },
  { id: 'fq_td_organic', block: 'Macro', label: 'M3. Trade-down: Reduced organic', filterType: 'binary', field: 'tradedown_organic' },
  { id: 'fq_td_premium', block: 'Macro', label: 'M3. Trade-down: Fewer premium', filterType: 'binary', field: 'tradedown_premium' },
  { id: 'fq_td_discount', block: 'Macro', label: 'M3. Trade-down: Discount grocer', filterType: 'binary', field: 'tradedown_discount_grocer' },
  { id: 'fq_td_coupons', block: 'Macro', label: 'M3. Trade-down: Coupons', filterType: 'binary', field: 'tradedown_coupons' },
  { id: 'fq_td_none', block: 'Macro', label: 'M3. Trade-down: None', filterType: 'binary', field: 'tradedown_none' },
  { id: 'fq_bestval1', block: 'Macro', label: 'M4. Best Value \u2014 1st Pick', filterType: 'categorical_dynamic', field: 'best_value_1', labelMap: RETAILER_LABELS },
  { id: 'fq_priceraised1', block: 'Macro', label: 'M5a. Price Raised \u2014 Rank 1', filterType: 'categorical_dynamic', field: 'price_raised_rank_1', labelMap: RETAILER_LABELS },
  { id: 'fq_pricestable1', block: 'Macro', label: 'M5b. Price Stable \u2014 Rank 1', filterType: 'categorical_dynamic', field: 'price_stable_rank_1', labelMap: RETAILER_LABELS },
  // Demographics
  { id: 'fq_gender', block: 'Demographics', label: 'D1. Gender', filterType: 'categorical', field: 'gender', options: mapEntries(GENDER_LABELS) },
  { id: 'fq_edu', block: 'Demographics', label: 'D2. Education', filterType: 'categorical', field: 'education', options: mapEntries(EDUCATION_LABELS) },
  { id: 'fq_employ', block: 'Demographics', label: 'D3. Employment', filterType: 'categorical', field: 'employment', options: mapEntries(EMPLOYMENT_LABELS) },
  { id: 'fq_area', block: 'Demographics', label: 'D4. Area Type', filterType: 'categorical', field: 'area_type', options: mapEntries(AREA_LABELS) },
  { id: 'fq_dist', block: 'Demographics', label: 'D5. Distance to Fareway', filterType: 'categorical', field: 'distance_fareway', options: mapEntries(DISTANCE_LABELS) },
  { id: 'fq_hhsize', block: 'Demographics', label: 'D6. Household Size', filterType: 'categorical', field: 'household_size', options: [{ v: '1', l: '1' }, { v: '2', l: '2' }, { v: '3', l: '3' }, { v: '4', l: '4' }, { v: '5', l: '5+' }] },
  // System
  { id: 'fq_device', block: 'System', label: 'Device Type', filterType: 'categorical', field: 'device_type', options: mapEntries(DEVICE_LABELS) },
  { id: 'fq_phase', block: 'System', label: 'Phase', filterType: 'categorical', field: 'phase', options: [{ v: '1', l: 'Phase 1' }, { v: '2', l: 'Phase 2' }] },
  { id: 'fq_status', block: 'System', label: 'Completion Status', filterType: 'categorical', field: 'completion_status', options: [{ v: 'complete', l: 'Complete' }, { v: 'terminated', l: 'Terminated' }] },
  { id: 'fq_duration', block: 'System', label: 'Duration (seconds)', filterType: 'numeric', field: 'duration_seconds' },
  { id: 'fq_speeder', block: 'System', label: 'QC: Speeder Flag', filterType: 'binary', field: 'qc_speeder' },
  { id: 'fq_straight_k1', block: 'System', label: 'QC: Straightliner K1', filterType: 'binary', field: 'qc_straightliner_k1' },
];

export const FILTER_BLOCKS = ['Screener', 'NPS', 'KPC', 'SOW Deep Dive', 'Loyalty', 'Frequency', 'Macro', 'Demographics', 'System'];
