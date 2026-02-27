'use client';

import { pct } from '../constants/labels';
import type { Respondent } from '../types';

const FLAGS = [
  { field: 'qc_speeder', label: 'Speeders (< 3 min)' },
  { field: 'qc_straightliner_k1', label: 'Straightliners (K1)' },
  { field: 'qc_straightliner_k2', label: 'Straightliners (K2)' },
  { field: 'qc_gibberish_nps', label: 'Gibberish NPS verbatim' },
  { field: 'qc_gibberish_l1a', label: 'Gibberish L1a verbatim' },
  { field: 'qc_gibberish_l2a', label: 'Gibberish L2a verbatim' },
  { field: 'qc_sow_tie', label: 'SOW tie (primary ambiguous)' },
];

export default function QCFlags({ data }: { data: Respondent[] }) {
  const complete = data.filter(r => r.completion_status === 'complete');
  const n = complete.length;

  return (
    <table className="w-full border-collapse text-[13px]">
      <thead>
        <tr>
          <th className="px-3 py-2 text-left border-b-2 border-[#334155] text-[#94a3b8] text-[11px] font-semibold uppercase">Flag</th>
          <th className="px-3 py-2 text-right border-b-2 border-[#334155] text-[#94a3b8] text-[11px] font-semibold uppercase">Flagged</th>
          <th className="px-3 py-2 text-right border-b-2 border-[#334155] text-[#94a3b8] text-[11px] font-semibold uppercase">% of Completes</th>
        </tr>
      </thead>
      <tbody>
        {FLAGS.map(f => {
          const flagged = complete.filter(r => Number(r[f.field]) === 1).length;
          return (
            <tr key={f.field} className="transition-colors">
              <td className="px-3 py-1.5 border-b border-[#1e293b] text-[#e2e8f0]">{f.label}</td>
              <td className="px-3 py-1.5 border-b border-[#1e293b] text-right" style={{ color: flagged > 0 ? '#f59e0b' : '#22c55e' }}>{flagged}</td>
              <td className="px-3 py-1.5 border-b border-[#1e293b] text-[#e2e8f0] text-right">{pct(flagged, n)}%</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
