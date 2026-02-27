'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ProgressBar from '@/components/survey/ProgressBar';
import QuestionWrapper from '@/components/survey/QuestionWrapper';
import SignpostScreen from '@/components/survey/SignpostScreen';
import SingleSelect from '@/components/survey/SingleSelect';
import { SIGNPOST_TEXTS, BASKET_MIDPOINTS } from '@/lib/constants';

const F1_OPTIONS = [
  { value: 1, label: 'Once a week or more' },
  { value: 2, label: '2-3 times per month' },
  { value: 3, label: 'About once a month' },
  { value: 4, label: 'A few times a year' },
  { value: 5, label: 'Rarely or never' },
];

const F2_OPTIONS = [
  { value: 1, label: 'Once a week or more' },
  { value: 2, label: '2-3 times per month' },
  { value: 3, label: 'About once a month' },
  { value: 4, label: 'Less than once a month' },
];

const F3_OPTIONS = [
  { value: 1, label: 'Under $25' },
  { value: 2, label: '$25 - $50' },
  { value: 3, label: '$51 - $100' },
  { value: 4, label: '$101 - $150' },
  { value: 5, label: '$151 - $200' },
  { value: 6, label: 'Over $200' },
];

const F4_OPTIONS = [
  { value: 1, label: 'Spending more than a year ago' },
  { value: 2, label: 'Spending about the same' },
  { value: 3, label: 'Spending less than a year ago' },
];

type Step = 'signpost' | 'f1' | 'f2' | 'f3' | 'f4';

export default function Block6Page() {
  const router = useRouter();
  const [showSignpost, setShowSignpost] = useState(true);
  const [step, setStep] = useState<Step>('f1');
  const [segment, setSegment] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const [freqTotal, setFreqTotal] = useState<number | null>(null);
  const [freqFareway, setFreqFareway] = useState<number | null>(null);
  const [avgBasket, setAvgBasket] = useState<number | null>(null);
  const [tripTrend, setTripTrend] = useState<number | null>(null);

  useEffect(() => {
    setSegment(sessionStorage.getItem('segment') || '');
  }, []);

  const isCustomer = segment === 'primary_shopper' || segment === 'secondary_shopper';

  const handleNext = async () => {
    setError('');

    if (step === 'f1') {
      if (freqTotal === null) { setError('Please select one option.'); return; }
      if (isCustomer) { setStep('f2'); } else { setStep('f3'); }
      return;
    }

    if (step === 'f2') {
      if (freqFareway === null) { setError('Please select one option.'); return; }
      setStep('f3');
      return;
    }

    if (step === 'f3') {
      if (avgBasket === null) { setError('Please select one option.'); return; }
      setStep('f4');
      return;
    }

    if (step === 'f4') {
      if (tripTrend === null) { setError('Please select one option.'); return; }

      setLoading(true);
      const rid = sessionStorage.getItem('respondent_id');

      try {
        const data: Record<string, unknown> = {
          freq_total: freqTotal,
          freq_fareway: isCustomer ? freqFareway : null,
          avg_basket: avgBasket,
          avg_basket_midpoint: avgBasket ? BASKET_MIDPOINTS[avgBasket] || null : null,
          trip_trend: tripTrend,
        };

        await fetch('/api/survey/submit-block', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            respondent_id: rid,
            block: 'block6',
            current_block: 'block7',
            data,
          }),
        });

        router.push('/survey/block7');
      } catch {
        setError('Something went wrong. Please try again.');
      } finally {
        setLoading(false);
      }
    }
  };

  if (showSignpost) {
    return (
      <>
        <ProgressBar progress={0.78} />
        <SignpostScreen
          text={SIGNPOST_TEXTS.before_block6}
          onContinue={() => setShowSignpost(false)}
        />
      </>
    );
  }

  return (
    <>
      <ProgressBar progress={0.78} />
      <div className="p-6 sm:p-8">
        {step === 'f1' && (
          <QuestionWrapper
            questionText="How often do you shop for groceries in total (across all stores)?"
            error={error}
          >
            <SingleSelect
              options={F1_OPTIONS}
              value={freqTotal}
              onChange={(v) => { setFreqTotal(v as number); if (error) setError(''); }}
            />
          </QuestionWrapper>
        )}

        {step === 'f2' && (
          <QuestionWrapper
            questionText="How often do you shop specifically at Fareway?"
            error={error}
          >
            <SingleSelect
              options={F2_OPTIONS}
              value={freqFareway}
              onChange={(v) => { setFreqFareway(v as number); if (error) setError(''); }}
            />
          </QuestionWrapper>
        )}

        {step === 'f3' && (
          <QuestionWrapper
            questionText="On a typical grocery shopping trip, approximately how much do you spend?"
            error={error}
          >
            <SingleSelect
              options={F3_OPTIONS}
              value={avgBasket}
              onChange={(v) => { setAvgBasket(v as number); if (error) setError(''); }}
            />
          </QuestionWrapper>
        )}

        {step === 'f4' && (
          <QuestionWrapper
            questionText="Compared to a year ago, are you spending more, less, or about the same on groceries overall?"
            error={error}
          >
            <SingleSelect
              options={F4_OPTIONS}
              value={tripTrend}
              onChange={(v) => { setTripTrend(v as number); if (error) setError(''); }}
            />
          </QuestionWrapper>
        )}

        <button onClick={handleNext} disabled={loading} className="btn-primary">
          {loading ? 'Saving...' : 'Continue'}
        </button>
      </div>
    </>
  );
}
