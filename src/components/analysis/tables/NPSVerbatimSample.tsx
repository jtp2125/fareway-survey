'use client';

import { useMemo } from 'react';
import { RETAILER_LABELS, SEGMENT_LABELS } from '../constants/labels';
import type { Respondent } from '../types';

export default function NPSVerbatimSample({ data }: { data: Respondent[] }) {
  const verbatims = useMemo(() => {
    const items: { store: string; score: number; cat: string; text: string; segment: string }[] = [];
    data.forEach(r => {
      [1, 2, 3].forEach(i => {
        const store = r[`nps_r${i}_store`];
        const score = r[`nps_r${i}_score`];
        const cat = r[`nps_r${i}_category`];
        const text = r[`nps_r${i}_verbatim`];
        if (store && text && String(text).length > 5) {
          items.push({ store, score, cat, text: String(text), segment: r.segment });
        }
      });
    });
    return items.sort(() => Math.random() - 0.5).slice(0, 20);
  }, [data]);

  return (
    <table className="w-full border-collapse text-[13px]">
      <thead>
        <tr>
          <th className="px-3 py-2 text-left border-b-2 border-[#334155] text-[#94a3b8] text-[11px] font-semibold uppercase">Retailer</th>
          <th className="px-3 py-2 text-center border-b-2 border-[#334155] text-[#94a3b8] text-[11px] font-semibold uppercase">Score</th>
          <th className="px-3 py-2 text-center border-b-2 border-[#334155] text-[#94a3b8] text-[11px] font-semibold uppercase">Category</th>
          <th className="px-3 py-2 text-left border-b-2 border-[#334155] text-[#94a3b8] text-[11px] font-semibold uppercase">Segment</th>
          <th className="px-3 py-2 text-left border-b-2 border-[#334155] text-[#94a3b8] text-[11px] font-semibold uppercase">Verbatim</th>
        </tr>
      </thead>
      <tbody>
        {verbatims.map((v, i) => {
          const catColor = v.cat === 'promoter' ? '#22c55e' : v.cat === 'detractor' ? '#ef4444' : '#f59e0b';
          return (
            <tr key={i} className="transition-colors">
              <td className="px-3 py-1.5 border-b border-[#1e293b] text-[#e2e8f0] font-semibold">{RETAILER_LABELS[v.store] || v.store}</td>
              <td className="px-3 py-1.5 border-b border-[#1e293b] text-[#e2e8f0] text-center">{v.score}</td>
              <td className="px-3 py-1.5 border-b border-[#1e293b] text-center">
                <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold" style={{
                  background: catColor + '22', color: catColor
                }}>{v.cat}</span>
              </td>
              <td className="px-3 py-1.5 border-b border-[#1e293b] text-[#e2e8f0] text-[12px]">{SEGMENT_LABELS[v.segment] || v.segment}</td>
              <td className="px-3 py-1.5 border-b border-[#1e293b] text-[#e2e8f0] text-[12px] max-w-[400px]">{v.text}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
