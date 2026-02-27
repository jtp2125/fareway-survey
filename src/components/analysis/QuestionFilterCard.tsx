'use client';

import type { FilterableDef } from './constants/filterable-questions';
import type { Respondent, QuestionFilter } from './types';

interface Props {
  qFilter: QuestionFilter;
  config: FilterableDef;
  onChange: (updated: QuestionFilter) => void;
  onRemove: () => void;
  allData: Respondent[];
}

export default function QuestionFilterCard({ qFilter, config, onChange, onRemove, allData }: Props) {
  if (config.filterType === 'categorical' || config.filterType === 'categorical_dynamic') {
    let options = config.options || [];
    if (config.filterType === 'categorical_dynamic') {
      const unique = Array.from(new Set(allData.map(r => r[config.field]).filter(Boolean))).sort();
      options = unique.map(v => ({ v: String(v), l: (config.labelMap && config.labelMap[String(v)]) || String(v) }));
    }
    return (
      <div className="bg-[#1a1f2e] border border-[#334155] rounded-md p-2 mb-1.5">
        <div className="flex justify-between items-center mb-1.5">
          <div className="text-[11px] font-semibold text-[#e2e8f0] leading-tight">{config.label}</div>
          <button onClick={onRemove} className="bg-transparent border-none text-[#64748b] cursor-pointer text-[12px] px-0.5 leading-none hover:text-[#e2e8f0]">&times;</button>
        </div>
        <div className="flex flex-wrap gap-[3px]">
          {options.map(opt => {
            const active = (qFilter.values || []).includes(opt.v);
            return (
              <button key={opt.v}
                onClick={() => {
                  const curr = qFilter.values || [];
                  const next = active ? curr.filter(x => x !== opt.v) : [...curr, opt.v];
                  onChange({ ...qFilter, values: next });
                }}
                className="px-[7px] py-[2px] rounded-[3px] text-[10px] cursor-pointer transition-colors"
                style={{
                  border: active ? '1px solid #f59e0b' : '1px solid #1e293b',
                  background: active ? '#f59e0b22' : '#1a1f2e',
                  color: active ? '#fbbf24' : '#94a3b8',
                  fontWeight: active ? 600 : 400,
                }}
              >{opt.l}</button>
            );
          })}
        </div>
      </div>
    );
  }

  if (config.filterType === 'numeric') {
    const op = qFilter.operator || 'gte';
    return (
      <div className="bg-[#1a1f2e] border border-[#334155] rounded-md p-2 mb-1.5">
        <div className="flex justify-between items-center mb-1.5">
          <div className="text-[11px] font-semibold text-[#e2e8f0] leading-tight">{config.label}</div>
          <button onClick={onRemove} className="bg-transparent border-none text-[#64748b] cursor-pointer text-[12px] px-0.5 leading-none hover:text-[#e2e8f0]">&times;</button>
        </div>
        <div className="flex gap-1 items-center">
          <select value={op} onChange={e => onChange({ ...qFilter, operator: e.target.value })}
            className="bg-[#0f1219] border border-[#334155] rounded-[3px] text-[#e2e8f0] text-[11px] py-[3px] px-1 outline-none">
            <option value="gte">&ge;</option>
            <option value="lte">&le;</option>
            <option value="eq">=</option>
            <option value="between">Between</option>
          </select>
          <input type="number" value={qFilter.numVal || ''} placeholder={config.min !== undefined ? String(config.min) : '0'}
            onChange={e => onChange({ ...qFilter, numVal: e.target.value })}
            className="bg-[#0f1219] border border-[#334155] rounded-[3px] text-[#e2e8f0] text-[11px] py-[3px] px-1.5 w-[60px] outline-none" />
          {op === 'between' && (
            <>
              <span className="text-[#64748b] text-[11px]">and</span>
              <input type="number" value={qFilter.numVal2 || ''} placeholder={config.max !== undefined ? String(config.max) : ''}
                onChange={e => onChange({ ...qFilter, numVal2: e.target.value })}
                className="bg-[#0f1219] border border-[#334155] rounded-[3px] text-[#e2e8f0] text-[11px] py-[3px] px-1.5 w-[60px] outline-none" />
            </>
          )}
        </div>
        {config.min !== undefined && (
          <div className="text-[9px] text-[#475569] mt-0.5">Range: {config.min}&ndash;{config.max}</div>
        )}
      </div>
    );
  }

  if (config.filterType === 'binary') {
    const val = qFilter.binaryVal;
    return (
      <div className="bg-[#1a1f2e] border border-[#334155] rounded-md p-2 mb-1.5">
        <div className="flex justify-between items-center mb-1.5">
          <div className="text-[11px] font-semibold text-[#e2e8f0] leading-tight">{config.label}</div>
          <button onClick={onRemove} className="bg-transparent border-none text-[#64748b] cursor-pointer text-[12px] px-0.5 leading-none hover:text-[#e2e8f0]">&times;</button>
        </div>
        <div className="flex gap-1">
          {[{ v: '1', l: 'Yes / Selected' }, { v: '0', l: 'No / Not Selected' }].map(opt => (
            <button key={opt.v}
              onClick={() => onChange({ ...qFilter, binaryVal: val === opt.v ? null : opt.v })}
              className="px-2 py-[3px] rounded-[3px] text-[10px] cursor-pointer transition-colors"
              style={{
                border: val === opt.v ? '1px solid #f59e0b' : '1px solid #1e293b',
                background: val === opt.v ? '#f59e0b22' : '#1a1f2e',
                color: val === opt.v ? '#fbbf24' : '#94a3b8',
                fontWeight: val === opt.v ? 600 : 400,
              }}
            >{opt.l}</button>
          ))}
        </div>
      </div>
    );
  }

  return null;
}
