'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import ProgressBar from '@/components/survey/ProgressBar';
import QuestionWrapper from '@/components/survey/QuestionWrapper';
import SingleSelect from '@/components/survey/SingleSelect';
import { collapseHousehold } from '@/lib/segment-logic';

const OPTIONS = [
  { value: 1, label: 'Single, living alone' },
  { value: 2, label: 'Couple, no children at home' },
  { value: 3, label: 'Family with children under 18' },
  { value: 4, label: 'Family with children 18+' },
  { value: 5, label: 'Roommates / shared household' },
  { value: 6, label: 'Other' },
];

export default function S8Page() {
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
      const household_type_collapsed = collapseHousehold(value);

      // Step 1: Save household data
      await fetch('/api/survey/submit-block', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          respondent_id: rid,
          block: 's8',
          current_block: 'block1_s8_processing',
          data: {
            household_type: value,
            household_type_collapsed,
          },
        }),
      });

      // Step 2: Read segment from sessionStorage
      const segment = sessionStorage.getItem('segment');

      // Step 3: Check quota
      const quotaRes = await fetch('/api/survey/check-quota', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ segment }),
      });
      const quotaData = await quotaRes.json();

      if (!quotaData.admitted) {
        await fetch('/api/survey/terminate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            respondent_id: rid,
            termination_point: 'quota_full',
            data: {
              household_type: value,
              household_type_collapsed,
            },
          }),
        });
        router.push('/survey/terminated?reason=quota_full');
        return;
      }

      // Step 4: Assign retailers
      const storesLast3mStr = sessionStorage.getItem('stores_last_3m');
      const storesLast3m = storesLast3mStr ? JSON.parse(storesLast3mStr) : [];
      const primaryStore = sessionStorage.getItem('primary_store');

      const assignRes = await fetch('/api/survey/assign-retailers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          respondent_id: rid,
          stores_last_3m: storesLast3m,
          primary_store: primaryStore,
          segment,
        }),
      });
      const assignData = await assignRes.json();

      // Step 5: Store R1/R2/R3 in sessionStorage
      sessionStorage.setItem('r1', assignData.r1 || '');
      sessionStorage.setItem('r2', assignData.r2 || '');
      sessionStorage.setItem('r3', assignData.r3 || '');

      // Step 6: Save segment + retailer assignments
      await fetch('/api/survey/submit-block', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          respondent_id: rid,
          block: 's8_assignments',
          current_block: 'block2',
          data: {
            segment,
            nps_r1_store: assignData.r1,
            nps_r2_store: assignData.r2,
            nps_r3_store: assignData.r3,
          },
        }),
      });

      // Step 7: Route to Block 2
      router.push('/survey/block2');
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <ProgressBar progress={0.20} />
      <div className="p-6 sm:p-8">
        <QuestionWrapper
          questionText="Which of the following best describes your household?"
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
