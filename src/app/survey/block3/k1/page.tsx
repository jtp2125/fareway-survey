'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import ProgressBar from '@/components/survey/ProgressBar';
import QuestionWrapper from '@/components/survey/QuestionWrapper';
import SignpostScreen from '@/components/survey/SignpostScreen';
import MatrixQuestion from '@/components/survey/MatrixQuestion';
import { KPC_ATTRIBUTES, IMPORTANCE_SCALE, SIGNPOST_TEXTS } from '@/lib/constants';
import { shuffle } from '@/lib/randomize';

export default function K1Page() {
  const router = useRouter();
  const [showSignpost, setShowSignpost] = useState(true);
  const [values, setValues] = useState<Record<string, number | null>>({});
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Randomize attribute order and store for K2
  const rows = useMemo(() => {
    const shuffled = shuffle(
      KPC_ATTRIBUTES.map((a) => ({
        code: a.code,
        label: a.label,
      }))
    );
    // Store randomized order in sessionStorage for K2 to reuse
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('k1_order', JSON.stringify(shuffled.map((r) => r.code)));
    }
    return shuffled;
  }, []);

  const columns = IMPORTANCE_SCALE.map((s) => ({
    value: s.value,
    label: s.label,
    shortLabel: String(s.value),
  }));

  const handleSubmit = async () => {
    const unanswered = rows.filter((r) => values[r.code] == null);
    if (unanswered.length > 0) {
      setError(`Please rate all attributes. ${unanswered.length} remaining.`);
      return;
    }

    setLoading(true);
    const rid = sessionStorage.getItem('respondent_id');

    try {
      const data: Record<string, unknown> = {};
      KPC_ATTRIBUTES.forEach((a) => {
        data[`k1_imp_${a.code}`] = values[a.code];
      });

      await fetch('/api/survey/submit-block', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          respondent_id: rid,
          block: 'block3_k1',
          current_block: 'block3_k2',
          data,
        }),
      });

      router.push('/survey/block3/k2');
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (showSignpost) {
    return (
      <>
        <ProgressBar progress={0.35} />
        <SignpostScreen
          text={SIGNPOST_TEXTS.before_block3}
          onContinue={() => setShowSignpost(false)}
        />
      </>
    );
  }

  return (
    <>
      <ProgressBar progress={0.35} />
      <div className="p-6 sm:p-8">
        <QuestionWrapper
          questionText="How important is each of the following when choosing where to shop for groceries?"
          subText="Rate each attribute from 1 (Not at all important) to 5 (Extremely important)."
          error={error}
        >
          <MatrixQuestion
            rows={rows}
            columns={columns}
            values={values}
            onChange={(v) => {
              setValues(v);
              if (error) setError('');
            }}
            mobileGroupSize={5}
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
