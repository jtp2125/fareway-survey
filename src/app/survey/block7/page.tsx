'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import ProgressBar from '@/components/survey/ProgressBar';
import QuestionWrapper from '@/components/survey/QuestionWrapper';
import SignpostScreen from '@/components/survey/SignpostScreen';
import SingleSelect from '@/components/survey/SingleSelect';
import MultiSelect from '@/components/survey/MultiSelect';
import RankingQuestion from '@/components/survey/RankingQuestion';
import { SIGNPOST_TEXTS, RETAILERS, getRetailerDisplay } from '@/lib/constants';

const M1_OPTIONS = [
  { value: 1, label: 'Significantly impacted — I\'ve had to change my grocery habits a lot' },
  { value: 2, label: 'Somewhat impacted — I\'ve made some changes' },
  { value: 3, label: 'Slightly impacted — I\'ve made minor adjustments' },
  { value: 4, label: 'Not impacted at all — my habits are the same' },
];

const M2_OPTIONS = [
  { value: 1, label: 'Worse — my financial situation has gotten harder' },
  { value: 2, label: 'About the same' },
  { value: 3, label: 'Better — my financial situation has improved' },
];

const M3_OPTIONS = [
  { value: 'tradedown_storebrand', label: 'Switched to more store brand / private label products' },
  { value: 'tradedown_organic', label: 'Reduced organic or premium product purchases' },
  { value: 'tradedown_premium', label: 'Cut back on premium or specialty items' },
  { value: 'tradedown_discount_grocer', label: 'Shopped more at discount grocers' },
  { value: 'tradedown_coupons', label: 'Used more coupons or looked for more deals' },
  { value: 'tradedown_food_waste', label: 'Reduced food waste / bought less overall' },
  { value: 'tradedown_none', label: 'None of the above', exclusive: true },
];

type Step = 'signpost' | 'm1' | 'm2' | 'm3' | 'm4' | 'm5a' | 'm5b';

