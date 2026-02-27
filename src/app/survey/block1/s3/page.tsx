'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import ProgressBar from '@/components/survey/ProgressBar';
import QuestionWrapper from '@/components/survey/QuestionWrapper';
import SignpostScreen from '@/components/survey/SignpostScreen';
import MatrixQuestion from '@/components/survey/MatrixQuestion';
import { RETAILERS, FUNNEL_LABELS, SIGNPOST_TEXTS } from '@/lib/constants';
import { randomizeWithAnchors } from '@/lib/randomize';

export default function S3Page() {
  const router = useRouter();
  const [showSignpost, setShowSignpost] = useState(true);
  const [values, setValues] = useState<Record<string, number | null>>({});
  const [otherText, setOtherText] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Randomize retailer rows once, "Other" anchored last
  const rows = useMemo(() => {
    const items = RETAILERS.map((r) => ({
      code: r.code,
      label: r.display,
      shortLabel: r.shortDisplay,
      anchored: r.code === 'other',
    }));
    return randomizeWithAnchors(items);
  }, []);

  const columns = FUNNEL_LABELS.map((f) => ({
    value: f.value,
    label: f.label,
    shortLabel: f.shortLabel,
  }));

  // Check if "Other" has any funnel selection
  const otherSelected = values['other'] != null && values['other'] > 0;

  const handleSubmit = async () => {
    // Validate: all 15 retailers must be answered
    const unanswered = RETAILERS.filter((r) => values[r.code] == null);
    if (unanswered.length > 0) {
      setError(`Please answer for all stores. ${unanswered.length} remaining.`);
      return;
    }

    // Validate: "Other" text required if any funnel level selected for Other
    if (otherSelected && otherText.trim().length < 2) {
      setError('Please specify the "Other" store name.');
      return;
    }

    // Termination check: need at least one retailer with funnel >= 5
    const hasRecentShopper = RETAILERS.some(
      (r) => (values[r.code] ?? 0) >= 5
    );
    if (!hasRecentShopper) {
      setLoading(true);
      const rid = sessionStorage.getItem('respondent_id');

      // Build funnel data to save
      const data: Record<string, unknown> = {};
      RETAILERS.forEach((r) => {
        data[`funnel_${r.code}`] = values[r.code];
      });
      if (otherText.trim()) data.funnel_other_text = otherText.trim();

      await fetch('/api/survey/terminate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          respondent_id: rid,
          termination_point: 'S3',
          data,
        }),
      });
      router.push('/survey/terminated?reason=S3');
      return;
    }

    setLoading(true);
    const rid = sessionStorage.getItem('respondent_id');

    try {
      // Build save data
      const data: Record<string, unknown> = {};
      RETAILERS.forEach((r) => {
        data[`funnel_${r.code}`] = values[r.code];
      });
      if (otherText.trim()) data.funnel_other_text = otherText.trim();

      // Store funnel data in sessionStorage for S4 filtering
      const funnelData: Record<string, number> = {};
      RETAILERS.forEach((r) => {
        funnelData[r.code] = values[r.code] as number;
      });
      sessionStorage.setItem('funnel_data', JSON.stringify(funnelData));

      // Store list of retailers where funnel=6 (shopped last 3m)
      const storesLast3m = RETAILERS
        .filter((r) => values[r.code] === 6)
        .map((r) => r.code);
      sessionStorage.setItem('stores_last_3m', JSON.stringify(storesLast3m));

      await fetch('/api/survey/submit-block', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          respondent_id: rid,
          block: 's3',
          current_block: 'block1_s4',
          data,
        }),
      });

      router.push('/survey/block1/s4');
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (showSignpost) {
    return (
      <>
        <ProgressBar progress={0.07} />
        <SignpostScreen
          text={SIGNPOST_TEXTS.before_s3}
          onContinue={() => setShowSignpost(false)}
        />
      </>
    );
  }

  return (
    <>
      <ProgressBar progress={0.07} />
      <div className="p-6 sm:p-8">
        <QuestionWrapper
          questionText="For each of the following grocery stores, which best describes your familiarity or shopping history?"
          subText="Please select one option per row."
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
            mobileGroupSize={4}
          />

          {/* "Other" text input */}
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
          disabled={loading}
          className="btn-primary"
        >
          {loading ? 'Saving...' : 'Continue'}
        </button>
      </div>
    </>
  );
}
