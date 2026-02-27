import type { QuestionDef } from './constants/blocks';
import type { Respondent } from './types';
import {
  RETAILERS, RETAILER_LABELS, KPC_ATTRIBUTES, FUNNEL_LABELS,
  SEGMENT_LABELS, SOW_DIR_LABELS, FREQ_LABELS,
  countBy, pct,
} from './constants/labels';

type Row = (string | number)[];

function escapeCsv(val: string | number): string {
  const s = String(val);
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return '"' + s.replace(/"/g, '""') + '"';
  }
  return s;
}

function toCsvString(headers: string[], rows: Row[]): string {
  const lines = [headers.map(escapeCsv).join(',')];
  rows.forEach(row => lines.push(row.map(escapeCsv).join(',')));
  return lines.join('\n');
}

function downloadCsv(csv: string, filename: string) {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ─── Per-question CSV builders ──────────────────────────────

function buildFrequencyCSV(data: Respondent[], field: string, labels: Record<string | number, string> | null): { headers: string[]; rows: Row[] } {
  const counts = countBy(data, field);
  const total = data.filter(r => r[field] !== undefined && r[field] !== null && r[field] !== '').length;
  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  const headers = ['Response', 'n', '%'];
  const rows: Row[] = sorted.map(([val, count]) => [
    labels ? (labels[val] || val) : val,
    count,
    pct(count, total) + '%',
  ]);
  rows.push(['Total (non-blank)', total, '100.0%']);
  return { headers, rows };
}

function buildFunnelCSV(data: Respondent[]): { headers: string[]; rows: Row[] } {
  const retailers = RETAILERS.filter(r => r !== 'other');
  const total = data.length;
  const headers = ['Retailer', ...Object.values(FUNNEL_LABELS), 'Shopped 3mo %'];
  const rows: Row[] = retailers.map(r => {
    const counts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
    data.forEach(row => {
      const v = Number(row[`funnel_${r}`]);
      if (v >= 1 && v <= 6) counts[v]++;
    });
    return [
      RETAILER_LABELS[r],
      ...([1, 2, 3, 4, 5, 6] as const).map(i => `${counts[i]} (${pct(counts[i], total)}%)`),
      pct(counts[6], total) + '%',
    ];
  });
  return { headers, rows };
}

function buildSOWCSV(data: Respondent[]): { headers: string[]; rows: Row[] } {
  const stores: Record<string, { total: number; count: number }> = {};
  data.forEach(r => {
    [1, 2, 3].forEach(i => {
      const name = r[`sow_store${i}_name`];
      const pctVal = Number(r[`sow_store${i}_pct`]);
      if (name && !isNaN(pctVal)) {
        if (!stores[name]) stores[name] = { total: 0, count: 0 };
        stores[name].total += pctVal;
        stores[name].count++;
      }
    });
  });
  const entries = Object.entries(stores)
    .map(([name, { total, count }]) => ({ name, avgPct: total / count, count, totalPct: total }))
    .sort((a, b) => b.totalPct - a.totalPct);
  const grandTotal = entries.reduce((s, r) => s + r.totalPct, 0);

  const headers = ['Retailer', 'Respondents Allocating', 'Avg % (among allocators)', 'Aggregate SOW Share'];
  const rows: Row[] = entries.map(e => [
    RETAILER_LABELS[e.name] || e.name,
    e.count,
    e.avgPct.toFixed(1) + '%',
    (grandTotal ? (e.totalPct / grandTotal * 100) : 0).toFixed(1) + '%',
  ]);
  return { headers, rows };
}

function buildNPSCSV(data: Respondent[]): { headers: string[]; rows: Row[] } {
  const stores: Record<string, { scores: number[]; promoters: number; passives: number; detractors: number }> = {};
  data.forEach(r => {
    [1, 2, 3].forEach(i => {
      const store = r[`nps_r${i}_store`];
      const score = Number(r[`nps_r${i}_score`]);
      const cat = r[`nps_r${i}_category`];
      if (store && !isNaN(score) && cat) {
        if (!stores[store]) stores[store] = { scores: [], promoters: 0, passives: 0, detractors: 0 };
        stores[store].scores.push(score);
        if (cat === 'promoter') stores[store].promoters++;
        else if (cat === 'passive') stores[store].passives++;
        else stores[store].detractors++;
      }
    });
  });
  const headers = ['Retailer', 'n', 'NPS', 'Avg Score', '% Promoter', '% Passive', '% Detractor'];
  const rows: Row[] = Object.entries(stores).map(([store, d]) => {
    const n = d.scores.length;
    const nps = n ? ((d.promoters - d.detractors) / n * 100).toFixed(0) : '—';
    const avg = n ? (d.scores.reduce((a, b) => a + b, 0) / n).toFixed(1) : '—';
    return [RETAILER_LABELS[store] || store, n, nps, avg, pct(d.promoters, n) + '%', pct(d.passives, n) + '%', pct(d.detractors, n) + '%'];
  }).sort((a, b) => Number(b[2]) - Number(a[2]));
  return { headers, rows };
}

function buildNPSVerbatimCSV(data: Respondent[]): { headers: string[]; rows: Row[] } {
  const headers = ['Retailer', 'Score', 'Category', 'Segment', 'Verbatim'];
  const rows: Row[] = [];
  data.forEach(r => {
    [1, 2, 3].forEach(i => {
      const store = r[`nps_r${i}_store`];
      const score = r[`nps_r${i}_score`];
      const cat = r[`nps_r${i}_category`];
      const text = r[`nps_r${i}_verbatim`];
      if (store && text && String(text).length > 5) {
        rows.push([RETAILER_LABELS[store] || store, score, cat, SEGMENT_LABELS[r.segment] || r.segment || '', String(text)]);
      }
    });
  });
  return { headers, rows };
}

function buildKPCImportanceCSV(data: Respondent[]): { headers: string[]; rows: Row[] } {
  const headers = ['Attribute', 'n', 'Mean (1-5)', 'Top-2 Box %'];
  const rows: Row[] = KPC_ATTRIBUTES.map(attr => {
    const field = `k1_imp_${attr.key}`;
    const vals = data.map(r => Number(r[field])).filter(v => !isNaN(v) && v >= 1 && v <= 5);
    const avg = vals.length ? (vals.reduce((a, b) => a + b, 0) / vals.length) : 0;
    const top2 = vals.filter(v => v >= 4).length;
    return [attr.label, vals.length, avg.toFixed(2), (vals.length ? (top2 / vals.length * 100) : 0).toFixed(1) + '%'];
  }).sort((a, b) => Number(b[2]) - Number(a[2]));
  return { headers, rows };
}

function buildKPCPerformanceCSV(data: Respondent[]): { headers: string[]; rows: Row[] } {
  const stores: Record<string, Record<string, number[]>> = {};
  data.forEach(r => {
    [1, 2, 3].forEach(i => {
      const store = r[`nps_r${i}_store`];
      if (!store) return;
      if (!stores[store]) stores[store] = {};
      KPC_ATTRIBUTES.forEach(attr => {
        const v = Number(r[`k2_perf_r${i}_${attr.key}`]);
        if (!isNaN(v) && v >= 1 && v <= 5) {
          if (!stores[store][attr.key]) stores[store][attr.key] = [];
          stores[store][attr.key].push(v);
        }
      });
    });
  });
  const headers = ['Retailer', 'n', ...KPC_ATTRIBUTES.map(a => a.label)];
  const rows: Row[] = Object.entries(stores).map(([store, attrs]) => {
    const n = Math.max(...KPC_ATTRIBUTES.map(a => (attrs[a.key] || []).length), 0);
    return [
      RETAILER_LABELS[store] || store,
      n,
      ...KPC_ATTRIBUTES.map(a => {
        const vals = attrs[a.key] || [];
        return vals.length ? (vals.reduce((x, y) => x + y, 0) / vals.length).toFixed(1) : '—';
      }),
    ];
  }).sort((a, b) => Number(b[1]) - Number(a[1])).slice(0, 10);
  return { headers, rows };
}

function buildSOWDirectionCSV(data: Respondent[], dirField: string): { headers: string[]; rows: Row[] } {
  const stores: Record<string, { counts: Record<number, number>; total: number }> = {};
  data.forEach(r => {
    [1, 2, 3].forEach(i => {
      const name = r[`sow_store${i}_name`];
      const dir = Number(r[`sow_${dirField}_store${i}_dir`]);
      if (name && dir >= 1 && dir <= 5) {
        if (!stores[name]) stores[name] = { counts: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }, total: 0 };
        stores[name].counts[dir]++;
        stores[name].total++;
      }
    });
  });
  const headers = ['Retailer', 'n', ...Object.values(SOW_DIR_LABELS), 'Net Direction'];
  const rows: Row[] = Object.entries(stores)
    .map(([name, d]) => {
      const net = d.total ? (((d.counts[4] + d.counts[5]) - (d.counts[1] + d.counts[2])) / d.total * 100).toFixed(0) : '0';
      return [
        RETAILER_LABELS[name] || name,
        d.total,
        ...([1, 2, 3, 4, 5] as const).map(l => `${d.counts[l]} (${pct(d.counts[l], d.total)}%)`),
        (Number(net) > 0 ? '+' : '') + net + 'pp',
      ];
    })
    .sort((a, b) => Number(b[1]) - Number(a[1]));
  return { headers, rows };
}

