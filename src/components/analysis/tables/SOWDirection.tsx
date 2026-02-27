'use client';

import { useMemo } from 'react';
import { RETAILER_LABELS, SOW_DIR_LABELS, pct } from '../constants/labels';
import type { Respondent } from '../types';

interface Props {
  data: Respondent[];
  dirField: string;
}

interface DirRow {
  name: string;
  counts: Record<number, number>;
  total: number;
}

export default function SOWDirection({ data, dirField }: Props) {
  const dirData = useMemo((): DirRow[] => {
    const stores: Record<string, { counts: Record<number, number>; total: number }> = {};
    data.forEach(r => {
      [1, 2, 3].forEach(i => {
        const name = r[`sow_store${i}_name`];
        const dir = Number(r[`sow_${dirField}_store${i}_dir`]);
        if (name && dir >= 1 && dir <= 5) {
          if (!stores[name]) stores[name] = { counts: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }, total: 0 };
          stores[name].counts[dir]++;
          stores[name].total++;
        }
      });
    });
    return Object.entries(stores)
      .map(([name, d]) => ({ name, counts: d.counts, total: d.total }))
      .sort((a, b) => b.total - a.total);
  }, [data, dirField]);

  return (
    <table className="w-full border-collapse text-[13px]">
      <thead>
        <tr>
          <th className="px-3 py-2 text-left border-b-2 border-[#334155] text-[#94a3b8] text-[11px] font-semibold uppercase">Retailer</th>
          <th className="px-3 py-2 text-right border-b-2 border-[#334155] text-[#94a3b8] text-[11px] font-semibold uppercase">n</th>
          {Object.entries(SOW_DIR_LABELS).map(([k, v]) => (
            <th key={k} className="px-3 py-2 text-center border-b-2 border-[#334155] text-[#94a3b8] text-[11px] font-semibold">{v}</th>
          ))}
          <th className="px-3 py-2 text-right border-b-2 border-[#334155] text-[#94a3b8] text-[11px] font-semibold uppercase">Net Direction</th>
        </tr>
      </thead>
      <tbody>
        {dirData.map(row => {
          const net = row.total ? Number((((row.counts[4] + row.counts[5]) - (row.counts[1] + row.counts[2])) / row.total * 100).toFixed(0)) : 0;
          const netColor = net > 0 ? '#22c55e' : net < 0 ? '#ef4444' : '#94a3b8';
          return (
            <tr key={row.name} className="transition-colors">
              <td className="px-3 py-1.5 border-b border-[#1e293b] text-[#e2e8f0] font-semibold">{RETAILER_LABELS[row.name] || row.name}</td>
              <td className="px-3 py-1.5 border-b border-[#1e293b] text-[#e2e8f0] text-right">{row.total}</td>
              {[1, 2, 3, 4, 5].map(level => (
                <td key={level} className="px-3 py-1.5 border-b border-[#1e293b] text-[#e2e8f0] text-center">
                  {row.counts[level]} <span className="text-[#64748b] text-[11px]">({pct(row.counts[level], row.total)}%)</span>
                </td>
              ))}
              <td className="px-3 py-1.5 border-b border-[#1e293b] text-right font-bold" style={{ color: netColor }}>
                {net > 0 ? '+' : ''}{net}pp
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
