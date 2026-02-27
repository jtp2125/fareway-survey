'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ProgressBar from '@/components/survey/ProgressBar';
import QuestionWrapper from '@/components/survey/QuestionWrapper';
import SignpostScreen from '@/components/survey/SignpostScreen';
import SOWAllocation from '@/components/survey/SOWAllocation';
import { RETAILERS, SIGNPOST_TEXTS } from '@/lib/constants';
import { classifySegment } from '@/lib/segment-logic';

export default function S4Page() {
  const router = useRouter();
  const [showSignpost, setShowSignpost] = useState(true);
  const [stores, setStores] = useState<{ code: string; label: string }[]>([]);
  const [values, setValues] = useState<Record<string, number>>({});
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Read funnel data from sessionStorage
    const funnelStr = sessionStorage.getItem('funnel_data');
    if (funnelStr) {
      const funnelData = JSON.parse(funnelStr) as Record<string, number>;
      // Only show retailers where funnel = 6 (shopped last 3m)
      const eligible: { code: string; label: string }[] = RETAILERS
        .filter((r) => funnelData[r.code] === 6 && r.code !== 'other')
        .map((r) => ({ code: r.code as string, label: r.display as string }));

      // Add "All other stores" anchored last
      eligible.push({ code: 'other_sow', label: 'All other stores' });
      setStores(eligible);

      // Init values to 0
      const init: Record<string, number> = {};
      eligible.forEach((s) => { init[s.code] = 0; });
      setValues(init);
    }
  }, []);

  const total = Object.values(values).reduce((sum, v) => sum + (v || 0), 0);

  const handleSubmit = async () => {
    if (total !== 100) {
      setError('Your allocations must sum to exactly 100%.');
      return;
    }

    setLoading(true);
    const rid = sessionStorage.getItem('respondent_id');

    try {
      // Sort by SOW descending (exclude other_sow for ranking)
      const storeEntries = stores
        .filter((s) => s.code !== 'other_sow')
        .map((s) => ({ code: s.code, pct: values[s.code] || 0 }))
        .sort((a, b) => {
          if (b.pct !== a.pct) return b.pct - a.pct;
          return Math.random() - 0.5; // Random tiebreak
        });

      const sow_store1_name = storeEntries[0]?.code ?? null;
      const sow_store1_pct = storeEntries[0]?.pct ?? 0;
      const sow_store2_name = storeEntries[1]?.code ?? null;
      const sow_store2_pct = storeEntries[1]?.pct ?? 0;
      const sow_store3_name = storeEntries[2]?.code ?? null;
      const sow_store3_pct = storeEntries[2]?.pct ?? 0;

      const primary_store = sow_store1_name;

      // Check for SOW tie (qc flag)
      const qc_sow_tie = storeEntries.length >= 2 && storeEntries[0].pct === storeEntries[1].pct ? 1 : 0;

      // Derive segment
      const funnelStr = sessionStorage.getItem('funnel_data');
      const funnelData = funnelStr ? JSON.parse(funnelStr) as Record<string, number> : {};
      const farewayFunnel = funnelData['fareway'] || 1;
      const segment = classifySegment(farewayFunnel, primary_store);

      const data: Record<string, unknown> = {
        sow_store1_name,
        sow_store1_pct,
        sow_store2_name,
        sow_store2_pct,
        sow_store3_name,
        sow_store3_pct,
        sow_other_pct: values['other_sow'] || 0,
        primary_store,
        segment,
        qc_sow_tie,
      };

      // Store in sessionStorage for downstream pages
      sessionStorage.setItem('sow_data', JSON.stringify(values));
      sessionStorage.setItem('sow_stores', JSON.stringify(storeEntries));
      sessionStorage.setItem('primary_store', primary_store || '');
      sessionStorage.setItem('segment', segment);

      await fetch('/api/survey/submit-block', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          respondent_id: rid,
          block: 's4',
          current_block: 'block1_s4a',
          data,
        }),
      });

      router.push('/survey/block1/s4a');
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (showSignpost) {
    return (
      <>
        <ProgressBar progress={0.10} />
        <SignpostScreen
          text={SIGNPOST_TEXTS.before_s4}
          onContinue={() => setShowSignpost(false)}
        />
      </>
    );
  }

  return (
    <>
      <ProgressBar progress={0.10} />
      <div className="p-6 sm:p-8">
        <QuestionWrapper
          questionText="Thinking about all the money you spend on groceries, approximately what percentage do you spend at each of these stores?"
          subText="Your allocations must add up to 100%."
          error={error}
        >
          <SOWAllocation
            stores={stores}
            values={values}
            onChange={(v) => {
              setValues(v);
              if (error) setError('');
            }}
          />
        </QuestionWrapper>

        <button
          onClick={handleSubmit}
          disabled={loading || total !== 100}
          className="btn-primary"
        >
          {loading ? 'Saving...' : 'Continue'}
        </button>
      </div>
    </>
  );
}
