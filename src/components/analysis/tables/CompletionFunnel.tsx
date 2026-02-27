'use client';

import { countBy, pct } from '../constants/labels';
import type { Respondent } from '../types';

export default function CompletionFunnel({ data }: { data: Respondent[] }) {
  const terms = countBy(data.filter(r => r.termination_point), 'termination_point');
  const total = data.length;

  return (
    <div>
      <p className="text-[#94a3b8] text-[13px] mb-3">Termination points for screened-out respondents</p>
      <table className="w-full border-collapse text-[13px]">
        <thead>
          <tr>
            <th className="px-3 py-2 text-left border-b-2 border-[#334155] text-[#94a3b8] text-[11px] font-semibold uppercase">Termination Point</th>
            <th className="px-3 py-2 text-right border-b-2 border-[#334155] text-[#94a3b8] text-[11px] font-semibold uppercase">n</th>
            <th className="px-3 py-2 text-right border-b-2 border-[#334155] text-[#94a3b8] text-[11px] font-semibold uppercase">% of All</th>
          </tr>
        </thead>
        <tbody>
          {Object.entries(terms).sort((a, b) => b[1] - a[1]).map(([tp, n]) => (
            <tr key={tp} className="transition-colors">
              <td className="px-3 py-1.5 border-b border-[#1e293b] text-[#e2e8f0]">{tp}</td>
              <td className="px-3 py-1.5 border-b border-[#1e293b] text-[#e2e8f0] text-right">{n}</td>
              <td className="px-3 py-1.5 border-b border-[#1e293b] text-[#e2e8f0] text-right">{pct(n, total)}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