function buildTradedownCSV(data: Respondent[]): { headers: string[]; rows: Row[] } {
  const behaviors = [
    { field: 'tradedown_storebrand', label: 'Switched to store brand' },
    { field: 'tradedown_organic', label: 'Reduced organic purchases' },
    { field: 'tradedown_premium', label: 'Fewer premium products' },
    { field: 'tradedown_discount_grocer', label: 'Shopped discount grocer more' },
    { field: 'tradedown_coupons', label: 'More coupons / deals' },
    { field: 'tradedown_food_waste', label: 'Reduced food waste / bought less' },
    { field: 'tradedown_none', label: 'None of the above' },
  ];
  const total = data.filter(r => r.completion_status === 'complete').length;
  const headers = ['Behavior', 'n', '%'];
  const rows: Row[] = behaviors.map(b => {
    const yes = data.filter(r => Number(r[b.field]) === 1).length;
    return [b.label, yes, pct(yes, total) + '%'];
  }).sort((a, b) => Number(b[1]) - Number(a[1]));
  return { headers, rows };
}

function buildBestValueCSV(data: Respondent[]): { headers: string[]; rows: Row[] } {
  const c: Record<string, number> = {};
  data.forEach(r => {
    [r.best_value_1, r.best_value_2].forEach(v => {
      if (v) c[v] = (c[v] || 0) + 1;
    });
  });
  const total = data.filter(r => r.best_value_1).length;
  const headers = ['Retailer', 'Mentions', '% of Respondents'];
  const rows: Row[] = Object.entries(c).sort((a, b) => b[1] - a[1]).map(([name, count]) => [
    RETAILER_LABELS[name] || name, count, pct(count, total) + '%',
  ]);
  return { headers, rows };
}

