'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import ProgressBar from '@/components/survey/ProgressBar';
import QuestionWrapper from '@/components/survey/QuestionWrapper';
import SignpostScreen from '@/components/survey/SignpostScreen';
import SingleSelect from '@/components/survey/SingleSelect';
import { SIGNPOST_TEXTS } from '@/lib/constants';

const D1_OPTIONS = [
  { value: 1, label: 'Male' },
  { value: 2, label: 'Female' },
  { value: 3, label: 'Non-binary / other' },
  { value: 4, label: 'Prefer not to say' },
];

const D2_OPTIONS = [
  { value: 1, label: 'Less than high school' },
  { value: 2, label: 'High school diploma or equivalent' },
  { value: 3, label: 'Some college / associate degree' },
  { value: 4, label: "Bachelor's degree" },
  { value: 5, label: 'Graduate or professional degree' },
  { value: 6, label: 'Prefer not to say' },
];

const D3_OPTIONS = [
  { value: 1, label: 'Employed full-time' },
  { value: 2, label: 'Employed part-time' },
  { value: 3, label: 'Self-employed' },
  { value: 4, label: 'Retired' },
  { value: 5, label: 'Student' },
  { value: 6, label: 'Homemaker' },
  { value: 7, label: 'Unemployed / looking for work' },
  { value: 8, label: 'Prefer not to say' },
];

const D4_OPTIONS = [
  { value: 1, label: 'Urban (city)' },
  { value: 2, label: 'Suburban' },
  { value: 3, label: 'Rural / small town' },
];

const D5_OPTIONS = [
  { value: 1, label: 'Less than 5 miles' },
  { value: 2, label: '5 - 10 miles' },
  { value: 3, label: '11 - 20 miles' },
  { value: 4, label: 'More than 20 miles' },
  { value: 5, label: 'Not sure' },
];

const D6_OPTIONS = [
  { value: 1, label: '1 (just me)' },
  { value: 2, label: '2' },
  { value: 3, label: '3' },
  { value: 4, label: '4' },
  { value: 5, label: '5 or more' },
];

const D7_OPTIONS = [
  { value: 1, label: 'White / Caucasian' },
  { value: 2, label: 'Black / African American' },
  { value: 3, label: 'Hispanic / Latino' },
  { value: 4, label: 'Asian / Asian American' },
  { value: 5, label: 'Native American / Alaska Native' },
  { value: 6, label: 'Multiracial / other' },
  { value: 7, label: 'Prefer not to say' },
];

interface QuestionDef {
  key: string;
  questionText: string;
  options: { value: number; label: string }[];
  hasOtherText?: boolean;
}

const QUESTIONS: QuestionDef[] = [
  { key: 'gender', questionText: 'What is your gender?', options: D1_OPTIONS },
  { key: 'education', questionText: 'What is the highest level of education you have completed?', options: D2_OPTIONS },
  { key: 'employment', questionText: 'Which best describes your current employment status?', options: D3_OPTIONS },
  { key: 'area_type', questionText: 'How would you describe the area where you live?', options: D4_OPTIONS },
  { key: 'distance_fareway', questionText: 'Approximately how far is the nearest Fareway store from your home?', options: D5_OPTIONS },
  { key: 'household_size', questionText: 'How many people (including yourself) live in your household?', options: D6_OPTIONS },
  { key: 'ethnicity', questionText: 'Which of the following best describes your race or ethnicity?', options: D7_OPTIONS, hasOtherText: true },
];

export default function Block8Page() {
  const router = useRouter();
  const [showSignpost, setShowSignpost] = useState(true);
  const [questionIdx, setQuestionIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number | null>>({});
  const [otherText, setOtherText] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const currentQ = QUESTIONS[questionIdx];
  const currentValue = currentQ ? (answers[currentQ.key] ?? null) : null;

  const handleNext = async () => {
    setError('');

    // Move to next question (skip is allowed for all block 8 questions)
    if (questionIdx < QUESTIONS.length - 1) {
      setQuestionIdx(questionIdx + 1);
      return;
    }

    // All done — save
    setLoading(true);
    const rid = sessionStorage.getItem('respondent_id');

    try {
      const data: Record<string, unknown> = {};
      QUESTIONS.forEach((q) => {
        data[q.key] = answers[q.key] ?? null;
      });
      if (otherText.trim()) {
        data.ethnicity_other_text = otherText.trim();
      }

      await fetch('/api/survey/submit-block', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          respondent_id: rid,
          block: 'block8',
          current_block: 'complete',
          data,
        }),
      });

      router.push('/survey/thankyou');
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    if (questionIdx < QUESTIONS.length - 1) {
      setQuestionIdx(questionIdx + 1);
    } else {
      handleNext();
    }
  };

  if (showSignpost) {
    return (
      <>
        <ProgressBar progress={0.95} />
        <SignpostScreen
          text={SIGNPOST_TEXTS.before_block8}
          onContinue={() => setShowSignpost(false)}
        />
      </>
    );
  }

  if (!currentQ) {
    return (
      <>
        <ProgressBar progress={1.0} />
        <div className="p-6 sm:p-8 text-center text-gray-500">Loading...</div>
      </>
    );
  }

  const progress = 0.95 + (questionIdx / QUESTIONS.length) * 0.05;

  return (
    <>
      <ProgressBar progress={progress} />
      <div className="p-6 sm:p-8">
        <p className="text-xs text-gray-400 mb-4">
          Question {questionIdx + 1} of {QUESTIONS.length} (optional)
        </p>

        <QuestionWrapper
          questionText={currentQ.questionText}
          error={error}
        >
          <SingleSelect
            options={currentQ.options}
            value={currentValue}
            onChange={(v) => {
              setAnswers({ ...answers, [currentQ.key]: v as number });
              if (error) setError('');
            }}
          />

          {/* Ethnicity "Other" text */}
          {currentQ.hasOtherText && currentValue === 6 && (
            <div className="mt-3">
              <input
                type="text"
                value={otherText}
                onChange={(e) => setOtherText(e.target.value)}
                placeholder="Please specify..."
                className="w-full p-2.5 border border-gray-300 rounded-lg text-sm
                  focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
          )}
        </QuestionWrapper>

        <div className="flex gap-3">
          <button
            onClick={handleSkip}
            className="btn-secondary flex-1"
          >
            Skip
          </button>
          <button
            onClick={handleNext}
            disabled={loading}
            className="btn-primary flex-1"
          >
            {loading ? 'Saving...' : questionIdx < QUESTIONS.length - 1 ? 'Continue' : 'Finish'}
          </button>
        </div>
      </div>
    </>
  );
}
