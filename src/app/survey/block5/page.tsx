'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ProgressBar from '@/components/survey/ProgressBar';
import QuestionWrapper from '@/components/survey/QuestionWrapper';
import SignpostScreen from '@/components/survey/SignpostScreen';
import SingleSelect from '@/components/survey/SingleSelect';
import OpenEndedText from '@/components/survey/OpenEndedText';
import { SIGNPOST_TEXTS } from '@/lib/constants';
import { collapseChannel } from '@/lib/segment-logic';

const L1_OPTIONS = [
  { value: 1, label: 'Better prices or value at another store' },
  { value: 2, label: 'Better product quality elsewhere' },
  { value: 3, label: 'More convenient location' },
  { value: 4, label: 'Better selection or variety' },
  { value: 5, label: 'Poor customer service' },
  { value: 6, label: 'Nothing could make me switch — very loyal' },
  { value: 7, label: 'Other (please specify)' },
];

const L2_OPTIONS = [
  { value: 1, label: 'Lower prices or better deals' },
  { value: 2, label: 'A new store location closer to me' },
  { value: 3, label: 'Better product quality or selection' },
  { value: 4, label: 'Recommendation from friends/family' },
  { value: 5, label: 'Online ordering or delivery options' },
  { value: 6, label: 'Nothing — I\'m not interested' },
  { value: 7, label: 'Other (please specify)' },
];

const L3_OPTIONS = [
  { value: 1, label: 'Almost always in-store' },
  { value: 2, label: 'Mostly in-store, some online' },
  { value: 3, label: 'About equal mix of in-store and online' },
  { value: 4, label: 'Mostly online, some in-store' },
  { value: 5, label: 'Almost always online (delivery/pickup)' },
];

const L4_OPTIONS = [
  { value: 1, label: 'More in-store' },
  { value: 2, label: 'About the same' },
  { value: 3, label: 'More online' },
];

type Step = 'signpost' | 'l1' | 'l1a' | 'l2' | 'l2a' | 'signpost_l3' | 'l3' | 'l4';

