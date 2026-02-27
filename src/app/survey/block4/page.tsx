'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ProgressBar from '@/components/survey/ProgressBar';
import QuestionWrapper from '@/components/survey/QuestionWrapper';
import SignpostScreen from '@/components/survey/SignpostScreen';
import SingleSelect from '@/components/survey/SingleSelect';
import OpenEndedText from '@/components/survey/OpenEndedText';
import { SIGNPOST_TEXTS, getRetailerDisplay } from '@/lib/constants';

const DIR_OPTIONS = [
  { value: 1, label: 'Increased' },
  { value: 2, label: 'Stayed about the same' },
  { value: 3, label: 'Decreased' },
];

const REASON_INC_OPTIONS = [
  { value: 1, label: 'Better prices/deals' },
  { value: 2, label: 'Better product quality' },
  { value: 3, label: 'More convenient location' },
  { value: 4, label: 'Better selection' },
  { value: 5, label: 'Better online/delivery options' },
  { value: 6, label: 'Other (please specify)' },
];

const REASON_DEC_OPTIONS = [
  { value: 1, label: 'Higher prices' },
  { value: 2, label: 'Lower product quality' },
  { value: 3, label: 'Less convenient location' },
  { value: 4, label: 'Fewer products/selection' },
  { value: 5, label: 'Poor customer service' },
  { value: 6, label: 'Other (please specify)' },
];

interface StoreData {
  key: string; // 'store1', 'store2', 'store3'
  code: string;
  name: string;
}

// Sub-steps per store: W2 (retro dir) → optional W3a/W3b (reason) → W4 (fwd dir) → optional W5a/W5b (reason)
type SubStep = 'w2' | 'w3' | 'w4' | 'w5';

