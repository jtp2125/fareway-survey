'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import ProgressBar from '@/components/survey/ProgressBar';
import QuestionWrapper from '@/components/survey/QuestionWrapper';
import SingleSelect from '@/components/survey/SingleSelect';

const OPTIONS = [
  { value: 1, label: 'Yes' },
  { value: 0, label: 'No' },
];

export default function S5Page() {
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
      await fetch('/api/survey/submit-block', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          respondent_id: rid,
          block: 's5',
          current_block: value === 1 ? 'block1_s5a' : 'block1_s6',
          data: { switched_out_any: value },
        }),
      });

      router.push(value === 1 ? '/survey/block1/s5a' : '/survey/block1/s6');
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <ProgressBar progress={0.13} />
      <div className="p-6 sm:p-8">
        <QuestionWrapper
          questionText="In the past 12 months, have you stopped shopping at or significantly reduced your shopping at any grocery store?"
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
