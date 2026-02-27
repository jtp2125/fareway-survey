'use client';

import { SEGMENT_LABELS, pct, countBy } from '../constants/labels';
import type { Respondent } from '../types';

export default function OverviewSummary({ data }: { data: Respondent[] }) {
  const complete = data.filter(r => r.completion_status === 'complete').length;
  const termed = data.filter(r => r.completion_status === 'terminated').length;
  const durations = data.filter(r => r.completion_status === 'complete' && r.duration_seconds)
    .map(r => Number(r.duration_seconds)).filter(v => !isNaN(v));
  const avgDur = durations.length ? (durations.reduce((a, b) => a + b, 0) / durations.length / 60).toFixed(1) : '\u2014';
  const sortedDurations = [...durations].sort((a, b) => a - b);
  const medDur = sortedDurations.length ? (sortedDurations[Math.floor(sortedDurations.length / 2)] / 60).toFixed(1) : '\u2014';

  const segments = countBy(data.filter(r => r.segment), 'segment');

  const cards = [
    { label: 'Total Responses', val: data.length, color: '#6366f1' },
    { label: 'Completes', val: complete, color: '#22c55e' },
    { label: 'Terminated', val: termed, color: '#ef4444' },
    { label: 'Completion Rate', val: `${pct(complete, data.length)}%`, color: '#f59e0b' },
    { label: 'Avg Duration', val: `${avgDur} min`, color: '#8b5cf6' },
    { label: 'Med Duration', val: `${medDur} min`, color: '#06b6d4' },
  ];

  return (
    <div>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(160px,1fr))] gap-3 mb-5">
        {cards.map(m => (
          <div key={m.label} className="bg-[#1a1f2e] rounded-lg p-4" style={{ borderLeft: `3px solid ${m.color}` }}>
            <div className="text-[11px] text-[#94a3b8] uppercase tracking-wide">{m.label}</div>
            <div className="text-2xl font-bold text-[#e2e8f0] mt-1">{m.val}</div>
          </div>
        ))}
      </div>
      <h4 className="text-[#94a3b8] text-[12px] uppercase mb-2">Segment Breakdown (filtered set)</h4>
      <table className="w-full border-collapse text-[13px]">
        <thead>
          <tr>
            <th className="px-3 py-2 text-left border-b-2 border-[#334155] text-[#94a3b8] text-[11px] font-semibold uppercase">Segment</th>
            <th className="px-3 py-2 text-right border-b-2 border-[#334155] text-[#94a3b8] text-[11px] font-semibold uppercase">n</th>
            <th className="px-3 py-2 text-right border-b-2 border-[#334155] text-[#94a3b8] text-[11px] font-semibold uppercase">%</th>
          </tr>
        </thead>
        <tbody>
          {Object.entries(segments).sort((a, b) => b[1] - a[1]).map(([seg, n]) => (
            <tr key={seg} className="transition-colors">
              <td className="px-3 py-1.5 border-b border-[#1e293b] text-[#e2e8f0]">{SEGMENT_LABELS[seg] || seg}</td>
              <td className="px-3 py-1.5 border-b border-[#1e293b] text-[#e2e8f0] text-right">{n}</td>
              <td className="px-3 py-1.5 border-b border-[#1e293b] text-[#e2e8f0] text-right">{pct(n, complete)}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
