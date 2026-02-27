/**
 * Compute data quality flags on survey completion.
 */

export interface QualityFlags {
  qc_speeder: number;
  qc_straightliner_k1: number;
  qc_straightliner_k2: number;
  qc_gibberish_nps: number;
  qc_gibberish_l1a: number;
  qc_gibberish_l2a: number;
}

function allIdentical(values: (number | null | undefined)[]): boolean {
  const nonNull = values.filter((v): v is number => v != null);
  if (nonNull.length < 2) return false;
  return nonNull.every(v => v === nonNull[0]);
}

function isGibberish(text: string | null | undefined): boolean {
  if (!text || text.length < 5) return false;
  const hasRealWords = /[a-zA-Z]{3,}/.test(text);
  const hasExcessiveRepeats = /(.)\1{4,}/.test(text);
  const stripped = text.replace(/[^a-zA-Z]/g, '');
  const hasOnlyConsonants = stripped.length >= 5 && /^[^aeiouAEIOU]+$/.test(stripped);
  return !hasRealWords || hasExcessiveRepeats || hasOnlyConsonants;
}

export function computeQualityFlags(respondent: Record<string, unknown>): QualityFlags {
  const duration = respondent.duration_seconds as number | null;

  // K1 attributes
  const k1Values = [
    'k1_imp_lowest_price', 'k1_imp_best_value', 'k1_imp_prod_quality',
    'k1_imp_produce_fresh', 'k1_imp_meat_seafood', 'k1_imp_private_label',
    'k1_imp_assortment', 'k1_imp_cleanliness', 'k1_imp_checkout',
    'k1_imp_location', 'k1_imp_digital', 'k1_imp_prepared_foods',
    'k1_imp_price_stability',
  ].map(k => respondent[k] as number | null);

  // K2 per retailer
  const attrs = [
    'lowest_price', 'best_value', 'prod_quality', 'produce_fresh',
    'meat_seafood', 'private_label', 'assortment', 'cleanliness',
    'checkout', 'location', 'digital', 'prepared_foods', 'price_stability',
  ];
  const k2R1 = attrs.map(a => respondent[`k2_perf_r1_${a}`] as number | null);
  const k2R2 = attrs.map(a => respondent[`k2_perf_r2_${a}`] as number | null);
  const k2R3 = attrs.map(a => respondent[`k2_perf_r3_${a}`] as number | null);

  return {
    qc_speeder: (duration != null && duration < 180) ? 1 : 0,
    qc_straightliner_k1: allIdentical(k1Values) ? 1 : 0,
    qc_straightliner_k2: (
      allIdentical(k2R1) || allIdentical(k2R2) || allIdentical(k2R3)
    ) ? 1 : 0,
    qc_gibberish_nps: (
      isGibberish(respondent.nps_r1_verbatim as string) ||
      isGibberish(respondent.nps_r2_verbatim as string) ||
      isGibberish(respondent.nps_r3_verbatim as string)
    ) ? 1 : 0,
    qc_gibberish_l1a: isGibberish(respondent.fareway_improve_verbatim as string) ? 1 : 0,
    qc_gibberish_l2a: isGibberish(respondent.fareway_tryme_verbatim as string) ? 1 : 0,
  };
}
