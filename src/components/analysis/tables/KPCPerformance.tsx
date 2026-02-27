'use client';

import { useMemo } from 'react';
import { KPC_ATTRIBUTES, RETAILER_LABELS } from '../constants/labels';
import type { Respondent } from '../types';

export default function KPCPerformance({ data }: { data: Respondent[] }) {
  const perfData = useMemo(() => {
    const stores: Record<string, Record<string, number[]>> = {};
    data.forEach(r => {
      [1, 2, 3].forEach(i => {
        const store = r[`nps_r${i}_store`];
        if (!store) return;
        if (!stores[store]) stores[store] = {};
        KPC_ATTRIBUTES.forEach(attr => {
          const v = Number(r[`k2_perf_r${i}_${attr.key}`]);
          if (!isNaN(v) && v >= 1 && v <= 5) {
            if (!stores[store][attr.key]) stores[store][attr.key] = [];
            stores[store][attr.key].push(v);
          }
        });
      });
    });
    return Object.entries(stores).map(([store, attrs]) => {
      const row: Record<string, unknown> = { store };
      KPC_ATTRIBUTES.forEach(attr => {
        const vals = attrs[attr.key] || [];
        row[attr.key] = vals.length ? (vals.reduce((a, b) => a + b, 0) / vals.length) : null;
      });
      row.n = Math.max(...KPC_ATTRIBUTES.map(a => (attrs[a.key] || []).length), 0);
      return row;
    }).sort((a, b) => (b.n as number) - (a.n as number)).slice(0, 10);
  }, [data]);

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-[13px]">
        <thead>
          <tr>
            <th className="px-3 py-2 text-left border-b-2 border-[#334155] text-[#94a3b8] text-[11px] font-semibold uppercase sticky left-0 bg-[#1a1f2e] z-[2]">Retailer</th>
            <th className="px-3 py-2 text-right border-b-2 border-[#334155] text-[#94a3b8] text-[11px] font-semibold uppercase">n</th>
            {KPC_ATTRIBUTES.map(a => (
              <th key={a.key} className="px-1 py-2 text-center border-b-2 border-[#334155] text-[#94a3b8] text-[10px] font-semibold min-w-[65px] h-[100px]" style={{ writingMode: 'vertical-rl' }}>
                {a.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {perfData.map(row => (
            <tr key={row.store as string} className="transition-colors">
              <td className="px-3 py-1.5 border-b border-[#1e293b] text-[#e2e8f0] font-semibold sticky left-0 bg-[#0f1219] z-[1]">
                {RETAILER_LABELS[row.store as string] || row.store as string}
              </td>
              <td className="px-3 py-1.5 border-b border-[#1e293b] text-[#e2e8f0] text-right">{row.n as number}</td>
              {KPC_ATTRIBUTES.map(a => {
                const v = row[a.key] as number | null;
                if (v === null) return <td key={a.key} className="px-3 py-1.5 border-b border-[#1e293b] text-center text-[#475569]">&mdash;</td>;
                const intensity = (v - 1) / 4;
                const r = Math.round(239 - intensity * 200);
                const g = Math.round(68 + intensity * 130);
                const b = Math.round(68 + intensity * 30);
                return (
                  <td key={a.key} className="px-1 py-1.5 border-b border-[#1e293b] text-center font-semibold text-[12px]" style={{
                    background: `rgba(${r},${g},${b},0.3)`, color: `rgb(${r},${g},${b})`
                  }}>
                    {v.toFixed(1)}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      <p className="text-[11px] text-[#64748b] mt-2">
        Heat map: Red (1.0) &rarr; Green (5.0). Showing top 10 retailers by sample size.
      </p>
    </div>
  );
}