export default function Block5Page() {
  const router = useRouter();
  const [showSignpost, setShowSignpost] = useState(true);
  const [step, setStep] = useState<Step>('l1');
  const [segment, setSegment] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Answers
  const [churnRiskReason, setChurnRiskReason] = useState<number | null>(null);
  const [churnRiskReasonText, setChurnRiskReasonText] = useState('');
  const [farewayImprove, setFarewayImprove] = useState('');
  const [acquisitionTrigger, setAcquisitionTrigger] = useState<number | null>(null);
  const [acquisitionTriggerText, setAcquisitionTriggerText] = useState('');
  const [farewayTryMe, setFarewayTryMe] = useState('');
  const [channelCurrent, setChannelCurrent] = useState<number | null>(null);
  const [channelChange, setChannelChange] = useState<number | null>(null);

  useEffect(() => {
    const seg = sessionStorage.getItem('segment') || '';
    setSegment(seg);

    // Determine starting step based on segment
    if (seg === 'primary_shopper' || seg === 'secondary_shopper') {
      setStep('l1');
    } else if (seg === 'aware_non_customer' || seg === 'lapsed') {
      setStep('l2');
    } else {
      // unaware_non_customer: skip L1/L2, go straight to L3
      setStep('signpost_l3');
    }
  }, []);

  const handleNext = async () => {
    setError('');

    if (step === 'l1') {
      if (churnRiskReason === null) { setError('Please select one option.'); return; }
      if (churnRiskReason === 7 && churnRiskReasonText.trim().length < 3) {
        setError('Please specify your reason.'); return;
      }
      setStep('l1a');
      return;
    }

    if (step === 'l1a') {
      if (farewayImprove.trim().length < 5) {
        setError('Please provide at least 5 characters.'); return;
      }
      setStep('signpost_l3');
      return;
    }

    if (step === 'l2') {
      if (acquisitionTrigger === null) { setError('Please select one option.'); return; }
      if (acquisitionTrigger === 7 && acquisitionTriggerText.trim().length < 3) {
        setError('Please specify your reason.'); return;
      }
      setStep('l2a');
      return;
    }

    if (step === 'l2a') {
      if (farewayTryMe.trim().length < 5) {
        setError('Please provide at least 5 characters.'); return;
      }
      setStep('signpost_l3');
      return;
    }

    if (step === 'signpost_l3') {
      setStep('l3');
      return;
    }

    if (step === 'l3') {
      if (channelCurrent === null) { setError('Please select one option.'); return; }
      setStep('l4');
      return;
    }

    if (step === 'l4') {
      if (channelChange === null) { setError('Please select one option.'); return; }

      // Save all
      setLoading(true);
      const rid = sessionStorage.getItem('respondent_id');

      try {
        const data: Record<string, unknown> = {
          channel_current: channelCurrent,
          channel_current_collapsed: channelCurrent ? collapseChannel(channelCurrent) : null,
          channel_change: channelChange,
        };

        if (segment === 'primary_shopper' || segment === 'secondary_shopper') {
          data.churn_risk_reason = churnRiskReason;
          data.churn_risk_reason_text = churnRiskReason === 7 ? churnRiskReasonText.trim() : null;
          data.fareway_improve_verbatim = farewayImprove.trim();
        }

        if (segment === 'aware_non_customer' || segment === 'lapsed') {
          data.acquisition_trigger = acquisitionTrigger;
          data.acquisition_trigger_text = acquisitionTrigger === 7 ? acquisitionTriggerText.trim() : null;
          data.fareway_tryme_verbatim = farewayTryMe.trim();
        }

        await fetch('/api/survey/submit-block', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            respondent_id: rid,
            block: 'block5',
            current_block: 'block6',
            data,
          }),
        });

        router.push('/survey/block6');
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
        <ProgressBar progress={0.68} />
        <SignpostScreen
          text={SIGNPOST_TEXTS.before_block5}
          onContinue={() => setShowSignpost(false)}
        />
      </>
    );
  }

  if (step === 'signpost_l3') {
    return (
      <>
        <ProgressBar progress={0.72} />
        <SignpostScreen
          text={SIGNPOST_TEXTS.before_l3}
          onContinue={() => setStep('l3')}
        />
      </>
    );
  }

  return (
    <>
      <ProgressBar progress={0.70} />
      <div className="p-6 sm:p-8">
        {step === 'l1' && (
          <QuestionWrapper
            questionText="What would be the most likely reason for you to significantly reduce your shopping at your primary grocery store?"
            error={error}
          >
            <SingleSelect
              options={L1_OPTIONS}
              value={churnRiskReason}
              onChange={(v) => { setChurnRiskReason(v as number); if (error) setError(''); }}
            />
            {churnRiskReason === 7 && (
              <div className="mt-3">
                <input type="text" value={churnRiskReasonText}
                  onChange={(e) => setChurnRiskReasonText(e.target.value)}
                  placeholder="Please specify..."
                  className="w-full p-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
            )}
          </QuestionWrapper>
        )}

        {step === 'l1a' && (
          <QuestionWrapper
            questionText="If Fareway could improve one thing that would make you shop there more, what would it be?"
            error={error}
          >
            <OpenEndedText
              value={farewayImprove}
              onChange={(v) => { setFarewayImprove(v); if (error) setError(''); }}
              placeholder="Please share your thoughts..."
            />
          </QuestionWrapper>
        )}

        {step === 'l2' && (
          <QuestionWrapper
            questionText="What would most likely motivate you to start shopping at Fareway (or shop there more often)?"
            error={error}
          >
            <SingleSelect
              options={L2_OPTIONS}
              value={acquisitionTrigger}
              onChange={(v) => { setAcquisitionTrigger(v as number); if (error) setError(''); }}
            />
            {acquisitionTrigger === 7 && (
              <div className="mt-3">
                <input type="text" value={acquisitionTriggerText}
                  onChange={(e) => setAcquisitionTriggerText(e.target.value)}
                  placeholder="Please specify..."
                  className="w-full p-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
            )}
          </QuestionWrapper>
        )}

        {step === 'l2a' && (
          <QuestionWrapper
            questionText="What is one thing Fareway could do to get you to try them for the first time (or come back)?"
            error={error}
          >
            <OpenEndedText
              value={farewayTryMe}
              onChange={(v) => { setFarewayTryMe(v); if (error) setError(''); }}
              placeholder="Please share your thoughts..."
            />
          </QuestionWrapper>
        )}

        {step === 'l3' && (
          <QuestionWrapper
            questionText="How do you currently do most of your grocery shopping?"
            error={error}
          >
            <SingleSelect
              options={L3_OPTIONS}
              value={channelCurrent}
              onChange={(v) => { setChannelCurrent(v as number); if (error) setError(''); }}
            />
          </QuestionWrapper>
        )}

        {step === 'l4' && (
          <QuestionWrapper
            questionText="Over the next year, do you expect to do more grocery shopping in-store, more online, or about the same?"
            error={error}
          >
            <SingleSelect
              options={L4_OPTIONS}
              value={channelChange}
              onChange={(v) => { setChannelChange(v as number); if (error) setError(''); }}
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
