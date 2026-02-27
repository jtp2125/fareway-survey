/**
 * FAREWAY SURVEY — Seed 1,000 Dummy Respondents
 * 
 * Run from your project folder:
 *   node seed-dummy-data.js
 * 
 * Prerequisites:
 *   - npm install @supabase/supabase-js  (already installed if you ran npm install)
 *   - Your .env.local file has valid Supabase credentials
 * 
 * This script generates realistic dummy data that respects all routing logic:
 *   - Segment distribution matches quota targets
 *   - Conditional questions only have data when routing applies
 *   - NPS/KPC/SOW deep dive only for assigned retailers
 *   - Terminated respondents have partial data
 *   - Quality flags are computed
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// ── Load env vars from .env.local ──
const envPath = path.join(__dirname, '.env.local');
const envContent = fs.readFileSync(envPath, 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
  const trimmed = line.trim();
  if (trimmed && !trimmed.startsWith('#')) {
    const [key, ...vals] = trimmed.split('=');
    env[key.trim()] = vals.join('=').trim();
  }
});

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

// ── Constants ──
const RETAILERS = [
  'fareway', 'hyvee', 'kroger', 'aldi', 'walmart', 'costco', 'meijer',
  'target', 'wholefoods', 'traderjoes', 'samsclub', 'pricechopper',
  'schnucks', 'savealot'
];

const RETAILER_DISPLAY = {
  fareway: 'Fareway', hyvee: 'Hy-Vee', kroger: 'Kroger', aldi: 'Aldi',
  walmart: 'Walmart', costco: 'Costco', meijer: 'Meijer', target: 'Target',
  wholefoods: 'Whole Foods', traderjoes: "Trader Joe's", samsclub: "Sam's Club",
  pricechopper: 'Price Chopper', schnucks: 'Schnucks', savealot: 'Save-A-Lot',
};

const KPC_ATTRS = [
  'lowest_price', 'best_value', 'prod_quality', 'produce_fresh', 'meat_seafood',
  'private_label', 'assortment', 'cleanliness', 'checkout', 'location',
  'digital', 'prepared_foods', 'price_stability'
];

const IOWA_ZIPS = [
  '50309', '50310', '50311', '50312', '50313', '50314', '50315', '50316',
  '50317', '50320', '50321', '50322', '50323', '50265', '50266', '50131',
  '50021', '50023', '50009', '50010', '50014', '50036', '50112', '50158',
  '50208', '50219', '50248', '50613', '50677', '50701', '52001', '52040',
  '52240', '52302', '52404', '52501', '52601', '52761', '52801', '51301',
  '68028', '68046', '68510', '57106', '55920', '66062', '64106',
];

const DMA_MAP = {
  '503': 'Des Moines', '502': 'Des Moines', '500': 'Des Moines',
  '506': 'Waterloo-Cedar Falls', '507': 'Waterloo-Cedar Falls',
  '520': 'Dubuque', '522': 'Cedar Rapids-Iowa City', '524': 'Cedar Rapids-Iowa City',
  '525': 'Ottumwa-Burlington', '526': 'Ottumwa-Burlington',
  '527': 'Quad Cities', '528': 'Quad Cities',
  '513': 'Sioux City', '680': 'Omaha', '685': 'Lincoln',
  '571': 'Sioux Falls', '559': 'Rochester', '560': 'Fairmont-Worthington',
  '660': 'Kansas City', '641': 'Kansas City', '612': 'Quad Cities',
};

const NPS_VERBATIMS = [
  "Great prices and friendly staff",
  "Love the meat department, always fresh",
  "Convenient location near my home",
  "Good selection but prices could be better",
  "The produce is always fresh and high quality",
  "Checkout lines are too long sometimes",
  "I appreciate the local feel of the store",
  "They need to improve their online ordering",
  "Best value for money in the area",
  "Store is always clean and well organized",
  "The bakery items are excellent",
  "Wish they had more organic options",
  "Staff is knowledgeable and helpful",
  "Not as many name brands as I would like",
  "Great deli counter and prepared foods",
  "Prices have gone up a lot recently",
  "I like supporting a regional grocer",
  "The store layout makes shopping easy",
  "They need better dairy selection",
  "Always a pleasant shopping experience",
  "Would recommend to friends and family",
  "Decent store but nothing special",
  "Better than most options in the area",
  "The quality keeps me coming back",
  "I shop there out of habit mostly",
];

const IMPROVE_VERBATIMS = [
  "More organic and natural food options",
  "Better online ordering and delivery service",
  "Longer store hours especially on weekends",
  "More self-checkout lanes to reduce wait times",
  "Expand the international food section",
  "Lower prices on everyday staples",
  "Better loyalty program with real savings",
  "Improve the mobile app experience",
  "More prepared meal options for busy families",
  "Better parking lot at the main location",
];

const TRYME_VERBATIMS = [
  "Open a store closer to where I live",
  "Offer competitive prices with my current store",
  "Start a delivery or curbside pickup service",
  "Give me a first-time shopper discount",
  "Show me they have quality produce and meat",
  "Better advertise what makes them different",
  "Offer a wider product selection",
  "Have a strong rewards program",
  "Match or beat competitor weekly deals",
  "Improve their store appearance and layout",
];

// ── Helpers ──
function rand(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function weightedPick(options) {
  // options: [{value, weight}]
  const total = options.reduce((s, o) => s + o.weight, 0);
  let r = Math.random() * total;
  for (const o of options) {
    r -= o.weight;
    if (r <= 0) return o.value;
  }
  return options[options.length - 1].value;
}

function getDMA(zip) {
  const prefix3 = zip.substring(0, 3);
  return DMA_MAP[prefix3] || 'Des Moines';
}

function npsCategory(score) {
  if (score >= 9) return 'promoter';
  if (score >= 7) return 'passive';
  return 'detractor';
}

// ── Generate one respondent ──
function generateRespondent(index, targetSegment, isTerminated) {
  const rid = `dummy_${String(index).padStart(4, '0')}`;
  const phase = weightedPick([{value: 1, weight: 45}, {value: 2, weight: 55}]);
  const zip = pick(IOWA_ZIPS);
  const dma = getDMA(zip);
  const device = weightedPick([
    {value: 'mobile', weight: 55}, {value: 'desktop', weight: 35}, {value: 'tablet', weight: 10}
  ]);
  const startTime = new Date(Date.now() - rand(1, 30) * 24 * 60 * 60 * 1000); // 1-30 days ago
  const durationSec = rand(300, 900); // 5-15 minutes
  const endTime = new Date(startTime.getTime() + durationSec * 1000);

  // ── Handle terminated respondents ──
  if (isTerminated) {
    const termPoint = pick(['S1', 'S2', 'S3', 'S6_PNTS', 'S7', 'S7_PNTS', 'quota_full']);
    const r = {
      respondent_id: rid,
      panel_source: pick(['panel_a', 'panel_b', 'panel_c']),
      phase,
      completion_status: 'terminated',
      termination_point: termPoint,
      start_timestamp: startTime.toISOString(),
      end_timestamp: endTime.toISOString(),
      duration_seconds: rand(10, 120),
      device_type: device,
      current_block: 'terminated',
      zip_code: termPoint === 'S1' ? pick(['90210', '10001', '33101', '60601']) : zip,
      dma: termPoint === 'S1' ? null : dma,
    };
    if (termPoint !== 'S1') r.grocery_decisionmaker = termPoint === 'S2' ? 3 : rand(1, 2);
    if (termPoint === 'S6_PNTS') r.income_band = 7;
    if (termPoint === 'S7') r.age_cohort = 1;
    if (termPoint === 'S7_PNTS') r.age_cohort = 8;
    return r;
  }

  // ── Screener (Block 1) ──
  const grocery_decisionmaker = weightedPick([{value: 1, weight: 60}, {value: 2, weight: 40}]);

  // Generate funnel based on target segment
  const funnel = {};
  let farewayFunnel;
  if (targetSegment === 'primary_shopper' || targetSegment === 'secondary_shopper') {
    farewayFunnel = 6;
  } else if (targetSegment === 'lapsed') {
    farewayFunnel = pick([4, 5]);
  } else if (targetSegment === 'aware_non_customer') {
    farewayFunnel = pick([2, 3]);
  } else {
    farewayFunnel = 1;
  }
  funnel.fareway = farewayFunnel;

  // Other retailers — make sure at least one has funnel >= 5
  for (const r of RETAILERS.filter(r => r !== 'fareway')) {
    funnel[r] = weightedPick([
      {value: 1, weight: 15}, {value: 2, weight: 15}, {value: 3, weight: 10},
      {value: 4, weight: 10}, {value: 5, weight: 15}, {value: 6, weight: 35},
    ]);
  }

  // Ensure at least 2-5 stores have funnel=6 for SOW allocation
  const storesLast3m = RETAILERS.filter(r => funnel[r] === 6);
  if (storesLast3m.length < 2) {
    // Force a couple more retailers to funnel=6
    const eligible = RETAILERS.filter(r => funnel[r] < 6);
    for (let i = 0; i < 3 && eligible.length > 0; i++) {
      const idx = rand(0, eligible.length - 1);
      funnel[eligible[idx]] = 6;
      eligible.splice(idx, 1);
    }
  }

  // Build funnel columns
  const funnelCols = {};
  for (const r of RETAILERS) {
    funnelCols[`funnel_${r}`] = funnel[r];
  }
  funnelCols.funnel_other = weightedPick([
    {value: 1, weight: 50}, {value: 2, weight: 20}, {value: 3, weight: 10},
    {value: 6, weight: 20}
  ]);

  // ── SOW Allocation (S4) ──
  const activeStores = RETAILERS.filter(r => funnel[r] === 6);
  const sowAllocations = {};
  let remaining = 100;
  const otherPct = rand(0, 15);
  remaining -= otherPct;

  // For primary shoppers, Fareway gets the highest SOW
  if (targetSegment === 'primary_shopper' && activeStores.includes('fareway')) {
    const farewayPct = rand(35, 65);
    sowAllocations['fareway'] = Math.min(farewayPct, remaining);
    remaining -= sowAllocations['fareway'];
  }

  // Distribute remaining among other active stores
  const otherActive = activeStores.filter(r => !sowAllocations[r]);
  if (otherActive.length > 0) {
    for (let i = 0; i < otherActive.length; i++) {
      if (i === otherActive.length - 1) {
        sowAllocations[otherActive[i]] = remaining;
      } else {
        const pct = rand(1, Math.max(1, Math.floor(remaining / (otherActive.length - i))));
        sowAllocations[otherActive[i]] = pct;
        remaining -= pct;
      }
    }
  }

  // For secondary shoppers, make sure Fareway is NOT the highest
  if (targetSegment === 'secondary_shopper' && activeStores.includes('fareway')) {
    const maxOther = Math.max(...Object.entries(sowAllocations).filter(([k]) => k !== 'fareway').map(([, v]) => v));
    if ((sowAllocations['fareway'] || 0) >= maxOther) {
      // Swap Fareway with the highest other store
      const highStore = Object.entries(sowAllocations).find(([k, v]) => k !== 'fareway' && v === maxOther);
      if (highStore) {
        const temp = sowAllocations['fareway'] || 0;
        sowAllocations['fareway'] = highStore[1] > 5 ? rand(5, highStore[1] - 1) : highStore[1];
        sowAllocations[highStore[0]] = temp;
      }
    }
  }

  // Sort by SOW desc to get store1/2/3
  const sortedStores = Object.entries(sowAllocations).sort((a, b) => b[1] - a[1]);
  const primaryStore = sortedStores[0]?.[0] || 'fareway';

  // Segment verification
  let segment = targetSegment;

  // SOW columns
  const sowCols = {
    sow_store1_name: sortedStores[0]?.[0] || null,
    sow_store1_pct: sortedStores[0]?.[1] || null,
    sow_store2_name: sortedStores[1]?.[0] || null,
    sow_store2_pct: sortedStores[1]?.[1] || null,
    sow_store3_name: sortedStores[2]?.[0] || null,
    sow_store3_pct: sortedStores[2]?.[1] || null,
    sow_other_pct: otherPct,
    primary_store: primaryStore,
  };

  // Frequency S4a
  const freqCols = {
    freq_store1: rand(1, 4),
    freq_store2: sortedStores[1] ? rand(1, 4) : null,
    freq_store3: sortedStores[2] ? rand(1, 4) : null,
  };

  // S5 Switching
  const switchedAny = weightedPick([{value: 1, weight: 30}, {value: 0, weight: 70}]);
  const switchCols = { switched_out_any: switchedAny };
  if (switchedAny === 1) {
    for (const r of RETAILERS) {
      switchCols[`switched_out_${r}`] = weightedPick([{value: 1, weight: 15}, {value: 0, weight: 85}]);
    }
    switchCols.switched_out_other = 0;
  }

  // S6-S8 Demographics
  const incomeBand = weightedPick([
    {value: 1, weight: 10}, {value: 2, weight: 18}, {value: 3, weight: 22},
    {value: 4, weight: 20}, {value: 5, weight: 18}, {value: 6, weight: 12},
  ]);
  const ageCohort = weightedPick([
    {value: 2, weight: 15}, {value: 3, weight: 20}, {value: 4, weight: 22},
    {value: 5, weight: 20}, {value: 6, weight: 13}, {value: 7, weight: 10},
  ]);
  const householdType = weightedPick([
    {value: 1, weight: 20}, {value: 2, weight: 25}, {value: 3, weight: 30},
    {value: 4, weight: 10}, {value: 5, weight: 10}, {value: 6, weight: 5},
  ]);

  const incomeCollapsed = incomeBand <= 2 ? 'under_50k' : incomeBand <= 4 ? '50_to_100k' : 'over_100k';
  const ageCollapsed = ageCohort <= 3 ? 'under_35' : ageCohort <= 5 ? '35_to_54' : '55_plus';
  const hhCollapsed = householdType === 1 ? 'single' : householdType === 2 ? 'couple' :
    (householdType === 3 || householdType === 4) ? 'family' : 'other';

  // ── Retailer Assignments R1/R2/R3 ──
  const r1 = primaryStore;
  let r2 = null, r3 = null;
  const remainingStores = activeStores.filter(s => s !== r1);
  if (segment === 'secondary_shopper' && remainingStores.includes('fareway')) {
    r2 = 'fareway';
    const r3pool = remainingStores.filter(s => s !== 'fareway');
    r3 = r3pool.length > 0 ? pick(r3pool) : null;
  } else if (remainingStores.length > 0) {
    r2 = pick(remainingStores);
    const r3pool = remainingStores.filter(s => s !== r2);
    r3 = r3pool.length > 0 ? pick(r3pool) : null;
  }

  // For non-shoppers (lapsed, aware, unaware), they might not have 3 active stores
  // but they still get retailer assignments from any stores they've engaged with
  if (!r2 && segment !== 'primary_shopper' && segment !== 'secondary_shopper') {
    const anyStores = RETAILERS.filter(r => funnel[r] >= 4 && r !== r1);
    if (anyStores.length > 0) r2 = pick(anyStores);
    const r3pool = anyStores.filter(s => s !== r2);
    if (r3pool.length > 0) r3 = pick(r3pool);
  }

  const assignedRetailers = [r1, r2, r3].filter(Boolean);

  // ── Block 2: NPS ──
  const npsCols = {};
  assignedRetailers.forEach((store, i) => {
    const prefix = `nps_r${i + 1}`;
    const score = rand(0, 10);
    npsCols[`${prefix}_store`] = store;
    npsCols[`${prefix}_score`] = score;
    npsCols[`${prefix}_category`] = npsCategory(score);
    npsCols[`${prefix}_verbatim`] = pick(NPS_VERBATIMS);
  });

  // ── Block 3: KPC ──
  const kpcCols = {};
  // K1 importance (everyone)
  for (const attr of KPC_ATTRS) {
    kpcCols[`k1_imp_${attr}`] = rand(1, 5);
  }
  // K2 performance (per assigned retailer)
  assignedRetailers.forEach((store, i) => {
    for (const attr of KPC_ATTRS) {
      kpcCols[`k2_perf_r${i + 1}_${attr}`] = rand(1, 5);
    }
  });

  // ── Block 4: SOW Deep Dive (only for stores with SOW > 0) ──
  const sowDeepCols = {};
  const isCustomer = segment === 'primary_shopper' || segment === 'secondary_shopper';
  if (isCustomer) {
    for (let i = 0; i < Math.min(assignedRetailers.length, 3); i++) {
      const storeIdx = i + 1;
      const retroDir = rand(1, 5);
      sowDeepCols[`sow_retro_store${storeIdx}_dir`] = retroDir;
      if (retroDir === 5) {
        sowDeepCols[`sow_retro_store${storeIdx}_reason_inc`] = rand(1, 9);
      } else if (retroDir === 1) {
        sowDeepCols[`sow_retro_store${storeIdx}_reason_dec`] = rand(1, 9);
      }
      const fwdDir = rand(1, 3);
      sowDeepCols[`sow_fwd_store${storeIdx}_dir`] = fwdDir;
      if (fwdDir === 3) {
        sowDeepCols[`sow_fwd_store${storeIdx}_reason_inc`] = rand(1, 8);
      } else if (fwdDir === 1) {
        sowDeepCols[`sow_fwd_store${storeIdx}_reason_dec`] = rand(1, 8);
      }
    }
  }

  // ── Block 5: Switching & Loyalty ──
  const loyaltyCols = {};
  if (isCustomer) {
    loyaltyCols.churn_risk_reason = rand(1, 8);
    loyaltyCols.fareway_improve_verbatim = pick(IMPROVE_VERBATIMS);
  } else if (segment === 'lapsed' || segment === 'aware_non_customer') {
    loyaltyCols.acquisition_trigger = rand(1, 8);
    loyaltyCols.fareway_tryme_verbatim = pick(TRYME_VERBATIMS);
  }
  // L3/L4 for everyone
  const channelCurrent = rand(1, 5);
  loyaltyCols.channel_current = channelCurrent;
  loyaltyCols.channel_current_collapsed = channelCurrent <= 2 ? 'in_store' : channelCurrent === 3 ? 'hybrid' : 'online';
  loyaltyCols.channel_change = rand(1, 5);

  // ── Block 6: Frequency & Basket ──
  const freqBasketCols = {
    freq_total: rand(1, 5),
    avg_basket: rand(1, 6),
    trip_trend: rand(1, 5),
  };
  freqBasketCols.avg_basket_midpoint = [12.50, 37.50, 75.50, 125.50, 175.50, 250.00][freqBasketCols.avg_basket - 1];
  if (isCustomer) {
    freqBasketCols.freq_fareway = rand(1, 5);
  }

  // ── Block 7: Macro Sensitivity ──
  const macroCols = {
    budget_trend: rand(1, 5),
    macro_response: rand(1, 7),
    tradedown_storebrand: rand(0, 1),
    tradedown_organic: rand(0, 1),
    tradedown_premium: rand(0, 1),
    tradedown_discount_grocer: rand(0, 1),
    tradedown_coupons: rand(0, 1),
    tradedown_food_waste: rand(0, 1),
    tradedown_none: 0,
  };
  const tdCount = macroCols.tradedown_storebrand + macroCols.tradedown_organic +
    macroCols.tradedown_premium + macroCols.tradedown_discount_grocer +
    macroCols.tradedown_coupons + macroCols.tradedown_food_waste;
  if (tdCount === 0) macroCols.tradedown_none = 1;
  macroCols.tradedown_count = tdCount;

  // Best value (from stores they know)
  const knownStores = RETAILERS.filter(r => funnel[r] >= 2);
  macroCols.best_value_1 = knownStores.length > 0 ? pick(knownStores) : 'fareway';
  macroCols.best_value_2 = knownStores.length > 1 ? pick(knownStores.filter(s => s !== macroCols.best_value_1)) : null;

  // Price rankings
  if (knownStores.length >= 3) {
    const shuffled = [...knownStores].sort(() => Math.random() - 0.5);
    macroCols.price_raised_rank_1 = shuffled[0];
    macroCols.price_raised_rank_2 = shuffled[1];
    macroCols.price_raised_rank_3 = shuffled[2];
    const shuffled2 = [...knownStores].sort(() => Math.random() - 0.5);
    macroCols.price_stable_rank_1 = shuffled2[0];
    macroCols.price_stable_rank_2 = shuffled2[1];
    macroCols.price_stable_rank_3 = shuffled2[2];
  }

  // ── Block 8: Demographics (optional — ~80% fill rate) ──
  const demoCols = {};
  if (Math.random() > 0.15) demoCols.gender = rand(1, 4);
  if (Math.random() > 0.15) demoCols.education = rand(1, 6);
  if (Math.random() > 0.15) demoCols.employment = rand(1, 8);
  if (Math.random() > 0.10) demoCols.area_type = weightedPick([
    {value: 1, weight: 15}, {value: 2, weight: 35}, {value: 3, weight: 30}, {value: 4, weight: 20}
  ]);
  if (Math.random() > 0.10) demoCols.distance_fareway = rand(1, 6);
  if (Math.random() > 0.10) demoCols.household_size = rand(1, 5);
  if (Math.random() > 0.20) demoCols.ethnicity = weightedPick([
    {value: 1, weight: 70}, {value: 2, weight: 8}, {value: 3, weight: 10},
    {value: 4, weight: 5}, {value: 5, weight: 1}, {value: 6, weight: 3},
    {value: 7, weight: 1}, {value: 8, weight: 2},
  ]);

  // ── Quality flags ──
  const isSpeeder = durationSec < 180;
  const k1Values = KPC_ATTRS.map(a => kpcCols[`k1_imp_${a}`]);
  const k1Straightline = k1Values.every(v => v === k1Values[0]) ? 1 : 0;

  let k2Straightline = 0;
  for (let i = 1; i <= assignedRetailers.length; i++) {
    const vals = KPC_ATTRS.map(a => kpcCols[`k2_perf_r${i}_${a}`]).filter(Boolean);
    if (vals.length > 0 && vals.every(v => v === vals[0])) k2Straightline = 1;
  }

  // ── Assemble full record ──
  return {
    respondent_id: rid,
    panel_source: pick(['panel_a', 'panel_b', 'panel_c']),
    phase,
    segment,
    completion_status: 'complete',
    termination_point: null,
    start_timestamp: startTime.toISOString(),
    end_timestamp: endTime.toISOString(),
    duration_seconds: durationSec,
    device_type: device,
    current_block: 'complete',
    zip_code: zip,
    dma,
    grocery_decisionmaker,
    ...funnelCols,
    ...sowCols,
    ...freqCols,
    ...switchCols,
    income_band: incomeBand,
    income_band_collapsed: incomeCollapsed,
    age_cohort: ageCohort,
    age_cohort_collapsed: ageCollapsed,
    household_type: householdType,
    household_type_collapsed: hhCollapsed,
    nps_r1_store: r1,
    nps_r2_store: r2,
    nps_r3_store: r3,
    ...npsCols,
    ...kpcCols,
    ...sowDeepCols,
    ...loyaltyCols,
    ...freqBasketCols,
    ...macroCols,
    ...demoCols,
    qc_speeder: isSpeeder ? 1 : 0,
    qc_straightliner_k1: k1Straightline,
    qc_straightliner_k2: k2Straightline,
    qc_gibberish_nps: 0,
    qc_gibberish_l1a: 0,
    qc_gibberish_l2a: 0,
    qc_sow_tie: 0,
  };
}

// ── Main ──
async function main() {
  console.log('🌱 Seeding 1,000 dummy respondents...\n');

  // Clear existing dummy data
  const { error: deleteError } = await supabase
    .from('respondents')
    .delete()
    .like('respondent_id', 'dummy_%');
  
  if (deleteError) {
    console.error('Error clearing old dummy data:', deleteError);
  } else {
    console.log('  Cleared any existing dummy_* records');
  }

  // Segment distribution (roughly matching quota ratios)
  const segmentTargets = [
    { segment: 'primary_shopper', count: 280 },
    { segment: 'secondary_shopper', count: 180 },
    { segment: 'lapsed', count: 100 },
    { segment: 'aware_non_customer', count: 180 },
    { segment: 'unaware_non_customer', count: 60 },
  ];
  // 200 terminated respondents
  const terminatedCount = 200;
  const totalComplete = segmentTargets.reduce((s, t) => s + t.count, 0); // 800

  const respondents = [];
  let idx = 1;

  // Generate completed respondents
  for (const { segment, count } of segmentTargets) {
    for (let i = 0; i < count; i++) {
      respondents.push(generateRespondent(idx++, segment, false));
    }
    console.log(`  Generated ${count} ${segment} respondents`);
  }

  // Generate terminated respondents
  for (let i = 0; i < terminatedCount; i++) {
    respondents.push(generateRespondent(idx++, 'primary_shopper', true));
  }
  console.log(`  Generated ${terminatedCount} terminated respondents`);

  // Insert in batches of 50 (Supabase has payload limits)
  console.log(`\n  Inserting ${respondents.length} records into Supabase...`);
  const batchSize = 50;
  let inserted = 0;

  for (let i = 0; i < respondents.length; i += batchSize) {
    const batch = respondents.slice(i, i + batchSize);
    const { error } = await supabase.from('respondents').insert(batch);
    if (error) {
      console.error(`  Error inserting batch ${Math.floor(i/batchSize) + 1}:`, error.message);
      // Try inserting one by one to find the problematic record
      for (const record of batch) {
        const { error: singleError } = await supabase.from('respondents').insert(record);
        if (singleError) {
          console.error(`    Failed record ${record.respondent_id}:`, singleError.message);
        } else {
          inserted++;
        }
      }
    } else {
      inserted += batch.length;
    }
    process.stdout.write(`  Progress: ${inserted}/${respondents.length}\r`);
  }

  // Update segment quota counts to match
  console.log('\n\n  Updating segment quota counters...');
  for (const { segment, count } of segmentTargets) {
    await supabase
      .from('segment_quotas')
      .update({ current_count: count })
      .eq('segment', segment);
  }

  // Update retailer fill counts
  console.log('  Updating retailer fill counts...');
  const retailerCounts = {};
  for (const r of respondents) {
    if (r.completion_status === 'complete') {
      [r.nps_r1_store, r.nps_r2_store, r.nps_r3_store].filter(Boolean).forEach(store => {
        retailerCounts[store] = (retailerCounts[store] || 0) + 1;
      });
    }
  }
  for (const [retailer, count] of Object.entries(retailerCounts)) {
    await supabase
      .from('retailer_fill_counts')
      .update({ count })
      .eq('retailer_code', retailer);
  }

  console.log(`\n✅ Done! Inserted ${inserted} respondents.`);
  console.log(`   - ${totalComplete} completed`);
  console.log(`   - ${terminatedCount} terminated`);
  console.log('\n  Check your Supabase Table Editor to verify.');
}

main().catch(console.error);