function buildPriceRankCSV(data: Respondent[]): { headers: string[]; rows: Row[] } {
  const raised: Record<string, number> = {};
  const stable: Record<string, number> = {};
  data.forEach(r => {
    [1, 2, 3].forEach(rank => {
      const rr = r[`price_raised_rank_${rank}`];
      const sr = r[`price_stable_rank_${rank}`];
      if (rr) raised[rr] = (raised[rr] || 0) + (4 - rank);
      if (sr) stable[sr] = (stable[sr] || 0) + (4 - rank);
    });
  });
  const allStores = Array.from(new Set(Object.keys(raised).concat(Object.keys(stable))));
  const headers = ['Retailer', 'Raised Prices (weighted)', 'Price Stable (weighted)'];
  const rows: Row[] = allStores.map(s => [
    RETAILER_LABELS[s] || s, raised[s] || 0, stable[s] || 0,
  ]).sort((a, b) => Number(b[2]) - Number(a[2]));
  return { headers, rows };
}

function buildStoreFreqCSV(data: Respondent[]): { headers: string[]; rows: Row[] } {
  const stores: Record<string, { vals: number[]; counts: Record<number, number> }> = {};
  data.forEach(r => {
    [1, 2, 3].forEach(i => {
      const name = r[`sow_store${i}_name`];
      const freq = Number(r[`freq_store${i}`]);
      if (name && freq >= 1 && freq <= 5) {
        if (!stores[name]) stores[name] = { vals: [], counts: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } };
        stores[name].vals.push(freq);
        stores[name].counts[freq]++;
      }
    });
  });
  const headers = ['Retailer', 'n', 'Avg Freq (1-5)', ...Object.values(FREQ_LABELS)];
  const rows: Row[] = Object.entries(stores).map(([name, d]) => [
    RETAILER_LABELS[name] || name,
    d.vals.length,
    (d.vals.reduce((a, b) => a + b, 0) / d.vals.length).toFixed(2),
    ...([1, 2, 3, 4, 5] as const).map(f => `${d.counts[f]} (${pct(d.counts[f], d.vals.length)}%)`),
  ]).sort((a, b) => Number(b[1]) - Number(a[1])).slice(0, 12);
  return { headers, rows };
}

