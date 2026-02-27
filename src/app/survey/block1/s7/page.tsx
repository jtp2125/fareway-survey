'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import ProgressBar from '@/components/survey/ProgressBar';
import QuestionWrapper from '@/components/survey/QuestionWrapper';
import SingleSelect from '@/components/survey/SingleSelect';
import { collapseAge } from '@/lib/segment-logic';

const OPTIONS = [
  { value: 1, label: 'Under 18' },
  { value: 2, label: '18 - 24' },
  { value: 3, label: '25 - 34' },
  { value: 4, label: '35 - 44' },
  { value: 5, label: '45 - 54' },
  { value: 6, label: '55 - 64' },
  { value: 7, label: '65 or older' },
  { value: 8, label: 'Prefer not to say' },
];

export default function S7Page() {
  const router = useRouter();
  const [value, setValue] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (value === null) {
      setError('Please select one option.');
      return;
    }

    setLoading(true);
    const rid = sessionStorage.getItem('respondent_id');

    try {
      if (value === 1) {
        // Terminate — under 18
        await fetch('/api/survey/terminate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            respondent_id: rid,
            termination_point: 'S7',
            data: { age_cohort: value },
          }),
        });
        router.push('/survey/terminated?reason=S7');
        return;
      }

      if (value === 8) {
        // Terminate — prefer not to say
        await fetch('/api/survey/terminate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            respondent_id: rid,
            termination_point: 'S7_PNTS',
            data: { age_cohort: value },
          }),
        });
        router.push('/survey/terminated?reason=S7_PNTS');
        return;
      }

      const age_cohort_collapsed = collapseAge(value);

      await fetch('/api/survey/submit-block', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          respondent_id: rid,
          block: 's7',
          current_block: 'block1_s8',
          data: {
            age_cohort: value,
            age_cohort_collapsed,
          },
        }),
      });

      router.push('/survey/block1/s8');
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <ProgressBar progress={0.17} />
      <div className="p-6 sm:p-8">
        <QuestionWrapper
          questionText="Which age group do you fall into?"
          error={error}
        >
          <SingleSelect
            options={OPTIONS}
            value={value}
            onChange={(v) => {
              setValue(v as number);
              if (error) setError('');
            }}
          />
        </QuestionWrapper>

        <button
          onClick={handleSubmit}
          disabled={loading || value === null}
          className="btn-primary"
        >
          {loading ? 'Saving...' : 'Continue'}
        </button>
      </div>
    </>
  );
}