export default function Block4Page() {
  const router = useRouter();
  const [showSignpost, setShowSignpost] = useState(true);
  const [stores, setStores] = useState<StoreData[]>([]);
  const [storeIdx, setStoreIdx] = useState(0);
  const [subStep, setSubStep] = useState<SubStep>('w2');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Per-store answers
  const [answers, setAnswers] = useState<Record<string, Record<string, unknown>>>({});

  useEffect(() => {
    const sowStr = sessionStorage.getItem('sow_stores');
    if (sowStr) {
      const sowStores = JSON.parse(sowStr) as { code: string; pct: number }[];
      const eligible = sowStores
        .filter((s) => s.pct > 0)
        .slice(0, 3)
        .map((s, i) => ({
          key: `store${i + 1}`,
          code: s.code,
          name: getRetailerDisplay(s.code),
        }));
      setStores(eligible);
    }
  }, []);

  const currentStore = stores[storeIdx];
  const storeAnswers = currentStore ? (answers[currentStore.key] || {}) : {};

  const updateStoreAnswer = (field: string, value: unknown) => {
    if (!currentStore) return;
    setAnswers({
      ...answers,
      [currentStore.key]: { ...storeAnswers, [field]: value },
    });
    if (error) setError('');
  };

  const handleNext = () => {
    if (!currentStore) return;

    if (subStep === 'w2') {
      const dir = storeAnswers.retro_dir as number | undefined;
      if (dir == null) { setError('Please select one option.'); return; }
      setError('');
      // If increased or decreased, ask reason; otherwise skip to W4
      if (dir === 1 || dir === 3) {
        setSubStep('w3');
      } else {
        setSubStep('w4');
      }
      return;
    }

    if (subStep === 'w3') {
      const dir = storeAnswers.retro_dir as number;
      const reasonKey = dir === 1 ? 'retro_reason_inc' : 'retro_reason_dec';
      if (storeAnswers[reasonKey] == null) { setError('Please select one option.'); return; }
      // If "Other" selected, check text
      if ((storeAnswers[reasonKey] as number) === 6) {
        const textKey = dir === 1 ? 'retro_reason_inc_text' : 'retro_reason_dec_text';
        if (!storeAnswers[textKey] || (storeAnswers[textKey] as string).trim().length < 3) {
          setError('Please specify your reason.'); return;
        }
      }
      setError('');
      setSubStep('w4');
      return;
    }

    if (subStep === 'w4') {
      const dir = storeAnswers.fwd_dir as number | undefined;
      if (dir == null) { setError('Please select one option.'); return; }
      setError('');
      if (dir === 1 || dir === 3) {
        setSubStep('w5');
      } else {
        advanceStore();
      }
      return;
    }

    if (subStep === 'w5') {
      const dir = storeAnswers.fwd_dir as number;
      const reasonKey = dir === 1 ? 'fwd_reason_inc' : 'fwd_reason_dec';
      if (storeAnswers[reasonKey] == null) { setError('Please select one option.'); return; }
      if ((storeAnswers[reasonKey] as number) === 6) {
        const textKey = dir === 1 ? 'fwd_reason_inc_text' : 'fwd_reason_dec_text';
        if (!storeAnswers[textKey] || (storeAnswers[textKey] as string).trim().length < 3) {
          setError('Please specify your reason.'); return;
        }
      }
      setError('');
      advanceStore();
    }
  };

  const advanceStore = async () => {
    if (storeIdx < stores.length - 1) {
      setStoreIdx(storeIdx + 1);
      setSubStep('w2');
      return;
    }

    // All stores done — save
    setLoading(true);
    const rid = sessionStorage.getItem('respondent_id');

    try {
      const data: Record<string, unknown> = {};
      stores.forEach((s) => {
        const a = answers[s.key] || {};
        const n = s.key.replace('store', '');
        data[`sow_retro_store${n}_dir`] = a.retro_dir;
        data[`sow_retro_store${n}_reason_inc`] = a.retro_reason_inc ?? null;
        data[`sow_retro_store${n}_reason_inc_text`] = a.retro_reason_inc_text ?? null;
        data[`sow_retro_store${n}_reason_dec`] = a.retro_reason_dec ?? null;
        data[`sow_retro_store${n}_reason_dec_text`] = a.retro_reason_dec_text ?? null;
        data[`sow_fwd_store${n}_dir`] = a.fwd_dir;
        data[`sow_fwd_store${n}_reason_inc`] = a.fwd_reason_inc ?? null;
        data[`sow_fwd_store${n}_reason_inc_text`] = a.fwd_reason_inc_text ?? null;
        data[`sow_fwd_store${n}_reason_dec`] = a.fwd_reason_dec ?? null;
        data[`sow_fwd_store${n}_reason_dec_text`] = a.fwd_reason_dec_text ?? null;
      });

      await fetch('/api/survey/submit-block', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          respondent_id: rid,
          block: 'block4',
          current_block: 'block5',
          data,
        }),
      });

      router.push('/survey/block5');
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (showSignpost) {
    return (
      <>
        <ProgressBar progress={0.55} />
        <SignpostScreen
          text={SIGNPOST_TEXTS.before_block4}
          onContinue={() => setShowSignpost(false)}
        />
      </>
    );
  }

  if (!currentStore) {
    return (
      <>
        <ProgressBar progress={0.55} />
        <div className="p-6 sm:p-8 text-center text-gray-500">Loading...</div>
      </>
    );
  }

  const progressBase = 0.55;
  const progressRange = 0.10;
  const storeProgress = storeIdx / stores.length;

  return (
    <>
      <ProgressBar progress={progressBase + storeProgress * progressRange} />
      <div className="p-6 sm:p-8">
        <p className="text-xs text-gray-400 mb-4">
          Store {storeIdx + 1} of {stores.length}: {currentStore.name}
        </p>

        {subStep === 'w2' && (
          <QuestionWrapper
            questionText={`Over the past 6 months, has the amount you spend at ${currentStore.name} increased, decreased, or stayed about the same?`}
            error={error}
          >
            <SingleSelect
              options={DIR_OPTIONS}
              value={storeAnswers.retro_dir as number | null ?? null}
              onChange={(v) => updateStoreAnswer('retro_dir', v)}
            />
          </QuestionWrapper>
        )}

        {subStep === 'w3' && (
          <QuestionWrapper
            questionText={`What is the main reason your spending at ${currentStore.name} has ${(storeAnswers.retro_dir as number) === 1 ? 'increased' : 'decreased'}?`}
            error={error}
          >
            <SingleSelect
              options={(storeAnswers.retro_dir as number) === 1 ? REASON_INC_OPTIONS : REASON_DEC_OPTIONS}
              value={
                (storeAnswers.retro_dir as number) === 1
                  ? (storeAnswers.retro_reason_inc as number | null ?? null)
                  : (storeAnswers.retro_reason_dec as number | null ?? null)
              }
              onChange={(v) => {
                const dir = storeAnswers.retro_dir as number;
                updateStoreAnswer(dir === 1 ? 'retro_reason_inc' : 'retro_reason_dec', v);
              }}
            />
            {/* Show text input if "Other" */}
            {(((storeAnswers.retro_dir as number) === 1 && storeAnswers.retro_reason_inc === 6) ||
              ((storeAnswers.retro_dir as number) === 3 && storeAnswers.retro_reason_dec === 6)) && (
              <div className="mt-3">
                <input
                  type="text"
                  value={
                    ((storeAnswers.retro_dir as number) === 1
                      ? (storeAnswers.retro_reason_inc_text as string)
                      : (storeAnswers.retro_reason_dec_text as string)) || ''
                  }
                  onChange={(e) => {
                    const dir = storeAnswers.retro_dir as number;
                    updateStoreAnswer(dir === 1 ? 'retro_reason_inc_text' : 'retro_reason_dec_text', e.target.value);
                  }}
                  placeholder="Please specify..."
                  className="w-full p-2.5 border border-gray-300 rounded-lg text-sm
                    focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
            )}
          </QuestionWrapper>
        )}

        {subStep === 'w4' && (
          <QuestionWrapper
            questionText={`Looking ahead over the next 6 months, do you expect the amount you spend at ${currentStore.name} to increase, decrease, or stay about the same?`}
            error={error}
          >
            <SingleSelect
              options={DIR_OPTIONS}
              value={storeAnswers.fwd_dir as number | null ?? null}
              onChange={(v) => updateStoreAnswer('fwd_dir', v)}
            />
          </QuestionWrapper>
        )}

        {subStep === 'w5' && (
          <QuestionWrapper
            questionText={`What is the main reason you expect your spending at ${currentStore.name} to ${(storeAnswers.fwd_dir as number) === 1 ? 'increase' : 'decrease'}?`}
            error={error}
          >
            <SingleSelect
              options={(storeAnswers.fwd_dir as number) === 1 ? REASON_INC_OPTIONS : REASON_DEC_OPTIONS}
              value={
                (storeAnswers.fwd_dir as number) === 1
                  ? (storeAnswers.fwd_reason_inc as number | null ?? null)
                  : (storeAnswers.fwd_reason_dec as number | null ?? null)
              }
              onChange={(v) => {
                const dir = storeAnswers.fwd_dir as number;
                updateStoreAnswer(dir === 1 ? 'fwd_reason_inc' : 'fwd_reason_dec', v);
              }}
            />
            {(((storeAnswers.fwd_dir as number) === 1 && storeAnswers.fwd_reason_inc === 6) ||
              ((storeAnswers.fwd_dir as number) === 3 && storeAnswers.fwd_reason_dec === 6)) && (
              <div className="mt-3">
                <input
                  type="text"
                  value={
                    ((storeAnswers.fwd_dir as number) === 1
                      ? (storeAnswers.fwd_reason_inc_text as string)
                      : (storeAnswers.fwd_reason_dec_text as string)) || ''
                  }
                  onChange={(e) => {
                    const dir = storeAnswers.fwd_dir as number;
                    updateStoreAnswer(dir === 1 ? 'fwd_reason_inc_text' : 'fwd_reason_dec_text', e.target.value);
                  }}
                  placeholder="Please specify..."
                  className="w-full p-2.5 border border-gray-300 rounded-lg text-sm
                    focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
            )}
          </QuestionWrapper>
        )}

        <button
          onClick={handleNext}
          disabled={loading}
          className="btn-primary"
        >
          {loading ? 'Saving...' : 'Continue'}
        </button>
      </div>
    </>
  );
}
