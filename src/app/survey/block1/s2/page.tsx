'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import ProgressBar from '@/components/survey/ProgressBar';
import QuestionWrapper from '@/components/survey/QuestionWrapper';
import SingleSelect from '@/components/survey/SingleSelect';

const OPTIONS = [
  { value: 1, label: 'Yes, I am the primary grocery decision-maker' },
  { value: 2, label: 'Yes, I share grocery shopping responsibility with someone else in my household' },
  { value: 3, label: 'No, someone else in my household makes most grocery shopping decisions' },
];

export default function S2Page() {
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
      if (value === 3) {
        // Terminate — not a decision-maker
        await fetch('/api/survey/terminate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            respondent_id: rid,
            termination_point: 'S2',
            data: { grocery_decisionmaker: value },
          }),
        });
        router.push('/survey/terminated?reason=S2');
        return;
      }

      // Save and continue to S3
      await fetch('/api/survey/submit-block', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          respondent_id: rid,
          block: 's2',
          current_block: 'block1_s3',
          data: { grocery_decisionmaker: value },
        }),
      });

      router.push('/survey/block1/s3');
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <ProgressBar progress={0.05} />
      <div className="p-6 sm:p-8">
        <QuestionWrapper
          questionText="Are you the primary grocery shopper for your household, or do you share that responsibility?"
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
