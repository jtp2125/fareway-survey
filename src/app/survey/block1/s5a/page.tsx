'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import ProgressBar from '@/components/survey/ProgressBar';
import QuestionWrapper from '@/components/survey/QuestionWrapper';
import MultiSelect from '@/components/survey/MultiSelect';
import { RETAILERS } from '@/lib/constants';
import { randomizeWithAnchors } from '@/lib/randomize';

export default function S5aPage() {
  const router = useRouter();
  const [values, setValues] = useState<(number | string)[]>([]);
  const [otherText, setOtherText] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const options = useMemo(() => {
    const items = RETAILERS.map((r) => ({
      value: r.code,
      label: r.display,
      anchored: r.code === 'other',
    }));
    return randomizeWithAnchors(items);
  }, []);

  const otherSelected = values.includes('other');

  const handleSubmit = async () => {
    if (values.length === 0) {
      setError('Please select at least one store.');
      return;
    }

    if (otherSelected && otherText.trim().length < 2) {
      setError('Please specify the "Other" store name.');
      return;
    }

    setLoading(true);
    const rid = sessionStorage.getItem('respondent_id');

    try {
      const data: Record<string, unknown> = {};
      RETAILERS.forEach((r) => {
        data[`switched_out_${r.code}`] = values.includes(r.code) ? 1 : 0;
      });
      if (otherText.trim()) {
        data.switched_out_other_text = otherText.trim();
      }

      await fetch('/api/survey/submit-block', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          respondent_id: rid,
          block: 's5a',
          current_block: 'block1_s6',
          data,
        }),
      });

      router.push('/survey/block1/s6');
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <ProgressBar progress={0.14} />
      <div className="p-6 sm:p-8">
        <QuestionWrapper
          questionText="Which store(s) have you stopped shopping at or significantly reduced your shopping at in the past 12 months?"
          subText="Select all that apply."
          error={error}
        >
          <MultiSelect
            options={options}
            values={values}
            onChange={(v) => {
              setValues(v);
              if (error) setError('');
            }}
          />

          {otherSelected && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <label className="text-sm font-medium text-gray-700 mb-1 block">
                Please specify the &quot;Other&quot; store:
              </label>
              <input
                type="text"
                value={otherText}
                onChange={(e) => setOtherText(e.target.value)}
                placeholder="Store name"
                className="w-full p-2.5 border border-gray-300 rounded-lg text-sm
                  focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
          )}
        </QuestionWrapper>

        <button
          onClick={handleSubmit}
          disabled={loading || values.length === 0}
          className="btn-primary"
        >
          {loading ? 'Saving...' : 'Continue'}
        </button>
      </div>
    </>
  );
}
