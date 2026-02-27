'use client';

import { useRouter } from 'next/navigation';
import ProgressBar from '@/components/survey/ProgressBar';

export default function ConsentPage() {
  const router = useRouter();

  return (
    <>
      <ProgressBar progress={0} />
      <div className="p-6 sm:p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">
          Grocery Shopping Survey
        </h1>

        <div className="space-y-4 text-gray-600 text-sm leading-relaxed">
          <p>
            Thank you for agreeing to participate in this research study about grocery 
            shopping habits and preferences. Your feedback will help us understand how 
            consumers make decisions about where to shop for groceries.
          </p>

          <p>
            This survey will take approximately <strong>8–12 minutes</strong> to complete. 
            Your responses are confidential and will be reported only in aggregate — 
            no individual responses will be shared.
          </p>

          <p>
            Your participation is voluntary. You may stop at any time, though we hope 
            you&apos;ll complete the full survey so we can include your valuable perspective 
            in our research.
          </p>

          <div className="bg-gray-50 rounded-lg p-4 mt-6">
            <p className="text-xs text-gray-500">
              By clicking &quot;Begin Survey&quot; below, you confirm that you are at least 18 years old, 
              you consent to participate in this research, and you understand that your responses 
              will be used for research purposes only.
            </p>
          </div>
        </div>

        <div className="mt-8">
          <button
            onClick={() => router.push('/survey/block1/s1')}
            className="btn-primary w-full sm:w-auto"
          >
            Begin Survey
          </button>
        </div>
      </div>
    </>
  );
}
