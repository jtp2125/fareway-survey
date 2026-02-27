'use client';

import { useMemo } from 'react';
import { RETAILERS, RETAILER_LABELS, FUNNEL_LABELS, pct } from '../constants/labels';
import type { Respondent } from '../types';

export default function FunnelMatrix({ data }: { data: Respondent[] }) {
  const retailers = RETAILERS.filter(r => r !== 'other');
  const funnelCounts = useMemo(() => {
    const result: Record<string, Record<number, number>> = {};
    retailers.forEach(r => {
      result[r] = {};
      for (let i = 1; i <= 6; i++) result[r][i] = 0;
      data.forEach(row => {
        const v = Number(row[`funnel_${r}`]);
        if (v >= 1 && v <= 6) result[r][v]++;
      });
    });
    return result;
  }, [data]);

  const total = data.length;

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-[13px]">
        <thead>
          <tr>
            <th className="px-3 py-2 text-left border-b-2 border-[#334155] text-[#94a3b8] text-[11px] font-semibold uppercase sticky left-0 bg-[#1a1f2e] z-[2]">Retailer</th>
            {Object.entries(FUNNEL_LABELS).map(([k, v]) => (
              <th key={k} className="px-3 py-2 text-center border-b-2 border-[#334155] text-[#94a3b8] text-[11px] font-semibold min-w-[80px]">{v}</th>
            ))}
            <th className="px-3 py-2 text-center border-b-2 border-[#334155] text-[#94a3b8] text-[11px] font-semibold">Shopped 3mo<br />(% of total)</th>
          </tr>
        </thead>
        <tbody>
          {retailers.map(r => {
            const counts = funnelCounts[r];
            const shop3mo = counts[6] || 0;
            return (
              <tr key={r} className="transition-colors">
                <td className="px-3 py-1.5 border-b border-[#1e293b] text-[#e2e8f0] font-semibold sticky left-0 bg-[#0f1219] z-[1]">
                  {RETAILER_LABELS[r]}
                </td>
                {[1, 2, 3, 4, 5, 6].map(level => {
                  const n = counts[level] || 0;
                  const p = pct(n, total);
                  const intensity = Math.min(n / total * 4, 1);
                  const bg = level === 6
                    ? `rgba(34, 197, 94, ${intensity * 0.5})`
                    : `rgba(148, 163, 184, ${intensity * 0.3})`;
                  return (
                    <td key={level} className="px-3 py-1.5 border-b border-[#1e293b] text-center" style={{ background: bg }}>
                      <span className="font-semibold text-[#e2e8f0]">{n}</span>
                      <span className="text-[#94a3b8] text-[11px] ml-1">({p}%)</span>
                    </td>
                  );
                })}
                <td className="px-3 py-1.5 border-b border-[#1e293b] text-center font-bold text-[#22c55e]">
                  {pct(shop3mo, total)}%
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