export default function Block7Page() {
  const router = useRouter();
  const [showSignpost, setShowSignpost] = useState(true);
  const [step, setStep] = useState<Step>('m1');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // M1
  const [budgetTrend, setBudgetTrend] = useState<number | null>(null);
  // M2
  const [macroResponse, setMacroResponse] = useState<number | null>(null);
  // M3
  const [tradedowns, setTradedowns] = useState<(number | string)[]>([]);
  // M4
  const [bestValue, setBestValue] = useState<(number | string)[]>([]);
  // M5a/M5b
  const [priceRaisedRanked, setPriceRaisedRanked] = useState<string[]>([]);
  const [priceStableRanked, setPriceStableRanked] = useState<string[]>([]);

  // Build M4 options from funnel >= 2 retailers
  const [m4Options, setM4Options] = useState<{ value: string; label: string }[]>([]);

  useEffect(() => {
    const funnelStr = sessionStorage.getItem('funnel_data');
    if (funnelStr) {
      const funnelData = JSON.parse(funnelStr) as Record<string, number>;
      const eligible = RETAILERS
        .filter((r) => funnelData[r.code] >= 2 && r.code !== 'other')
        .map((r) => ({ value: r.code, label: r.display }));
      setM4Options(eligible);
    }
  }, []);

  // Build ranking items from funnel >= 2 retailers
  const rankingItems = useMemo(() => {
    const funnelStr = typeof window !== 'undefined' ? sessionStorage.getItem('funnel_data') : null;
    if (!funnelStr) return [];
    const funnelData = JSON.parse(funnelStr) as Record<string, number>;
    return RETAILERS
      .filter((r) => funnelData[r.code] >= 2 && r.code !== 'other')
      .map((r) => ({ value: r.code, label: getRetailerDisplay(r.code) }));
  }, []);

  const handleNext = async () => {
    setError('');

    if (step === 'm1') {
      if (budgetTrend === null) { setError('Please select one option.'); return; }
      setStep('m2');
      return;
    }

    if (step === 'm2') {
      if (macroResponse === null) { setError('Please select one option.'); return; }
      setStep('m3');
      return;
    }

    if (step === 'm3') {
      if (tradedowns.length === 0) { setError('Please select at least one option.'); return; }
      setStep('m4');
      return;
    }

    if (step === 'm4') {
      if (bestValue.length === 0) { setError('Please select at least one store.'); return; }
      if (bestValue.length > 2) { setError('Please select at most 2 stores.'); return; }
      setStep('m5a');
      return;
    }

    if (step === 'm5a') {
      if (priceRaisedRanked.length === 0) { setError('Please rank at least one store.'); return; }
      setStep('m5b');
      return;
    }

    if (step === 'm5b') {
      if (priceStableRanked.length === 0) { setError('Please rank at least one store.'); return; }

      // Save all
      setLoading(true);
      const rid = sessionStorage.getItem('respondent_id');

      try {
        // Compute tradedown_count (non-"none" selections)
        const tradedownCount = tradedowns.includes('tradedown_none') ? 0 : tradedowns.length;

        const data: Record<string, unknown> = {
          budget_trend: budgetTrend,
          macro_response: macroResponse,
          tradedown_count: tradedownCount,
          best_value_1: bestValue[0] || null,
          best_value_2: bestValue[1] || null,
          price_raised_rank_1: priceRaisedRanked[0] || null,
          price_raised_rank_2: priceRaisedRanked[1] || null,
          price_raised_rank_3: priceRaisedRanked[2] || null,
          price_stable_rank_1: priceStableRanked[0] || null,
          price_stable_rank_2: priceStableRanked[1] || null,
          price_stable_rank_3: priceStableRanked[2] || null,
        };

        // Store individual tradedown flags
        const allTradedownCodes = ['tradedown_storebrand', 'tradedown_organic', 'tradedown_premium',
          'tradedown_discount_grocer', 'tradedown_coupons', 'tradedown_food_waste', 'tradedown_none'];
        allTradedownCodes.forEach((code) => {
          data[code] = tradedowns.includes(code) ? 1 : 0;
        });

        await fetch('/api/survey/submit-block', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            respondent_id: rid,
            block: 'block7',
            current_block: 'block8',
            data,
          }),
        });

        router.push('/survey/block8');
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
        <ProgressBar progress={0.85} />
        <SignpostScreen
          text={SIGNPOST_TEXTS.before_block7}
          onContinue={() => setShowSignpost(false)}
        />
      </>
    );
  }

  return (
    <>
      <ProgressBar progress={0.88} />
      <div className="p-6 sm:p-8">
        {step === 'm1' && (
          <QuestionWrapper
            questionText="How much have current economic conditions (inflation, rising costs) impacted your grocery shopping habits?"
            error={error}
          >
            <SingleSelect options={M1_OPTIONS} value={budgetTrend}
              onChange={(v) => { setBudgetTrend(v as number); if (error) setError(''); }} />
          </QuestionWrapper>
        )}

        {step === 'm2' && (
          <QuestionWrapper
            questionText="Compared to 6 months ago, how would you describe your household's overall financial situation?"
            error={error}
          >
            <SingleSelect options={M2_OPTIONS} value={macroResponse}
              onChange={(v) => { setMacroResponse(v as number); if (error) setError(''); }} />
          </QuestionWrapper>
        )}

        {step === 'm3' && (
          <QuestionWrapper
            questionText="Which of the following have you done in response to rising grocery prices? Select all that apply."
            error={error}
          >
            <MultiSelect options={M3_OPTIONS} values={tradedowns}
              onChange={(v) => { setTradedowns(v); if (error) setError(''); }} />
          </QuestionWrapper>
        )}

        {step === 'm4' && (
          <QuestionWrapper
            questionText="Which grocery store(s) do you feel offer the best overall value for money? Select up to 2."
            error={error}
          >
            <MultiSelect options={m4Options} values={bestValue} maxSelections={2}
              onChange={(v) => { setBestValue(v); if (error) setError(''); }} />
          </QuestionWrapper>
        )}

        {step === 'm5a' && (
          <QuestionWrapper
            questionText="Which stores do you feel have raised prices the most? Rank up to 3."
            error={error}
          >
            <RankingQuestion
              items={rankingItems}
              maxRank={3}
              value={priceRaisedRanked}
              onChange={(v) => { setPriceRaisedRanked(v); if (error) setError(''); }}
            />
          </QuestionWrapper>
        )}

        {step === 'm5b' && (
          <QuestionWrapper
            questionText="Which stores do you feel have been most stable with their pricing? Rank up to 3."
            error={error}
          >
            <RankingQuestion
              items={rankingItems}
              maxRank={3}
              value={priceStableRanked}
              onChange={(v) => { setPriceStableRanked(v); if (error) setError(''); }}
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
