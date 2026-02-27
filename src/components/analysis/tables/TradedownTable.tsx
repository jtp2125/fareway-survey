'use client';

import { pct } from '../constants/labels';
import type { Respondent } from '../types';

const BEHAVIORS = [
  { field: 'tradedown_storebrand', label: 'Switched to store brand' },
  { field: 'tradedown_organic', label: 'Reduced organic purchases' },
  { field: 'tradedown_premium', label: 'Fewer premium products' },
  { field: 'tradedown_discount_grocer', label: 'Shopped discount grocer more' },
  { field: 'tradedown_coupons', label: 'More coupons / deals' },
  { field: 'tradedown_food_waste', label: 'Reduced food waste / bought less' },
  { field: 'tradedown_none', label: 'None of the above' },
];

export default function TradedownTable({ data }: { data: Respondent[] }) {
  const total = data.filter(r => r.completion_status === 'complete').length;

  const stats = BEHAVIORS.map(b => {
    const yes = data.filter(r => Number(r[b.field]) === 1).length;
    return { ...b, yes, pct: pct(yes, total) };
  }).sort((a, b) => b.yes - a.yes);

  return (
    <table className="w-full border-collapse text-[13px]">
      <thead>
        <tr>
          <th className="px-3 py-2 text-left border-b-2 border-[#334155] text-[#94a3b8] text-[11px] font-semibold uppercase">Behavior</th>
          <th className="px-3 py-2 text-right border-b-2 border-[#334155] text-[#94a3b8] text-[11px] font-semibold uppercase">n</th>
          <th className="px-3 py-2 text-right border-b-2 border-[#334155] text-[#94a3b8] text-[11px] font-semibold uppercase">%</th>
          <th className="px-3 py-2 text-left border-b-2 border-[#334155] text-[#94a3b8] text-[11px] font-semibold uppercase w-[35%]" />
        </tr>
      </thead>
      <tbody>
        {stats.map(s => (
          <tr key={s.field} className="transition-colors">
            <td className="px-3 py-1.5 border-b border-[#1e293b] text-[#e2e8f0]">{s.label}</td>
            <td className="px-3 py-1.5 border-b border-[#1e293b] text-[#e2e8f0] text-right">{s.yes}</td>
            <td className="px-3 py-1.5 border-b border-[#1e293b] text-[#e2e8f0] text-right">{s.pct}%</td>
            <td className="px-3 py-1.5 border-b border-[#1e293b]">
              <div className="h-2 bg-[#1e293b] rounded overflow-hidden">
                <div className="h-full bg-[#f97316] rounded transition-all duration-300" style={{ width: `${s.pct}%` }} />
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