function buildOverviewCSV(data: Respondent[]): { headers: string[]; rows: Row[] } {
  const complete = data.filter(r => r.completion_status === 'complete').length;
  const termed = data.filter(r => r.completion_status === 'terminated').length;
  const durations = data.filter(r => r.completion_status === 'complete' && r.duration_seconds)
    .map(r => Number(r.duration_seconds)).filter(v => !isNaN(v));
  const avgDur = durations.length ? (durations.reduce((a, b) => a + b, 0) / durations.length / 60).toFixed(1) : '—';
  const sortedDurations = [...durations].sort((a, b) => a - b);
  const medDur = sortedDurations.length ? (sortedDurations[Math.floor(sortedDurations.length / 2)] / 60).toFixed(1) : '—';

  const segments = countBy(data.filter(r => r.segment), 'segment');
  const headers = ['Metric', 'Value'];
  const rows: Row[] = [
    ['Total Responses', data.length],
    ['Completes', complete],
    ['Terminated', termed],
    ['Completion Rate', pct(complete, data.length) + '%'],
    ['Avg Duration (min)', avgDur],
    ['Median Duration (min)', medDur],
    ['', ''],
    ['Segment', 'n'],
    ...Object.entries(segments).sort((a, b) => b[1] - a[1]).map(([seg, n]) => [SEGMENT_LABELS[seg] || seg, n] as Row),
  ];
  return { headers, rows };
}

function buildCompletionCSV(data: Respondent[]): { headers: string[]; rows: Row[] } {
  const terms = countBy(data.filter(r => r.termination_point), 'termination_point');
  const total = data.length;
  const headers = ['Termination Point', 'n', '% of All'];
  const rows: Row[] = Object.entries(terms).sort((a, b) => b[1] - a[1]).map(([tp, n]) => [tp, n, pct(n, total) + '%']);
  return { headers, rows };
}

function buildQCCSV(data: Respondent[]): { headers: string[]; rows: Row[] } {
  const complete = data.filter(r => r.completion_status === 'complete');
  const n = complete.length;
  const flags = [
    { field: 'qc_speeder', label: 'Speeders (< 3 min)' },
    { field: 'qc_straightliner_k1', label: 'Straightliners (K1)' },
    { field: 'qc_straightliner_k2', label: 'Straightliners (K2)' },
    { field: 'qc_gibberish_nps', label: 'Gibberish NPS verbatim' },
    { field: 'qc_gibberish_l1a', label: 'Gibberish L1a verbatim' },
    { field: 'qc_gibberish_l2a', label: 'Gibberish L2a verbatim' },
    { field: 'qc_sow_tie', label: 'SOW tie (primary ambiguous)' },
  ];
  const headers = ['Flag', 'Flagged', '% of Completes'];
  const rows: Row[] = flags.map(f => {
    const flagged = complete.filter(r => Number(r[f.field]) === 1).length;
    return [f.label, flagged, pct(flagged, n) + '%'];
  });
  return { headers, rows };
}

// ─── Main export function ───────────────────────────────────

export function exportQuestionCSV(question: QuestionDef, data: Respondent[]) {
  let result: { headers: string[]; rows: Row[] };

  switch (question.type) {
    case 'custom_overview':
      result = buildOverviewCSV(data); break;
    case 'custom_completion':
      result = buildCompletionCSV(data); break;
    case 'custom_qc':
      result = buildQCCSV(data); break;
    case 'categorical':
      result = buildFrequencyCSV(data, question.field!, question.labels ?? null); break;
    case 'funnel_matrix':
      result = buildFunnelCSV(data); break;
    case 'custom_sow':
      result = buildSOWCSV(data); break;
    case 'custom_store_freq':
      result = buildStoreFreqCSV(data); break;
    case 'custom_nps':
      result = buildNPSCSV(data); break;
    case 'custom_nps_verbatim':
      result = buildNPSVerbatimCSV(data); break;
    case 'custom_kpc_importance':
      result = buildKPCImportanceCSV(data); break;
    case 'custom_kpc_performance':
      result = buildKPCPerformanceCSV(data); break;
    case 'custom_sow_direction':
      result = buildSOWDirectionCSV(data, question.dirField!); break;
    case 'custom_tradedown':
      result = buildTradedownCSV(data); break;
    case 'custom_best_value':
      result = buildBestValueCSV(data); break;
    case 'custom_price_rank':
      result = buildPriceRankCSV(data); break;
    default:
      return;
  }

  const filename = `fareway_${question.id}_${new Date().toISOString().slice(0, 10)}.csv`;
  const csv = toCsvString(result.headers, result.rows);
  downloadCsv(csv, filename);
}
