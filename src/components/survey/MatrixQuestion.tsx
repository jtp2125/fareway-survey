'use client';

import { useState, useEffect } from 'react';

interface MatrixRow {
  code: string;
  label: string;
  shortLabel?: string;
}

interface MatrixColumn {
  value: number;
  label: string;
  shortLabel?: string;
}

interface MatrixQuestionProps {
  rows: MatrixRow[];
  columns: MatrixColumn[];
  values: Record<string, number | null>;
  onChange: (values: Record<string, number | null>) => void;
  mobileGroupSize?: number;
}

export default function MatrixQuestion({
  rows,
  columns,
  values,
  onChange,
  mobileGroupSize = 4,
}: MatrixQuestionProps) {
  const [isMobile, setIsMobile] = useState(false);
  const [mobileGroup, setMobileGroup] = useState(0);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const handleChange = (rowCode: string, colValue: number) => {
    onChange({ ...values, [rowCode]: colValue });
  };

  // Desktop: full grid
  if (!isMobile) {
    return (
      <div className="overflow-x-auto -mx-2">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr>
              <th className="text-left p-2 min-w-[160px]" />
              {columns.map((col) => (
                <th
                  key={col.value}
                  className="p-2 text-center text-xs font-medium text-gray-500 min-w-[80px]"
                >
                  {col.shortLabel || col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => (
              <tr
                key={row.code}
                className={idx % 2 === 0 ? 'bg-gray-50' : 'bg-white'}
              >
                <td className="p-2 text-sm text-gray-700 font-medium">
                  {row.shortLabel || row.label}
                </td>
                {columns.map((col) => (
                  <td key={col.value} className="p-2 text-center">
                    <button
                      type="button"
                      onClick={() => handleChange(row.code, col.value)}
                      className={`w-8 h-8 rounded-full border-2 transition-all
                        ${values[row.code] === col.value
                          ? 'bg-primary border-primary'
                          : 'border-gray-300 hover:border-primary'
                        }`}
                      aria-label={`${row.label}: ${col.label}`}
                    >
                      {values[row.code] === col.value && (
                        <span className="block w-3 h-3 bg-white rounded-full mx-auto" />
                      )}
                    </button>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  // Mobile: grouped cards
  const totalGroups = Math.ceil(rows.length / mobileGroupSize);
  const groupStart = mobileGroup * mobileGroupSize;
  const groupEnd = Math.min(groupStart + mobileGroupSize, rows.length);
  const currentRows = rows.slice(groupStart, groupEnd);

  return (
    <div>
      {/* Group navigation */}
      {totalGroups > 1 && (
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm text-gray-500">
            {groupStart + 1}–{groupEnd} of {rows.length}
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setMobileGroup(Math.max(0, mobileGroup - 1))}
              disabled={mobileGroup === 0}
              className="px-3 py-1 text-sm rounded border border-gray-300 disabled:opacity-30"
            >
              Prev
            </button>
            <button
              type="button"
              onClick={() => setMobileGroup(Math.min(totalGroups - 1, mobileGroup + 1))}
              disabled={mobileGroup === totalGroups - 1}
              className="px-3 py-1 text-sm rounded border border-gray-300 disabled:opacity-30"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Cards */}
      <div className="flex flex-col gap-4">
        {currentRows.map((row) => (
          <div key={row.code} className="border border-gray-200 rounded-lg p-4">
            <p className="text-sm font-medium text-gray-700 mb-3">
              {row.label}
            </p>
            <div className="flex flex-wrap gap-2">
              {columns.map((col) => (
                <button
                  key={col.value}
                  type="button"
                  onClick={() => handleChange(row.code, col.value)}
                  className={`flex-1 min-w-[60px] py-2 px-1 rounded-lg text-xs font-medium
                    transition-all border-2 text-center leading-tight
                    ${values[row.code] === col.value
                      ? 'bg-primary text-white border-primary'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-primary'
                    }`}
                >
                  {col.shortLabel || col.label}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Mobile group navigation at bottom too */}
      {totalGroups > 1 && (
        <div className="flex justify-center gap-1 mt-4">
          {Array.from({ length: totalGroups }, (_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setMobileGroup(i)}
              className={`w-2.5 h-2.5 rounded-full transition-all
                ${i === mobileGroup ? 'bg-primary' : 'bg-gray-300'}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
