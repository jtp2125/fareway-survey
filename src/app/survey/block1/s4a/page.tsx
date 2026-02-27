'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import ProgressBar from '@/components/survey/ProgressBar';
import QuestionWrapper from '@/components/survey/QuestionWrapper';
import MatrixQuestion from '@/components/survey/MatrixQuestion';
import { getRetailerDisplay, getRetailerShort } from '@/lib/constants';
import { shuffle } from '@/lib/randomize';

const FREQ_COLUMNS = [
  { value: 1, label: 'Once a week or more', shortLabel: 'Weekly+' },
  { value: 2, label: '2-3 times per month', shortLabel: '2-3x/mo' },
  { value: 3, label: 'About once a month', shortLabel: 'Monthly' },
  { value: 4, label: 'Less than once a month', shortLabel: 'Less' },
];

export default function S4aPage() {
  const router = useRouter();
  const [rows, setRows] = useState<{ code: string; label: string; shortLabel: string }[]>([]);
  const [values, setValues] = useState<Record<string, number | null>>({});
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Build rows from top 3 SOW stores
  const randomizedRows = useMemo(() => {
    if (typeof window === 'undefined') return [];
    const sowStr = sessionStorage.getItem('sow_stores');
    if (!sowStr) return [];
    const sowStores = JSON.parse(sowStr) as { code: string; pct: number }[];
    const top3 = sowStores.slice(0, 3).map((s) => ({
      code: s.code,
      label: getRetailerDisplay(s.code),
      shortLabel: getRetailerShort(s.code),
    }));
    return shuffle(top3);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (randomizedRows.length > 0) {
      setRows(randomizedRows);
    }
  }, [randomizedRows]);

  const handleSubmit = async () => {
    // Validate all rows answered
    const unanswered = rows.filter((r) => values[r.code] == null);
    if (unanswered.length > 0) {
      setError('Please answer for all stores.');
      return;
    }

    setLoading(true);
    const rid = sessionStorage.getItem('respondent_id');
    const sowStr = sessionStorage.getItem('sow_stores');
    const sowStores = sowStr ? JSON.parse(sowStr) as { code: string }[] : [];

    try {
      const data: Record<string, unknown> = {};
      // Map back to store1/2/3 based on SOW order (not randomized display order)
      sowStores.slice(0, 3).forEach((s, i) => {
        data[`freq_store${i + 1}`] = values[s.code];
      });

      await fetch('/api/survey/submit-block', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          respondent_id: rid,
          block: 's4a',
          current_block: 'block1_s5',
          data,
        }),
      });

      router.push('/survey/block1/s5');
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <ProgressBar progress={0.12} />
      <div className="p-6 sm:p-8">
        <QuestionWrapper
          questionText="How often do you typically shop at each of the following stores?"
          error={error}
        >
          <MatrixQuestion
            rows={rows}
            columns={FREQ_COLUMNS}
            values={values}
            onChange={(v) => {
              setValues(v);
              if (error) setError('');
            }}
            mobileGroupSize={3}
          />
        </QuestionWrapper>

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="btn-primary"
        >
          {loading ? 'Saving...' : 'Continue'}
        </button>
      </div>
    </>
  );
}
