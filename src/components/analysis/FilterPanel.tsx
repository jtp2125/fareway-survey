'use client';

import { useState, useMemo } from 'react';
import {
  SEGMENT_LABELS, INCOME_LABELS, AGE_LABELS, HH_LABELS,
  DEVICE_LABELS, RETAILER_LABELS,
} from './constants/labels';
import { FILTERABLE_QUESTIONS, FILTER_BLOCKS } from './constants/filterable-questions';
import QuestionFilterCard from './QuestionFilterCard';
import type { Respondent, QuestionFilter } from './types';

interface Props {
  filters: Record<string, string[]>;
  setFilters: React.Dispatch<React.SetStateAction<Record<string, string[]>>>;
  questionFilters: QuestionFilter[];
  setQuestionFilters: React.Dispatch<React.SetStateAction<QuestionFilter[]>>;
  allData: Respondent[];
}

export default function FilterPanel({ filters, setFilters, questionFilters, setQuestionFilters, allData }: Props) {
  const [showQPicker, setShowQPicker] = useState(false);
  const [qSearch, setQSearch] = useState('');

  const dmas = useMemo(() => Array.from(new Set(allData.map(r => r.dma).filter(Boolean))).sort(), [allData]);
  const primaryStores = useMemo(() => Array.from(new Set(allData.map(r => r.primary_store).filter(Boolean))).sort(), [allData]);

  const filterDefs = [
    { key: 'completion_status', label: 'Completion Status', options: [{ v: 'complete', l: 'Complete' }, { v: 'terminated', l: 'Terminated' }] },
    { key: 'segment', label: 'Segment', options: Object.entries(SEGMENT_LABELS).map(([v, l]) => ({ v, l })) },
    { key: 'dma', label: 'DMA / Market', options: dmas.map(d => ({ v: String(d), l: String(d) })) },
    { key: 'primary_store', label: 'Primary Store', options: primaryStores.map(s => ({ v: String(s), l: RETAILER_LABELS[String(s)] || String(s) })) },
    { key: 'income_band_collapsed', label: 'Income', options: Object.entries(INCOME_LABELS).map(([v, l]) => ({ v, l })) },
    { key: 'age_cohort_collapsed', label: 'Age Cohort', options: Object.entries(AGE_LABELS).map(([v, l]) => ({ v, l })) },
    { key: 'household_type_collapsed', label: 'Household', options: Object.entries(HH_LABELS).map(([v, l]) => ({ v, l })) },
    { key: 'device_type', label: 'Device', options: Object.entries(DEVICE_LABELS).map(([v, l]) => ({ v, l })) },
    { key: 'phase', label: 'Phase', options: [{ v: '1', l: 'Phase 1' }, { v: '2', l: 'Phase 2' }] },
  ];

  const toggleFilter = (key: string, val: string) => {
    setFilters(prev => {
      const current = prev[key] || [];
      const next = current.includes(val) ? current.filter(v => v !== val) : [...current, val];
      return { ...prev, [key]: next };
    });
  };

  const clearAll = () => { setFilters({}); setQuestionFilters([]); };

  const demoActiveCount = Object.values(filters).reduce((sum, arr) => sum + arr.length, 0);
  const qfActiveCount = questionFilters.filter(qf => {
    const cfg = FILTERABLE_QUESTIONS.find(f => f.id === qf.id);
    if (!cfg) return false;
    if (cfg.filterType === 'binary') return qf.binaryVal !== null && qf.binaryVal !== undefined;
    if (cfg.filterType === 'numeric') return qf.numVal !== '' && qf.numVal !== undefined;
    return (qf.values || []).length > 0;
  }).length;
  const totalActive = demoActiveCount + qfActiveCount;

  const existingIds = new Set(questionFilters.map(q => q.id));
  const availableQuestions = FILTERABLE_QUESTIONS.filter(q => !existingIds.has(q.id));
  const filteredAvailable = qSearch
    ? availableQuestions.filter(q => q.label.toLowerCase().includes(qSearch.toLowerCase()) || q.block.toLowerCase().includes(qSearch.toLowerCase()))
    : availableQuestions;

  const addQuestionFilter = (qDef: typeof FILTERABLE_QUESTIONS[number]) => {
    setQuestionFilters(prev => [...prev, { id: qDef.id, values: [], operator: 'gte', numVal: '', numVal2: '', binaryVal: null }]);
    setShowQPicker(false);
    setQSearch('');
  };

  const updateQF = (idx: number, updated: QuestionFilter) => {
    setQuestionFilters(prev => prev.map((q, i) => i === idx ? updated : q));
  };

  const removeQF = (idx: number) => {
    setQuestionFilters(prev => prev.filter((_, i) => i !== idx));
  };

  return (
    <div className="w-[280px] min-w-[280px] bg-[#0f1219] border-r border-[#1e293b] overflow-y-auto h-full flex flex-col">
      {/* Header */}
      <div className="px-3.5 pt-3.5 pb-2.5 border-b border-[#1e293b] flex justify-between items-center sticky top-0 bg-[#0f1219] z-10">
        <div>
          <div className="text-[13px] font-bold text-[#e2e8f0] tracking-wide uppercase">Filters</div>
          {totalActive > 0 && (
            <div className="text-[11px] text-[#f59e0b] mt-0.5">{totalActive} active</div>
          )}
        </div>
        {totalActive > 0 && (
          <button onClick={clearAll} className="bg-transparent border border-[#334155] rounded text-[#94a3b8] text-[11px] py-[3px] px-2 cursor-pointer hover:text-[#e2e8f0]">
            Clear All
          </button>
        )}
      </div>

      <div className="px-2.5 py-2 flex-1 overflow-y-auto">
        {/* Quick Filters */}
        <div className="text-[10px] font-bold text-[#475569] uppercase tracking-wide mb-2">
          Quick Filters
        </div>
        {filterDefs.map(fd => {
          const active = filters[fd.key] || [];
          return (
            <div key={fd.key} className="mb-3">
              <div className="text-[11px] font-semibold text-[#64748b] uppercase tracking-wide mb-1">
                {fd.label}
                {active.length > 0 && <span className="text-[#f59e0b] ml-1">({active.length})</span>}
              </div>
              <div className="flex flex-wrap gap-[3px]">
                {fd.options.map(opt => {
                  const isActive = active.includes(opt.v);
                  return (
                    <button key={opt.v} onClick={() => toggleFilter(fd.key, opt.v)}
                      className="px-[7px] py-[2px] rounded-[3px] text-[10px] cursor-pointer transition-colors"
                      style={{
                        border: isActive ? '1px solid #6366f1' : '1px solid #1e293b',
                        background: isActive ? '#6366f122' : '#1a1f2e',
                        color: isActive ? '#a5b4fc' : '#94a3b8',
                        fontWeight: isActive ? 600 : 400,
                      }}
                    >{opt.l}</button>
                  );
                })}
              </div>
            </div>
          );
        })}

        {/* Divider */}
        <div className="border-t border-[#334155] mt-4 mb-3 relative">
          <span className="absolute -top-2 left-0 bg-[#0f1219] pr-2 text-[10px] font-bold text-[#475569] uppercase tracking-wide">
            Question Filters
          </span>
        </div>

        {/* Active question filters */}
        {questionFilters.map((qf, idx) => {
          const cfg = FILTERABLE_QUESTIONS.find(f => f.id === qf.id);
          if (!cfg) return null;
          return (
            <QuestionFilterCard key={qf.id} qFilter={qf} config={cfg} allData={allData}
              onChange={(updated) => updateQF(idx, updated)}
              onRemove={() => removeQF(idx)}
            />
          );
        })}

        {/* Add question filter button / picker */}
        {!showQPicker ? (
          <button onClick={() => setShowQPicker(true)} className="w-full py-2 rounded-md text-[11px] border border-dashed border-[#334155] bg-transparent text-[#64748b] cursor-pointer mt-1 flex items-center justify-center gap-1 hover:text-[#94a3b8] hover:border-[#475569]">
            <span className="text-[14px]">+</span> Add Question Filter
          </button>
        ) : (
          <div className="bg-[#131720] border border-[#334155] rounded-md mt-1 overflow-hidden">
            <div className="p-1.5">
              <input
                type="text" placeholder="Search questions\u2026" value={qSearch}
                onChange={e => setQSearch(e.target.value)}
                autoFocus
                className="w-full bg-[#0f1219] border border-[#334155] rounded text-[#e2e8f0] text-[11px] py-1.5 px-2 outline-none box-border"
              />
            </div>
            <div className="max-h-[250px] overflow-y-auto">
              {FILTER_BLOCKS.map(block => {
                const qs = filteredAvailable.filter(q => q.block === block);
                if (qs.length === 0) return null;
                return (
                  <div key={block}>
                    <div className="text-[9px] font-bold text-[#475569] uppercase py-1 px-2 bg-[#0a0d14] tracking-wide sticky top-0">{block}</div>
                    {qs.map(q => (
                      <button key={q.id} onClick={() => addQuestionFilter(q)}
                        className="w-full py-[5px] px-2 bg-transparent border-none border-b border-[#1e293b] text-[#cbd5e1] text-[11px] cursor-pointer text-left flex items-center gap-1.5 hover:bg-[#1a1f2e]"
                      >
                        <span className="text-[8px] py-[1px] px-1 rounded-sm font-semibold" style={{
                          background: q.filterType === 'numeric' ? '#6366f133' : q.filterType === 'binary' ? '#f59e0b33' : '#22c55e33',
                          color: q.filterType === 'numeric' ? '#a5b4fc' : q.filterType === 'binary' ? '#fbbf24' : '#86efac',
                        }}>
                          {q.filterType === 'numeric' ? '#' : q.filterType === 'binary' ? 'Y/N' : '\u25C9'}
                        </span>
                        {q.label}
                      </button>
                    ))}
                  </div>
                );
              })}
            </div>
            <button onClick={() => { setShowQPicker(false); setQSearch(''); }}
              className="w-full py-1.5 bg-[#0a0d14] border-none border-t border-[#334155] text-[#64748b] text-[11px] cursor-pointer hover:text-[#94a3b8]">
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
