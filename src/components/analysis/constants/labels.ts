// Analysis dashboard label maps — extracted from reference implementation

export const RETAILERS = [
  'fareway','hyvee','kroger','aldi','walmart','costco','meijer',
  'target','wholefoods','traderjoes','samsclub','pricechopper','schnucks','savealot','other'
] as const;

export const RETAILER_LABELS: Record<string, string> = {
  fareway:'Fareway', hyvee:'Hy-Vee', kroger:'Kroger', aldi:'Aldi',
  walmart:'Walmart', costco:'Costco', meijer:'Meijer', target:'Target',
  wholefoods:'Whole Foods', traderjoes:"Trader Joe's", samsclub:"Sam's Club",
  pricechopper:'Price Chopper', schnucks:'Schnucks', savealot:'Save-A-Lot', other:'Other'
};

export const KPC_ATTRIBUTES = [
  { key: 'lowest_price', label: 'Lowest Prices' },
  { key: 'best_value', label: 'Best Value' },
  { key: 'prod_quality', label: 'Product Quality' },
  { key: 'produce_fresh', label: 'Produce Freshness' },
  { key: 'meat_seafood', label: 'Meat & Seafood' },
  { key: 'private_label', label: 'Private Label' },
  { key: 'assortment', label: 'Assortment Breadth' },
  { key: 'cleanliness', label: 'Cleanliness' },
  { key: 'checkout', label: 'Checkout Speed' },
  { key: 'location', label: 'Location / Proximity' },
  { key: 'digital', label: 'Digital / Online' },
  { key: 'prepared_foods', label: 'Prepared Foods' },
  { key: 'price_stability', label: 'Price Stability' },
] as const;

export const FUNNEL_LABELS: Record<number, string> = {
  1: 'Not Aware', 2: 'Aware, Not Considered', 3: 'Considered, Not Shopped',
  4: 'Shopped (not 12mo)', 5: 'Shopped 12mo (not 3mo)', 6: 'Shopped Last 3mo'
};

export const SEGMENT_LABELS: Record<string, string> = {
  primary_shopper: 'Primary Shopper', secondary_shopper: 'Secondary Shopper',
  lapsed: 'Lapsed', aware_non_customer: 'Aware Non-Customer', unaware_non_customer: 'Unaware Non-Customer'
};

export const INCOME_LABELS: Record<string, string> = { under_50k: 'Under $50K', '50_to_100k': '$50K\u2013$100K', over_100k: 'Over $100K' };
export const AGE_LABELS: Record<string, string> = { under_35: 'Under 35', '35_to_54': '35\u201354', '55_plus': '55+' };
export const HH_LABELS: Record<string, string> = { single: 'Single', couple: 'Couple', family: 'Family', other: 'Other' };
export const NPS_CAT_LABELS: Record<string, string> = { promoter: 'Promoter', passive: 'Passive', detractor: 'Detractor' };
export const DEVICE_LABELS: Record<string, string> = { mobile: 'Mobile', desktop: 'Desktop', tablet: 'Tablet' };
export const CHANNEL_LABELS: Record<string, string> = { 1: 'Mostly in-store', 2: 'Mostly online', 3: 'Mix of both', 4: 'Curbside pickup', 5: 'Varies by store' };
export const BUDGET_LABELS: Record<string, string> = { 1: 'Increased significantly', 2: 'Increased somewhat', 3: 'Stayed about the same', 4: 'Decreased somewhat', 5: 'Decreased significantly' };
export const TRIP_LABELS: Record<string, string> = { 1: 'More trips', 2: 'About the same', 3: 'Fewer trips' };
export const SOW_DIR_LABELS: Record<string, string> = { 1: 'Decreased significantly', 2: 'Decreased somewhat', 3: 'Stayed about the same', 4: 'Increased somewhat', 5: 'Increased significantly' };
export const GENDER_LABELS: Record<string, string> = { 1: 'Male', 2: 'Female', 3: 'Non-binary', 4: 'Prefer not to say' };
export const EDUCATION_LABELS: Record<string, string> = { 1: 'Less than high school', 2: 'High school / GED', 3: 'Some college', 4: "Associate's", 5: "Bachelor's", 6: 'Graduate / professional' };
export const EMPLOYMENT_LABELS: Record<string, string> = { 1: 'Full-time', 2: 'Part-time', 3: 'Self-employed', 4: 'Unemployed', 5: 'Student', 6: 'Retired', 7: 'Homemaker', 8: 'Other' };
export const AREA_LABELS: Record<string, string> = { 1: 'Urban', 2: 'Suburban', 3: 'Small town', 4: 'Rural' };
export const DISTANCE_LABELS: Record<string, string> = { 1: '< 5 min', 2: '5\u201310 min', 3: '11\u201320 min', 4: '21\u201330 min', 5: '> 30 min', 6: 'Unsure' };
export const BASKET_LABELS: Record<string, string> = { 1: 'Under $25', 2: '$25\u2013$50', 3: '$50\u2013$100', 4: '$100\u2013$150', 5: '$150+' };
export const FREQ_LABELS: Record<string, string> = { 1: 'Less than once a month', 2: 'About once a month', 3: '2\u20133 times a month', 4: 'About once a week', 5: 'More than once a week' };

export const MACRO_RESPONSE_LABELS: Record<string, string> = {
  1: 'Would not change spending', 2: 'Buy lower-cost items at same stores',
  3: 'Switch to lower-cost stores', 4: 'Reduce overall grocery amount',
  5: 'Cut back on premium/specialty', 6: 'Other'
};

export const CHURN_LABELS: Record<string, string> = {
  1: 'Better prices elsewhere', 2: 'Store quality declined', 3: 'New store opened nearby',
  4: 'Moved to a new area', 5: 'Switched to online/delivery', 6: 'Store location inconvenient',
  7: 'Poor customer service', 8: 'Product selection declined', 9: 'Other'
};

export const ACQ_LABELS: Record<string, string> = {
  1: 'Lower prices than current store', 2: 'Better product quality', 3: 'More convenient location',
  4: 'Better online/delivery options', 5: 'Recommendation from friend/family',
  6: 'Heard good things about meat/produce', 7: 'Coupons or promotions', 8: 'Store opened near me', 9: 'Other'
};

// Utility functions
export function pct(n: number, total: number): string {
  return total ? ((n / total) * 100).toFixed(1) : '0.0';
}

export function meanValues(arr: number[]): string {
  const nums = arr.filter(v => v !== null && v !== undefined && !isNaN(v));
  return nums.length ? (nums.reduce((a, b) => a + b, 0) / nums.length).toFixed(2) : '\u2014';
}

export function countBy(arr: Record<string, unknown>[], field: string): Record<string, number> {
  const counts: Record<string, number> = {};
  arr.forEach(r => {
    const v = r[field];
    if (v !== undefined && v !== null && v !== '') {
      const key = String(v);
      counts[key] = (counts[key] || 0) + 1;
    }
  });
  return counts;
}
