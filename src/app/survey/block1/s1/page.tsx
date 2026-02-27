'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import ProgressBar from '@/components/survey/ProgressBar';
import QuestionWrapper from '@/components/survey/QuestionWrapper';
import SignpostScreen from '@/components/survey/SignpostScreen';

export default function S1Page() {
  const router = useRouter();
  const [showSignpost, setShowSignpost] = useState(true);
  const [zip, setZip] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (showSignpost) {
    return (
      <>
        <ProgressBar progress={0.02} />
        <div className="p-6 sm:p-8">
          <SignpostScreen
            text="First, we'd like to confirm a few things about you and your household."
            onContinue={() => setShowSignpost(false)}
          />
        </div>
      </>
    );
  }

  const handleSubmit = async () => {
    setError('');

    if (!/^\d{5}$/.test(zip)) {
      setError('Please enter a valid 5-digit ZIP code.');
      return;
    }

    setLoading(true);

    try {
      // Validate ZIP against trade area
      const zipRes = await fetch('/api/zip-lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ zip_code: zip }),
      });
      const zipData = await zipRes.json();

      const rid = sessionStorage.getItem('respondent_id');

      if (!zipData.valid) {
        // Terminate
        await fetch('/api/survey/terminate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            respondent_id: rid,
            termination_point: 'S1',
            data: { zip_code: zip },
          }),
        });
        router.push('/survey/terminated?reason=S1');
        return;
      }

      // Save and continue
      await fetch('/api/survey/submit-block', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          respondent_id: rid,
          block: 's1',
          current_block: 'block1_s2',
          data: {
            zip_code: zip,
            dma: zipData.dma,
          },
        }),
      });

      router.push('/survey/block1/s2');
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <ProgressBar progress={0.03} />
      <div className="p-6 sm:p-8">
        <QuestionWrapper
          questionText="What is your home ZIP code?"
          error={error}
        >
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={5}
            value={zip}
            onChange={(e) => {
              const val = e.target.value.replace(/\D/g, '').slice(0, 5);
              setZip(val);
              if (error) setError('');
            }}
            placeholder="Enter 5-digit ZIP"
            className="w-full sm:w-48 p-3 border border-gray-300 rounded-lg text-base text-center
                       tracking-widest font-mono focus:outline-none focus:ring-2 focus:ring-primary
                       focus:border-transparent"
            autoFocus
          />
        </QuestionWrapper>

        <button
          onClick={handleSubmit}
          disabled={loading || zip.length !== 5}
          className="btn-primary"
        >
          {loading ? 'Checking...' : 'Continue'}
        </button>
      </div>
    </>
  );
}
