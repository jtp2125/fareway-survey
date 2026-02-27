'use client';

import { useMemo } from 'react';
import { RETAILER_LABELS } from '../constants/labels';
import type { Respondent } from '../types';

export default function SOWTable({ data }: { data: Respondent[] }) {
  const sowByStore = useMemo(() => {
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
    return Object.entries(stores)
      .map(([name, { total, count }]) => ({ name, avgPct: total / count, count, totalPct: total }))
      .sort((a, b) => b.totalPct - a.totalPct);
  }, [data]);

  const grandTotal = sowByStore.reduce((s, r) => s + r.totalPct, 0);

  return (
    <table className="w-full border-collapse text-[13px]">
      <thead>
        <tr>
          <th className="px-3 py-2 text-left border-b-2 border-[#334155] text-[#94a3b8] text-[11px] font-semibold uppercase">Retailer</th>
          <th className="px-3 py-2 text-right border-b-2 border-[#334155] text-[#94a3b8] text-[11px] font-semibold uppercase">Respondents Allocating</th>
          <th className="px-3 py-2 text-right border-b-2 border-[#334155] text-[#94a3b8] text-[11px] font-semibold uppercase">Avg % (among allocators)</th>
          <th className="px-3 py-2 text-right border-b-2 border-[#334155] text-[#94a3b8] text-[11px] font-semibold uppercase">Aggregate SOW Share</th>
          <th className="px-3 py-2 text-left border-b-2 border-[#334155] text-[#94a3b8] text-[11px] font-semibold uppercase w-[30%]">Share</th>
        </tr>
      </thead>
      <tbody>
        {sowByStore.map(({ name, avgPct, count, totalPct }) => {
          const share = grandTotal ? (totalPct / grandTotal * 100) : 0;
          return (
            <tr key={name} className="transition-colors">
              <td className="px-3 py-1.5 border-b border-[#1e293b] text-[#e2e8f0] font-semibold">{RETAILER_LABELS[name] || name}</td>
              <td className="px-3 py-1.5 border-b border-[#1e293b] text-[#e2e8f0] text-right">{count}</td>
              <td className="px-3 py-1.5 border-b border-[#1e293b] text-[#e2e8f0] text-right">{avgPct.toFixed(1)}%</td>
              <td className="px-3 py-1.5 border-b border-[#1e293b] text-[#e2e8f0] text-right">{share.toFixed(1)}%</td>
              <td className="px-3 py-1.5 border-b border-[#1e293b]">
                <div className="h-2 bg-[#1e293b] rounded overflow-hidden">
                  <div className="h-full bg-[#f59e0b] rounded transition-all duration-300" style={{ width: `${share}%` }} />
                </div>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
