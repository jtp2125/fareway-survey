'use client';

import { useMemo } from 'react';
import { countBy, pct } from '../constants/labels';
import type { Respondent } from '../types';

interface Props {
  data: Respondent[];
  field: string;
  labels: Record<string | number, string> | null;
}

export default function FrequencyTable({ data, field, labels }: Props) {
  const counts = useMemo(() => countBy(data, field), [data, field]);
  const total = data.filter(r => r[field] !== undefined && r[field] !== null && r[field] !== '').length;
  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-[13px]">
        <thead>
          <tr>
            <th className="px-3 py-2 text-left border-b-2 border-[#334155] text-[#94a3b8] text-[11px] font-semibold uppercase tracking-wide">Response</th>
            <th className="px-3 py-2 text-right border-b-2 border-[#334155] text-[#94a3b8] text-[11px] font-semibold uppercase tracking-wide">n</th>
            <th className="px-3 py-2 text-right border-b-2 border-[#334155] text-[#94a3b8] text-[11px] font-semibold uppercase tracking-wide">%</th>
            <th className="px-3 py-2 text-left border-b-2 border-[#334155] text-[#94a3b8] text-[11px] font-semibold uppercase tracking-wide w-[40%]">Distribution</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map(([val, count]) => {
            const p = pct(count, total);
            const label = labels ? (labels[val] || val) : val;
            return (
              <tr key={val} className="transition-colors">
                <td className="px-3 py-1.5 border-b border-[#1e293b] text-[#e2e8f0]">{label}</td>
                <td className="px-3 py-1.5 border-b border-[#1e293b] text-[#e2e8f0] text-right tabular-nums">{count}</td>
                <td className="px-3 py-1.5 border-b border-[#1e293b] text-[#e2e8f0] text-right tabular-nums">{p}%</td>
                <td className="px-3 py-1.5 border-b border-[#1e293b] text-[#e2e8f0]">
                  <div className="h-2 bg-[#1e293b] rounded overflow-hidden">
                    <div className="h-full bg-[#6366f1] rounded transition-all duration-300" style={{ width: `${p}%` }} />
                  </div>
                </td>
              </tr>
            );
          })}
          <tr className="font-semibold border-t-2 border-[#374151]">
            <td className="px-3 py-1.5 border-b border-[#1e293b] text-[#e2e8f0]">Total (non-blank)</td>
            <td className="px-3 py-1.5 border-b border-[#1e293b] text-[#e2e8f0] text-right">{total}</td>
            <td className="px-3 py-1.5 border-b border-[#1e293b] text-[#e2e8f0] text-right">100.0%</td>
            <td className="px-3 py-1.5 border-b border-[#1e293b]" />
          </tr>
        </tbody>
      </table>
    </div>
  );
}
