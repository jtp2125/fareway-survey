'use client';

import { useMemo } from 'react';
import { RETAILER_LABELS, FREQ_LABELS, pct } from '../constants/labels';
import type { Respondent } from '../types';

export default function StoreFreqTable({ data }: { data: Respondent[] }) {
  const freqData = useMemo(() => {
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
    return Object.entries(stores).map(([name, d]) => ({
      name, n: d.vals.length,
      avg: d.vals.reduce((a, b) => a + b, 0) / d.vals.length,
      counts: d.counts
    })).sort((a, b) => b.n - a.n);
  }, [data]);

  return (
    <table className="w-full border-collapse text-[13px]">
      <thead>
        <tr>
          <th className="px-3 py-2 text-left border-b-2 border-[#334155] text-[#94a3b8] text-[11px] font-semibold uppercase">Retailer</th>
          <th className="px-3 py-2 text-right border-b-2 border-[#334155] text-[#94a3b8] text-[11px] font-semibold uppercase">n</th>
          <th className="px-3 py-2 text-right border-b-2 border-[#334155] text-[#94a3b8] text-[11px] font-semibold uppercase">Avg Freq (1\u20135)</th>
          {Object.entries(FREQ_LABELS).map(([k, v]) => (
            <th key={k} className="px-3 py-2 text-center border-b-2 border-[#334155] text-[#94a3b8] text-[11px] font-semibold">{v}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {freqData.slice(0, 12).map(row => (
          <tr key={row.name} className="transition-colors">
            <td className="px-3 py-1.5 border-b border-[#1e293b] text-[#e2e8f0] font-semibold">{RETAILER_LABELS[row.name] || row.name}</td>
            <td className="px-3 py-1.5 border-b border-[#1e293b] text-[#e2e8f0] text-right">{row.n}</td>
            <td className="px-3 py-1.5 border-b border-[#1e293b] text-[#e2e8f0] text-right">{row.avg.toFixed(2)}</td>
            {[1, 2, 3, 4, 5].map(f => (
              <td key={f} className="px-3 py-1.5 border-b border-[#1e293b] text-[#e2e8f0] text-center">
                {row.counts[f]} <span className="text-[#64748b] text-[10px]">({pct(row.counts[f], row.n)}%)</span>
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
