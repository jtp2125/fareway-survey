import {
  INCOME_LABELS, AGE_LABELS, HH_LABELS, CHANNEL_LABELS,
  FREQ_LABELS, BASKET_LABELS, TRIP_LABELS, BUDGET_LABELS,
  MACRO_RESPONSE_LABELS, CHURN_LABELS, ACQ_LABELS,
  GENDER_LABELS, EDUCATION_LABELS, EMPLOYMENT_LABELS,
  AREA_LABELS, DISTANCE_LABELS,
} from './labels';

export interface QuestionDef {
  id: string;
  label: string;
  type: string;
  field?: string;
  labels?: Record<string | number, string> | null;
  dirField?: string;
}

export interface BlockDef {
  id: string;
  label: string;
  icon: string;
  questions: QuestionDef[];
}

export function buildBlocks(): BlockDef[] {
  return [
    {
      id: 'overview',
      label: 'Overview',
      icon: '\u25CE',
      questions: [
        { id: 'sample_summary', label: 'Sample Summary', type: 'custom_overview' },
        { id: 'completion_funnel', label: 'Completion Funnel', type: 'custom_completion' },
        { id: 'qc_flags', label: 'Data Quality Flags', type: 'custom_qc' },
      ]
    },
    {
      id: 'block1',
      label: 'Screener & Quotas',
      icon: '\u2460',
      questions: [
        { id: 's1_zip', label: 'S1. ZIP Code / DMA', type: 'categorical', field: 'dma', labels: null },
        { id: 's2_dm', label: 'S2. Grocery Decision-Maker', type: 'categorical', field: 'grocery_decisionmaker', labels: { 1: 'Primary', 2: 'Shared', 3: 'Not DM (termed)' } },
        { id: 's3_funnel', label: 'S3. Consideration Funnel', type: 'funnel_matrix' },
        { id: 's4_sow', label: 'S4. Share of Wallet Allocation', type: 'custom_sow' },
        { id: 's4a_freq', label: 'S4a. Store Visit Frequency (Top 3)', type: 'custom_store_freq' },
        { id: 's5_switched', label: 'S5. Historical Switching', type: 'categorical', field: 'switched_out_any', labels: { 0: 'No', 1: 'Yes' } },
        { id: 's6_income', label: 'S6. Income Band', type: 'categorical', field: 'income_band_collapsed', labels: INCOME_LABELS },
        { id: 's7_age', label: 'S7. Age Cohort', type: 'categorical', field: 'age_cohort_collapsed', labels: AGE_LABELS },
        { id: 's8_hh', label: 'S8. Household Type', type: 'categorical', field: 'household_type_collapsed', labels: HH_LABELS },
      ]
    },
    {
      id: 'block2',
      label: 'NPS',
      icon: '\u2461',
      questions: [
        { id: 'n1_scores', label: 'N1. NPS Scores by Retailer', type: 'custom_nps' },
        { id: 'n2_verbatim', label: 'N2. NPS Verbatims (Sample)', type: 'custom_nps_verbatim' },
      ]
    },
    {
      id: 'block3',
      label: 'Key Purchase Criteria',
      icon: '\u2462',
      questions: [
        { id: 'k1_importance', label: 'K1. Attribute Importance', type: 'custom_kpc_importance' },
        { id: 'k2_performance', label: 'K2. Attribute Performance by Retailer', type: 'custom_kpc_performance' },
      ]
    },
    {
      id: 'block4',
      label: 'Share of Wallet Deep Dive',
      icon: '\u2463',
      questions: [
        { id: 'w2_retro', label: 'W2. Retrospective Spend Direction', type: 'custom_sow_direction', dirField: 'retro' },
        { id: 'w4_fwd', label: 'W4. Forward Spend Direction', type: 'custom_sow_direction', dirField: 'fwd' },
      ]
    },
    {
      id: 'block5',
      label: 'Switching & Loyalty',
      icon: '\u2464',
      questions: [
        { id: 'l1_churn', label: 'L1. Churn Risk Reason (Customers)', type: 'categorical', field: 'churn_risk_reason', labels: CHURN_LABELS },
        { id: 'l2_acq', label: 'L2. Acquisition Trigger (Non-Customers)', type: 'categorical', field: 'acquisition_trigger', labels: ACQ_LABELS },
        { id: 'l3_channel', label: 'L3. Current Shopping Channel', type: 'categorical', field: 'channel_current', labels: CHANNEL_LABELS },
        { id: 'l4_channel_chg', label: 'L4. Channel Change vs 12mo Ago', type: 'categorical', field: 'channel_change', labels: { 1: 'More in-store', 2: 'More online', 3: 'About the same', 4: 'Started using curbside', 5: 'No change' } },
      ]
    },
    {
      id: 'block6',
      label: 'Frequency & Basket',
      icon: '\u2465',
      questions: [
        { id: 'f1_freq', label: 'F1. Total Grocery Frequency', type: 'categorical', field: 'freq_total', labels: FREQ_LABELS },
        { id: 'f2_fareway_freq', label: 'F2. Fareway Frequency (Customers)', type: 'categorical', field: 'freq_fareway', labels: FREQ_LABELS },
        { id: 'f3_basket', label: 'F3. Average Basket Size', type: 'categorical', field: 'avg_basket', labels: BASKET_LABELS },
        { id: 'f4_trip', label: 'F4. Trip Trend vs 12mo Ago', type: 'categorical', field: 'trip_trend', labels: TRIP_LABELS },
      ]
    },
    {
      id: 'block7',
      label: 'Macro Sensitivity',
      icon: '\u2466',
      questions: [
        { id: 'm1_budget', label: 'M1. Budget Trend', type: 'categorical', field: 'budget_trend', labels: BUDGET_LABELS },
        { id: 'm2_response', label: 'M2. Hypothetical Budget Response', type: 'categorical', field: 'macro_response', labels: MACRO_RESPONSE_LABELS },
        { id: 'm3_tradedown', label: 'M3. Trade-Down Behaviors', type: 'custom_tradedown' },
        { id: 'm4_value', label: 'M4. Best Value Retailer', type: 'custom_best_value' },
        { id: 'm5_price', label: 'M5. Price Perception Rankings', type: 'custom_price_rank' },
      ]
    },
    {
      id: 'block8',
      label: 'Demographics',
      icon: '\u2467',
      questions: [
        { id: 'd1_gender', label: 'D1. Gender', type: 'categorical', field: 'gender', labels: GENDER_LABELS },
        { id: 'd2_edu', label: 'D2. Education', type: 'categorical', field: 'education', labels: EDUCATION_LABELS },
        { id: 'd3_employ', label: 'D3. Employment', type: 'categorical', field: 'employment', labels: EMPLOYMENT_LABELS },
        { id: 'd4_area', label: 'D4. Area Type', type: 'categorical', field: 'area_type', labels: AREA_LABELS },
        { id: 'd5_dist', label: 'D5. Distance to Fareway', type: 'categorical', field: 'distance_fareway', labels: DISTANCE_LABELS },
        { id: 'd6_hhsize', label: 'D6. Household Size', type: 'categorical', field: 'household_size', labels: { 1: '1', 2: '2', 3: '3', 4: '4', 5: '5+' } },
        { id: 'd7_eth', label: 'D7. Ethnicity', type: 'categorical', field: 'ethnicity', labels: { 1: 'White', 2: 'Black/African American', 3: 'Hispanic/Latino', 4: 'Asian', 5: 'Native American', 6: 'Pacific Islander', 7: 'Other', 8: 'Prefer not to say' } },
      ]
    },
  ];
}
