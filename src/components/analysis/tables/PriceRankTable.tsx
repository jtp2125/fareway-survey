'use client';

import { useMemo } from 'react';
import { RETAILER_LABELS } from '../constants/labels';
import type { Respondent } from '../types';

export default function PriceRankTable({ data }: { data: Respondent[] }) {
  const rankData = useMemo(() => {
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
    return allStores.map(s => ({
      store: s,
      raisedScore: raised[s] || 0,
      stableScore: stable[s] || 0,
    })).sort((a, b) => b.stableScore - a.stableScore);
  }, [data]);

  const maxR = Math.max(...rankData.map(d => d.raisedScore), 1);
  const maxS = Math.max(...rankData.map(d => d.stableScore), 1);

  return (
    <table className="w-full border-collapse text-[13px]">
      <thead>
        <tr>
          <th className="px-3 py-2 text-left border-b-2 border-[#334155] text-[#94a3b8] text-[11px] font-semibold uppercase">Retailer</th>
          <th className="px-3 py-2 text-center border-b-2 border-[#334155] text-[#94a3b8] text-[11px] font-semibold uppercase" colSpan={2}>Raised Prices Most (weighted score)</th>
          <th className="px-3 py-2 text-center border-b-2 border-[#334155] text-[#94a3b8] text-[11px] font-semibold uppercase" colSpan={2}>Most Price Stable (weighted score)</th>
        </tr>
      </thead>
      <tbody>
        {rankData.map(d => (
          <tr key={d.store} className="transition-colors">
            <td className="px-3 py-1.5 border-b border-[#1e293b] text-[#e2e8f0] font-semibold">{RETAILER_LABELS[d.store] || d.store}</td>
            <td className="px-3 py-1.5 border-b border-[#1e293b] text-right w-[80px] text-[#ef4444]">{d.raisedScore}</td>
            <td className="px-3 py-1.5 border-b border-[#1e293b] w-[120px]">
              <div className="h-2 bg-[#1e293b] rounded overflow-hidden">
                <div className="h-full bg-[#ef4444] rounded transition-all duration-300" style={{ width: `${d.raisedScore / maxR * 100}%` }} />
              </div>
            </td>
            <td className="px-3 py-1.5 border-b border-[#1e293b] text-right w-[80px] text-[#22c55e]">{d.stableScore}</td>
            <td className="px-3 py-1.5 border-b border-[#1e293b] w-[120px]">
              <div className="h-2 bg-[#1e293b] rounded overflow-hidden">
                <div className="h-full bg-[#22c55e] rounded transition-all duration-300" style={{ width: `${d.stableScore / maxS * 100}%` }} />
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
