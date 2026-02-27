'use client';

import { useMemo } from 'react';
import { RETAILER_LABELS, pct } from '../constants/labels';
import type { Respondent } from '../types';

export default function BestValueTable({ data }: { data: Respondent[] }) {
  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    data.forEach(r => {
      [r.best_value_1, r.best_value_2].forEach(v => {
        if (v) c[v] = (c[v] || 0) + 1;
      });
    });
    return Object.entries(c).sort((a, b) => b[1] - a[1]);
  }, [data]);
  const total = data.filter(r => r.best_value_1).length;

  return (
    <table className="w-full border-collapse text-[13px]">
      <thead>
        <tr>
          <th className="px-3 py-2 text-left border-b-2 border-[#334155] text-[#94a3b8] text-[11px] font-semibold uppercase">Retailer</th>
          <th className="px-3 py-2 text-right border-b-2 border-[#334155] text-[#94a3b8] text-[11px] font-semibold uppercase">Mentions</th>
          <th className="px-3 py-2 text-right border-b-2 border-[#334155] text-[#94a3b8] text-[11px] font-semibold uppercase">% of Respondents</th>
          <th className="px-3 py-2 text-left border-b-2 border-[#334155] text-[#94a3b8] text-[11px] font-semibold uppercase w-[35%]" />
        </tr>
      </thead>
      <tbody>
        {counts.map(([name, count]) => (
          <tr key={name} className="transition-colors">
            <td className="px-3 py-1.5 border-b border-[#1e293b] text-[#e2e8f0] font-semibold">{RETAILER_LABELS[name] || name}</td>
            <td className="px-3 py-1.5 border-b border-[#1e293b] text-[#e2e8f0] text-right">{count}</td>
            <td className="px-3 py-1.5 border-b border-[#1e293b] text-[#e2e8f0] text-right">{pct(count, total)}%</td>
            <td className="px-3 py-1.5 border-b border-[#1e293b]">
              <div className="h-2 bg-[#1e293b] rounded overflow-hidden">
                <div className="h-full bg-[#10b981] rounded transition-all duration-300" style={{ width: `${pct(count, total)}%` }} />
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
