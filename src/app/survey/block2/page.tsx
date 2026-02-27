'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ProgressBar from '@/components/survey/ProgressBar';
import QuestionWrapper from '@/components/survey/QuestionWrapper';
import SignpostScreen from '@/components/survey/SignpostScreen';
import NPSScale from '@/components/survey/NPSScale';
import OpenEndedText from '@/components/survey/OpenEndedText';
import { SIGNPOST_TEXTS, getRetailerDisplay } from '@/lib/constants';
import { npsCategory } from '@/lib/segment-logic';

interface RetailerStep {
  key: string; // 'r1', 'r2', 'r3'
  code: string;
  name: string;
}

export default function Block2Page() {
  const router = useRouter();
  const [showSignpost, setShowSignpost] = useState(true);
  const [retailers, setRetailers] = useState<RetailerStep[]>([]);
  const [currentStep, setCurrentStep] = useState(0); // 0=NPS for R1, 1=verbatim for R1, 2=NPS for R2, etc.
  const [scores, setScores] = useState<Record<string, number | null>>({});
  const [verbatims, setVerbatims] = useState<Record<string, string>>({});
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const r1 = sessionStorage.getItem('r1');
    const r2 = sessionStorage.getItem('r2');
    const r3 = sessionStorage.getItem('r3');

    const list: RetailerStep[] = [];
    if (r1) list.push({ key: 'r1', code: r1, name: getRetailerDisplay(r1) });
    if (r2) list.push({ key: 'r2', code: r2, name: getRetailerDisplay(r2) });
    if (r3) list.push({ key: 'r3', code: r3, name: getRetailerDisplay(r3) });
    setRetailers(list);
  }, []);

  // Each retailer has 2 sub-steps: NPS score, then verbatim
  const totalSteps = retailers.length * 2;
  const retailerIndex = Math.floor(currentStep / 2);
  const isVerbatimStep = currentStep % 2 === 1;
  const currentRetailer = retailers[retailerIndex];

  const handleNext = async () => {
    if (!currentRetailer) return;
    const key = currentRetailer.key;

    if (!isVerbatimStep) {
      // Validate NPS score
      if (scores[key] === null || scores[key] === undefined) {
        setError('Please select a rating.');
        return;
      }
      setError('');
      setCurrentStep(currentStep + 1);
      return;
    }

    // Verbatim step — check min length
    const verbatim = verbatims[key] || '';
    if (verbatim.trim().length < 5) {
      setError('Please provide at least a brief explanation (5+ characters).');
      return;
    }

    setError('');

    // If more retailers to go, advance
    if (currentStep < totalSteps - 1) {
      setCurrentStep(currentStep + 1);
      return;
    }

    // All done — save everything
    setLoading(true);
    const rid = sessionStorage.getItem('respondent_id');

    try {
      const data: Record<string, unknown> = {};
      retailers.forEach((r, i) => {
        const num = i + 1;
        const score = scores[r.key] as number;
        data[`nps_r${num}_score`] = score;
        data[`nps_r${num}_category`] = npsCategory(score);
        data[`nps_r${num}_verbatim`] = verbatims[r.key] || '';
      });

      await fetch('/api/survey/submit-block', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          respondent_id: rid,
          block: 'block2',
          current_block: 'block3_k1',
          data,
        }),
      });

      router.push('/survey/block3/k1');
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (showSignpost) {
    return (
      <>
        <ProgressBar progress={0.25} />
        <SignpostScreen
          text={SIGNPOST_TEXTS.before_block2}
          onContinue={() => setShowSignpost(false)}
        />
      </>
    );
  }

  if (!currentRetailer) {
    return (
      <>
        <ProgressBar progress={0.25} />
        <div className="p-6 sm:p-8 text-center text-gray-500">Loading...</div>
      </>
    );
  }

  return (
    <>
      <ProgressBar progress={0.25 + (currentStep / totalSteps) * 0.05} />
      <div className="p-6 sm:p-8">
        {/* Sub-step indicator */}
        <p className="text-xs text-gray-400 mb-4">
          Store {retailerIndex + 1} of {retailers.length}: {currentRetailer.name}
        </p>

        {!isVerbatimStep ? (
          <QuestionWrapper
            questionText={`How likely are you to recommend ${currentRetailer.name} to a friend or colleague?`}
            error={error}
          >
            <NPSScale
              value={scores[currentRetailer.key] ?? null}
              onChange={(v) => {
                setScores({ ...scores, [currentRetailer.key]: v });
                if (error) setError('');
              }}
            />
          </QuestionWrapper>
        ) : (
          <QuestionWrapper
            questionText={`What is the primary reason for your score for ${currentRetailer.name}?`}
            error={error}
          >
            <OpenEndedText
              value={verbatims[currentRetailer.key] || ''}
              onChange={(v) => {
                setVerbatims({ ...verbatims, [currentRetailer.key]: v });
                if (error) setError('');
              }}
              placeholder="Please explain your rating..."
            />
          </QuestionWrapper>
        )}

        <button
          onClick={handleNext}
          disabled={loading}
          className="btn-primary"
        >
          {loading ? 'Saving...' : currentStep < totalSteps - 1 ? 'Next' : 'Continue'}
        </button>
      </div>
    </>
  );
}
