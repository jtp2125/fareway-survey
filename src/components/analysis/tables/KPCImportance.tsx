'use client';

import { useMemo } from 'react';
import { KPC_ATTRIBUTES } from '../constants/labels';
import type { Respondent } from '../types';

export default function KPCImportance({ data }: { data: Respondent[] }) {
  const stats = useMemo(() => {
    return KPC_ATTRIBUTES.map(attr => {
      const field = `k1_imp_${attr.key}`;
      const vals = data.map(r => Number(r[field])).filter(v => !isNaN(v) && v >= 1 && v <= 5);
      const avg = vals.length ? (vals.reduce((a, b) => a + b, 0) / vals.length) : 0;
      const top2 = vals.filter(v => v >= 4).length;
      return { ...attr, avg, top2Pct: vals.length ? top2 / vals.length * 100 : 0, n: vals.length };
    }).sort((a, b) => b.avg - a.avg);
  }, [data]);

  return (
    <table className="w-full border-collapse text-[13px]">
      <thead>
        <tr>
          <th className="px-3 py-2 text-left border-b-2 border-[#334155] text-[#94a3b8] text-[11px] font-semibold uppercase">Attribute</th>
          <th className="px-3 py-2 text-right border-b-2 border-[#334155] text-[#94a3b8] text-[11px] font-semibold uppercase">n</th>
          <th className="px-3 py-2 text-right border-b-2 border-[#334155] text-[#94a3b8] text-[11px] font-semibold uppercase">Mean (1\u20135)</th>
          <th className="px-3 py-2 text-right border-b-2 border-[#334155] text-[#94a3b8] text-[11px] font-semibold uppercase">Top-2 Box %</th>
          <th className="px-3 py-2 text-left border-b-2 border-[#334155] text-[#94a3b8] text-[11px] font-semibold uppercase w-[30%]">Importance</th>
        </tr>
      </thead>
      <tbody>
        {stats.map(s => (
          <tr key={s.key} className="transition-colors">
            <td className="px-3 py-1.5 border-b border-[#1e293b] text-[#e2e8f0] font-semibold">{s.label}</td>
            <td className="px-3 py-1.5 border-b border-[#1e293b] text-[#e2e8f0] text-right">{s.n}</td>
            <td className="px-3 py-1.5 border-b border-[#1e293b] text-[#e2e8f0] text-right">{s.avg.toFixed(2)}</td>
            <td className="px-3 py-1.5 border-b border-[#1e293b] text-[#e2e8f0] text-right">{s.top2Pct.toFixed(1)}%</td>
            <td className="px-3 py-1.5 border-b border-[#1e293b]">
              <div className="h-2 bg-[#1e293b] rounded overflow-hidden">
                <div className="h-full bg-[#6366f1] rounded transition-all duration-300" style={{ width: `${s.avg / 5 * 100}%` }} />
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
