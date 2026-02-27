'use client';

import type { QuestionDef } from './constants/blocks';
import type { Respondent } from './types';
import QuestionRenderer from './QuestionRenderer';
import { exportQuestionCSV } from './csvExport';

interface Props {
  question: QuestionDef;
  isOpen: boolean;
  onToggle: () => void;
  data: Respondent[];
  allData: Respondent[];
  isFiltered: boolean;
}

export default function QuestionAccordion({ question, isOpen, onToggle, data, allData, isFiltered }: Props) {
  return (
    <div className="mb-2 rounded-lg bg-[#131720] border border-[#1e293b] overflow-hidden">
      <button onClick={onToggle}
        className="w-full py-3 px-4 bg-transparent border-none flex items-center justify-between cursor-pointer text-[#e2e8f0]"
      >
        <span className="text-[13px] font-semibold">{question.label}</span>
        <span className="text-[18px] text-[#64748b] transition-transform duration-200" style={{
          transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
        }}>{'\u25BE'}</span>
      </button>
      {isOpen && (
        <div className="px-4 pb-4 pt-1 border-t border-[#1e293b]">
          <div className="flex items-center justify-between mb-2">
            <div className="text-[11px] text-[#475569]">
              n = {data.length} respondents {isFiltered ? '(filtered)' : ''}
            </div>
            <button
              onClick={() => exportQuestionCSV(question, data)}
              className="flex items-center gap-1 px-2 py-1 rounded text-[10px] font-medium bg-[#1a1f2e] border border-[#334155] text-[#94a3b8] cursor-pointer hover:text-[#e2e8f0] hover:border-[#475569] transition-colors"
            >
              {'\u2913'} Export CSV
            </button>
          </div>
          <QuestionRenderer question={question} data={data} allData={allData} />
        </div>
      )}
    </div>
  );
}
