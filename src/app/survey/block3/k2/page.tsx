'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ProgressBar from '@/components/survey/ProgressBar';
import QuestionWrapper from '@/components/survey/QuestionWrapper';
import MatrixQuestion from '@/components/survey/MatrixQuestion';
import { KPC_ATTRIBUTES, PERFORMANCE_SCALE, getRetailerDisplay } from '@/lib/constants';

interface RetailerStep {
  key: string;
  code: string;
  name: string;
}

export default function K2Page() {
  const router = useRouter();
  const [retailers, setRetailers] = useState<RetailerStep[]>([]);
  const [currentRetailerIdx, setCurrentRetailerIdx] = useState(0);
  const [allValues, setAllValues] = useState<Record<string, Record<string, number | null>>>({});
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [attributeOrder, setAttributeOrder] = useState<string[]>([]);

  useEffect(() => {
    const r1 = sessionStorage.getItem('r1');
    const r2 = sessionStorage.getItem('r2');
    const r3 = sessionStorage.getItem('r3');

    const list: RetailerStep[] = [];
    if (r1) list.push({ key: 'r1', code: r1, name: getRetailerDisplay(r1) });
    if (r2) list.push({ key: 'r2', code: r2, name: getRetailerDisplay(r2) });
    if (r3) list.push({ key: 'r3', code: r3, name: getRetailerDisplay(r3) });
    setRetailers(list);

    // Use same attribute order as K1
    const orderStr = sessionStorage.getItem('k1_order');
    if (orderStr) {
      setAttributeOrder(JSON.parse(orderStr));
    } else {
      setAttributeOrder(KPC_ATTRIBUTES.map((a) => a.code));
    }
  }, []);

  const currentRetailer = retailers[currentRetailerIdx];
  const currentValues = currentRetailer ? (allValues[currentRetailer.key] || {}) : {};

  const rows = attributeOrder.map((code) => {
    const attr = KPC_ATTRIBUTES.find((a) => a.code === code);
    return { code, label: attr?.label || code };
  });

  const columns = PERFORMANCE_SCALE.map((s) => ({
    value: s.value,
    label: s.label,
    shortLabel: String(s.value),
  }));

  const handleNext = async () => {
    if (!currentRetailer) return;

    // Validate all attributes answered
    const unanswered = rows.filter((r) => currentValues[r.code] == null);
    if (unanswered.length > 0) {
      setError(`Please rate all attributes. ${unanswered.length} remaining.`);
      return;
    }
    setError('');

    // If more retailers, advance
    if (currentRetailerIdx < retailers.length - 1) {
      setCurrentRetailerIdx(currentRetailerIdx + 1);
      return;
    }

    // All done — save
    setLoading(true);
    const rid = sessionStorage.getItem('respondent_id');

    try {
      const data: Record<string, unknown> = {};
      retailers.forEach((r, i) => {
        const num = i + 1;
        const vals = allValues[r.key] || {};
        KPC_ATTRIBUTES.forEach((a) => {
          data[`k2_perf_r${num}_${a.code}`] = vals[a.code] ?? null;
        });
      });

      await fetch('/api/survey/submit-block', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          respondent_id: rid,
          block: 'block3_k2',
          current_block: 'block4',
          data,
        }),
      });

      router.push('/survey/block4');
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!currentRetailer || rows.length === 0) {
    return (
      <>
        <ProgressBar progress={0.40} />
        <div className="p-6 sm:p-8 text-center text-gray-500">Loading...</div>
      </>
    );
  }

  return (
    <>
      <ProgressBar progress={0.40 + (currentRetailerIdx / retailers.length) * 0.10} />
      <div className="p-6 sm:p-8">
        <p className="text-xs text-gray-400 mb-4">
          Store {currentRetailerIdx + 1} of {retailers.length}: {currentRetailer.name}
        </p>

        <QuestionWrapper
          questionText={`How would you rate ${currentRetailer.name} on each of the following?`}
          subText="Rate from 1 (Very poor) to 5 (Excellent)."
          error={error}
        >
          <MatrixQuestion
            rows={rows}
            columns={columns}
            values={currentValues}
            onChange={(v) => {
              setAllValues({ ...allValues, [currentRetailer.key]: v });
              if (error) setError('');
            }}
            mobileGroupSize={5}
          />
        </QuestionWrapper>

        <button
          onClick={handleNext}
          disabled={loading}
          className="btn-primary"
        >
          {loading ? 'Saving...' : currentRetailerIdx < retailers.length - 1 ? 'Next Store' : 'Continue'}
        </button>
      </div>
    </>
  );
}
