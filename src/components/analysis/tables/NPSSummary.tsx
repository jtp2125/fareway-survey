'use client';

import { useMemo } from 'react';
import { RETAILER_LABELS, pct } from '../constants/labels';
import type { Respondent } from '../types';

export default function NPSSummary({ data }: { data: Respondent[] }) {
  const npsData = useMemo(() => {
    const stores: Record<string, { scores: number[]; promoters: number; passives: number; detractors: number }> = {};
    data.forEach(r => {
      [1, 2, 3].forEach(i => {
        const store = r[`nps_r${i}_store`];
        const score = Number(r[`nps_r${i}_score`]);
        const cat = r[`nps_r${i}_category`];
        if (store && !isNaN(score) && cat) {
          if (!stores[store]) stores[store] = { scores: [], promoters: 0, passives: 0, detractors: 0 };
          stores[store].scores.push(score);
          if (cat === 'promoter') stores[store].promoters++;
          else if (cat === 'passive') stores[store].passives++;
          else stores[store].detractors++;
        }
      });
    });
    return Object.entries(stores).map(([store, d]) => {
      const n = d.scores.length;
      const nps = n ? Number(((d.promoters - d.detractors) / n * 100).toFixed(0)) : 0;
      const avg = n ? (d.scores.reduce((a, b) => a + b, 0) / n).toFixed(1) : '\u2014';
      return { store, n, nps, avg, ...d };
    }).sort((a, b) => b.nps - a.nps);
  }, [data]);

  return (
    <table className="w-full border-collapse text-[13px]">
      <thead>
        <tr>
          <th className="px-3 py-2 text-left border-b-2 border-[#334155] text-[#94a3b8] text-[11px] font-semibold uppercase">Retailer</th>
          <th className="px-3 py-2 text-right border-b-2 border-[#334155] text-[#94a3b8] text-[11px] font-semibold uppercase">n</th>
          <th className="px-3 py-2 text-right border-b-2 border-[#334155] text-[#94a3b8] text-[11px] font-semibold uppercase">NPS</th>
          <th className="px-3 py-2 text-right border-b-2 border-[#334155] text-[#94a3b8] text-[11px] font-semibold uppercase">Avg Score</th>
          <th className="px-3 py-2 text-right border-b-2 border-[#334155] text-[#94a3b8] text-[11px] font-semibold uppercase">% Promoter</th>
          <th className="px-3 py-2 text-right border-b-2 border-[#334155] text-[#94a3b8] text-[11px] font-semibold uppercase">% Passive</th>
          <th className="px-3 py-2 text-right border-b-2 border-[#334155] text-[#94a3b8] text-[11px] font-semibold uppercase">% Detractor</th>
          <th className="px-3 py-2 text-left border-b-2 border-[#334155] text-[#94a3b8] text-[11px] font-semibold uppercase w-[20%]">NPS</th>
        </tr>
      </thead>
      <tbody>
        {npsData.map(({ store, n, nps, avg, promoters, passives, detractors }) => {
          const npsColor = nps > 0 ? '#22c55e' : nps < 0 ? '#ef4444' : '#94a3b8';
          const barWidth = Math.min(Math.abs(nps), 100);
          return (
            <tr key={store} className="transition-colors">
              <td className="px-3 py-1.5 border-b border-[#1e293b] text-[#e2e8f0] font-semibold">{RETAILER_LABELS[store] || store}</td>
              <td className="px-3 py-1.5 border-b border-[#1e293b] text-[#e2e8f0] text-right">{n}</td>
              <td className="px-3 py-1.5 border-b border-[#1e293b] text-right font-bold" style={{ color: npsColor }}>{nps}</td>
              <td className="px-3 py-1.5 border-b border-[#1e293b] text-[#e2e8f0] text-right">{avg}</td>
              <td className="px-3 py-1.5 border-b border-[#1e293b] text-right text-[#22c55e]">{pct(promoters, n)}%</td>
              <td className="px-3 py-1.5 border-b border-[#1e293b] text-right text-[#f59e0b]">{pct(passives, n)}%</td>
              <td className="px-3 py-1.5 border-b border-[#1e293b] text-right text-[#ef4444]">{pct(detractors, n)}%</td>
              <td className="px-3 py-1.5 border-b border-[#1e293b]">
                <div className="flex items-center gap-1">
                  <div className="h-2 bg-[#1e293b] rounded overflow-hidden flex-1">
                    <div className="h-full rounded transition-all duration-300" style={{
                      width: `${barWidth}%`,
                      background: npsColor,
                      marginLeft: nps < 0 ? 'auto' : undefined,
                    }} />
                  </div>
                </div>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
