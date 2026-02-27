'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import ProgressBar from '@/components/survey/ProgressBar';
import QuestionWrapper from '@/components/survey/QuestionWrapper';
import SignpostScreen from '@/components/survey/SignpostScreen';
import SingleSelect from '@/components/survey/SingleSelect';
import { SIGNPOST_TEXTS } from '@/lib/constants';
import { collapseIncome } from '@/lib/segment-logic';

const OPTIONS = [
  { value: 1, label: 'Under $25,000' },
  { value: 2, label: '$25,000 - $49,999' },
  { value: 3, label: '$50,000 - $74,999' },
  { value: 4, label: '$75,000 - $99,999' },
  { value: 5, label: '$100,000 - $149,999' },
  { value: 6, label: '$150,000 or more' },
  { value: 7, label: 'Prefer not to say' },
];

export default function S6Page() {
  const router = useRouter();
  const [showSignpost, setShowSignpost] = useState(true);
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
      if (value === 7) {
        // Terminate — prefer not to say
        await fetch('/api/survey/terminate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            respondent_id: rid,
            termination_point: 'S6_PNTS',
            data: { income_band: value },
          }),
        });
        router.push('/survey/terminated?reason=S6_PNTS');
        return;
      }

      const income_band_collapsed = collapseIncome(value);

      await fetch('/api/survey/submit-block', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          respondent_id: rid,
          block: 's6',
          current_block: 'block1_s7',
          data: {
            income_band: value,
            income_band_collapsed,
          },
        }),
      });

      router.push('/survey/block1/s7');
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (showSignpost) {
    return (
      <>
        <ProgressBar progress={0.16} />
        <SignpostScreen
          text={SIGNPOST_TEXTS.before_s6}
          onContinue={() => setShowSignpost(false)}
        />
      </>
    );
  }

  return (
    <>
      <ProgressBar progress={0.16} />
      <div className="p-6 sm:p-8">
        <QuestionWrapper
          questionText="Which of the following best describes your total annual household income before taxes?"
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
