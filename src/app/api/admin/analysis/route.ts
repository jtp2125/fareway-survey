import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';

function isAuthenticated(req: NextRequest): boolean {
  return req.cookies.get('admin_session')?.value === 'authenticated';
}

const ANALYSIS_COLUMNS = [
  'respondent_id', 'phase', 'segment', 'completion_status', 'termination_point',
  'duration_seconds', 'device_type', 'dma', 'grocery_decisionmaker',
  'funnel_fareway', 'funnel_hyvee', 'funnel_kroger', 'funnel_aldi', 'funnel_walmart',
  'funnel_costco', 'funnel_meijer', 'funnel_target', 'funnel_wholefoods',
  'funnel_traderjoes', 'funnel_samsclub', 'funnel_pricechopper', 'funnel_schnucks', 'funnel_savealot',
  'sow_store1_name', 'sow_store1_pct', 'sow_store2_name', 'sow_store2_pct',
  'sow_store3_name', 'sow_store3_pct', 'sow_other_pct',
  'primary_store', 'freq_store1', 'freq_store2', 'freq_store3',
  'switched_out_any',
  'income_band_collapsed', 'age_cohort_collapsed', 'household_type_collapsed',
  'nps_r1_store', 'nps_r1_score', 'nps_r1_category', 'nps_r1_verbatim',
  'nps_r2_store', 'nps_r2_score', 'nps_r2_category', 'nps_r2_verbatim',
  'nps_r3_store', 'nps_r3_score', 'nps_r3_category', 'nps_r3_verbatim',
  'k1_imp_lowest_price', 'k1_imp_best_value', 'k1_imp_prod_quality', 'k1_imp_produce_fresh',
  'k1_imp_meat_seafood', 'k1_imp_private_label', 'k1_imp_assortment', 'k1_imp_cleanliness',
  'k1_imp_checkout', 'k1_imp_location', 'k1_imp_digital', 'k1_imp_prepared_foods', 'k1_imp_price_stability',
  'k2_perf_r1_lowest_price', 'k2_perf_r1_best_value', 'k2_perf_r1_prod_quality',
  'k2_perf_r1_produce_fresh', 'k2_perf_r1_meat_seafood', 'k2_perf_r1_private_label',
  'k2_perf_r1_assortment', 'k2_perf_r1_cleanliness', 'k2_perf_r1_checkout',
  'k2_perf_r1_location', 'k2_perf_r1_digital', 'k2_perf_r1_prepared_foods', 'k2_perf_r1_price_stability',
  'k2_perf_r2_lowest_price', 'k2_perf_r2_best_value', 'k2_perf_r2_prod_quality',
  'k2_perf_r2_produce_fresh', 'k2_perf_r2_meat_seafood', 'k2_perf_r2_private_label',
  'k2_perf_r2_assortment', 'k2_perf_r2_cleanliness', 'k2_perf_r2_checkout',
  'k2_perf_r2_location', 'k2_perf_r2_digital', 'k2_perf_r2_prepared_foods', 'k2_perf_r2_price_stability',
  'k2_perf_r3_lowest_price', 'k2_perf_r3_best_value', 'k2_perf_r3_prod_quality',
  'k2_perf_r3_produce_fresh', 'k2_perf_r3_meat_seafood', 'k2_perf_r3_private_label',
  'k2_perf_r3_assortment', 'k2_perf_r3_cleanliness', 'k2_perf_r3_checkout',
  'k2_perf_r3_location', 'k2_perf_r3_digital', 'k2_perf_r3_prepared_foods', 'k2_perf_r3_price_stability',
  'sow_retro_store1_dir', 'sow_retro_store2_dir', 'sow_retro_store3_dir',
  'sow_fwd_store1_dir', 'sow_fwd_store2_dir', 'sow_fwd_store3_dir',
  'churn_risk_reason', 'acquisition_trigger', 'channel_current', 'channel_change',
  'freq_total', 'freq_fareway', 'avg_basket', 'trip_trend',
  'budget_trend', 'macro_response',
  'tradedown_storebrand', 'tradedown_organic', 'tradedown_premium',
  'tradedown_discount_grocer', 'tradedown_coupons', 'tradedown_food_waste', 'tradedown_none',
  'best_value_1', 'best_value_2',
  'price_raised_rank_1', 'price_raised_rank_2', 'price_raised_rank_3',
  'price_stable_rank_1', 'price_stable_rank_2', 'price_stable_rank_3',
  'gender', 'education', 'employment', 'area_type', 'distance_fareway', 'household_size', 'ethnicity',
  'qc_speeder', 'qc_straightliner_k1', 'qc_straightliner_k2',
  'qc_gibberish_nps', 'qc_gibberish_l1a', 'qc_gibberish_l2a', 'qc_sow_tie',
].join(',');

export async function GET(req: NextRequest) {
  if (!isAuthenticated(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { data, error } = await supabaseAdmin
      .from('respondents')
      .select(ANALYSIS_COLUMNS)
      .order('respondent_id', { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ respondents: data });
  } catch (err) {
    console.error('Analysis API error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
