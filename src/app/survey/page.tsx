'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function SurveyEntryContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const rid = searchParams.get('rid');
    const src = searchParams.get('src') || 'direct';
    const phase = searchParams.get('phase') || '1';

    if (!rid) {
      setError('Missing respondent ID. Please use the survey link provided to you.');
      return;
    }

    // Initialize respondent record
    async function init() {
      try {
        const res = await fetch('/api/survey/init', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ rid, src, phase: parseInt(phase) }),
        });

        const data = await res.json();

        if (!res.ok) {
          if (data.error === 'duplicate') {
            setError('It looks like you have already started or completed this survey. Thank you for your time.');
            return;
          }
          setError(data.error || 'Something went wrong. Please try again.');
          return;
        }

        // Store respondent_id in sessionStorage for subsequent pages
        sessionStorage.setItem('respondent_id', rid!);
        sessionStorage.setItem('phase', phase);

        // Navigate to consent
        router.push('/survey/consent');
      } catch {
        setError('Unable to connect. Please check your internet connection and try again.');
      }
    }

    init();
  }, [searchParams, router]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8">
        <div className="text-center max-w-md">
          <p className="text-gray-600 text-lg">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-500">Loading survey...</p>
      </div>
    </div>
  );
}

export default function SurveyEntry() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <SurveyEntryContent />
    </Suspense>
  );
}
