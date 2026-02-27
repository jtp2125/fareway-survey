import { SegmentType } from './constants';

/**
 * Classify respondent into one of 5 segments based on Fareway funnel position
 * and primary store (from SOW allocation).
 */
export function classifySegment(
  farewayFunnel: number,
  primaryStore: string | null
): SegmentType {
  // Shopped Fareway in last 3 months
  if (farewayFunnel === 6) {
    if (primaryStore === 'fareway') return 'primary_shopper';
    return 'secondary_shopper';
  }
  // Shopped in past but not recently
  if (farewayFunnel === 4 || farewayFunnel === 5) return 'lapsed';
  // Aware but never shopped, or considered
  if (farewayFunnel === 2 || farewayFunnel === 3) return 'aware_non_customer';
  // Not aware
  if (farewayFunnel === 1) return 'unaware_non_customer';

  throw new Error(`Invalid fareway funnel value: ${farewayFunnel}`);
}

/**
 * Derive collapsed income band from raw income_band value.
 */
export function collapseIncome(incomeBand: number): string | null {
  if (incomeBand === 1 || incomeBand === 2) return 'under_50k';
  if (incomeBand === 3 || incomeBand === 4) return '50_to_100k';
  if (incomeBand === 5 || incomeBand === 6) return 'over_100k';
  return null; // 7 = prefer not to say (should be terminated)
}

/**
 * Derive collapsed age cohort from raw age_cohort value.
 */
export function collapseAge(ageCohort: number): string | null {
  if (ageCohort === 2 || ageCohort === 3) return 'under_35';
  if (ageCohort === 4 || ageCohort === 5) return '35_to_54';
  if (ageCohort === 6 || ageCohort === 7) return '55_plus';
  return null; // 1 = under 18, 8 = pnts (both terminated)
}

/**
 * Derive collapsed household type from raw household_type value.
 */
export function collapseHousehold(householdType: number): string {
  if (householdType === 1) return 'single';
  if (householdType === 2) return 'couple';
  if (householdType === 3 || householdType === 4) return 'family';
  return 'other'; // 5, 6
}

/**
 * Derive collapsed channel from raw channel_current value.
 */
export function collapseChannel(channelCurrent: number): string {
  if (channelCurrent === 1 || channelCurrent === 2) return 'in_store';
  if (channelCurrent === 3) return 'hybrid';
  return 'online'; // 4, 5
}

/**
 * Derive NPS category from score.
 */
export function npsCategory(score: number): string {
  if (score >= 9) return 'promoter';
  if (score >= 7) return 'passive';
  return 'detractor';
}
