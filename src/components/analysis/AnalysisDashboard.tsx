'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { buildBlocks } from './constants/blocks';
import { FILTERABLE_QUESTIONS } from './constants/filterable-questions';
import FilterPanel from './FilterPanel';
import BlockTabs from './BlockTabs';
import QuestionAccordion from './QuestionAccordion';
import type { Respondent, QuestionFilter } from './types';

export default function AnalysisDashboard() {
  const [allData, setAllData] = useState<Respondent[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeBlock, setActiveBlock] = useState('overview');
  const [expandedQ, setExpandedQ] = useState<Record<string, boolean>>({});
  const [filters, setFilters] = useState<Record<string, string[]>>({});
  const [questionFilters, setQuestionFilters] = useState<QuestionFilter[]>([]);
  const [error, setError] = useState<string | null>(null);

  const blocks = useMemo(() => buildBlocks(), []);

  // Load data from API
  useEffect(() => {
    const loadData = async () => {
      try {
        const resp = await fetch('/api/admin/analysis');
        if (resp.status === 401) {
          window.location.href = '/admin/login';
          return;
        }
        if (!resp.ok) throw new Error('Failed to load data');
        const { respondents } = await resp.json();
        setAllData(respondents || []);
      } catch (e) {
        setError('Could not load survey data. Please try again.');
      }
      setLoading(false);
    };
    loadData();
  }, []);

  // Apply all filters
  const filteredData = useMemo(() => {
    return allData.filter(row => {
      // Quick filters
      const passDemo = Object.entries(filters).every(([key, vals]) => {
        if (!vals || vals.length === 0) return true;
        return vals.includes(String(row[key]));
      });
      if (!passDemo) return false;

      // Question filters
      return questionFilters.every(qf => {
        const cfg = FILTERABLE_QUESTIONS.find(f => f.id === qf.id);
        if (!cfg) return true;

        if (cfg.filterType === 'categorical' || cfg.filterType === 'categorical_dynamic') {
          if (!qf.values || qf.values.length === 0) return true;
          return qf.values.includes(String(row[cfg.field]));
        }

        if (cfg.filterType === 'numeric') {
          if (qf.numVal === '' || qf.numVal === undefined) return true;
          const rowVal = Number(row[cfg.field]);
          if (isNaN(rowVal)) return false;
          const target = Number(qf.numVal);
          const op = qf.operator || 'gte';
          if (op === 'gte') return rowVal >= target;
          if (op === 'lte') return rowVal <= target;
          if (op === 'eq') return rowVal === target;
          if (op === 'between') {
            const target2 = Number(qf.numVal2);
            if (isNaN(target2)) return rowVal >= target;
            return rowVal >= target && rowVal <= target2;
          }
          return true;
        }

        if (cfg.filterType === 'binary') {
          if (qf.binaryVal === null || qf.binaryVal === undefined) return true;
          return String(row[cfg.field]) === qf.binaryVal;
        }

        return true;
      });
    });
  }, [allData, filters, questionFilters]);

  // Auto-expand first question when switching blocks
  useEffect(() => {
    const block = blocks.find(b => b.id === activeBlock);
    if (block && block.questions.length > 0) {
      const next: Record<string, boolean> = {};
      block.questions.forEach((q, i) => {
        next[q.id] = i === 0;
      });
      setExpandedQ(next);
    }
  }, [activeBlock, blocks]);

  const toggleQ = (qId: string) => setExpandedQ(prev => ({ ...prev, [qId]: !prev[qId] }));

  const isFiltered = Object.values(filters).some(v => v.length > 0) || questionFilters.length > 0;

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#0a0d14] text-[#e2e8f0]" style={{ fontFamily: "'IBM Plex Sans', system-ui, sans-serif" }}>
        <div className="text-center">
          <div className="text-[32px] mb-3 animate-spin">{'\u25CE'}</div>
          <div className="text-[14px] text-[#64748b]">Loading survey data&hellip;</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#0a0d14] text-[#ef4444]" style={{ fontFamily: "'IBM Plex Sans', system-ui, sans-serif" }}>
        {error}
      </div>
    );
  }

  const currentBlock = blocks.find(b => b.id === activeBlock);

  return (
    <div className="h-screen flex flex-col bg-[#0a0d14] text-[#e2e8f0] overflow-hidden" style={{ fontFamily: "'IBM Plex Sans', system-ui, sans-serif" }}>
      {/* Google Font */}
      {/* eslint-disable-next-line @next/next/no-page-custom-font */}
      <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@300;400;500;600;700&display=swap" rel="stylesheet" />

      {/* Header */}
      <div className="border-b border-[#1e293b] py-3 px-5 flex items-center justify-between bg-[#0f1219] shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-md flex items-center justify-center text-[16px] font-bold" style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>F</div>
          <div>
            <div className="text-[15px] font-bold text-[#e2e8f0] -tracking-wide">Fareway Customer Survey</div>
            <div className="text-[11px] text-[#64748b]">Analysis Dashboard &middot; v1.0</div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-[12px] text-[#64748b]">
            <span className="text-[#22c55e] font-semibold">{filteredData.length}</span> / {allData.length} respondents
            {isFiltered && <span className="text-[#f59e0b] ml-1.5">(filtered)</span>}
          </div>
          <Link href="/admin/dashboard" className="text-[12px] text-[#64748b] hover:text-[#e2e8f0] transition-colors">Dashboard</Link>
          <div className="text-[11px] text-[#475569]">CONFIDENTIAL</div>
        </div>
      </div>

      {/* Block Tabs */}
      <BlockTabs blocks={blocks} activeBlock={activeBlock} setActiveBlock={setActiveBlock} />

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Filter Panel */}
        <FilterPanel
          filters={filters} setFilters={setFilters}
          questionFilters={questionFilters} setQuestionFilters={setQuestionFilters}
          allData={allData}
        />

        {/* Questions Area */}
        <div className="flex-1 overflow-y-auto py-5 px-6">
          {currentBlock && currentBlock.questions.map(q => (
            <QuestionAccordion
              key={q.id}
              question={q}
              isOpen={!!expandedQ[q.id]}
              onToggle={() => toggleQ(q.id)}
              data={filteredData}
              allData={allData}
              isFiltered={isFiltered}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
