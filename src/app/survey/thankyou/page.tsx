'use client';

import { useEffect } from 'react';

export default function ThankYouPage() {
  useEffect(() => {
    // Complete the survey
    const rid = sessionStorage.getItem('respondent_id');
    if (rid) {
      fetch('/api/survey/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ respondent_id: rid }),
      });
      // Clear session
      sessionStorage.removeItem('respondent_id');
      sessionStorage.removeItem('phase');
    }
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center p-8">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-8 h-8 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          Thank you!
        </h1>
        <p className="text-gray-600 mb-2">
          Your responses have been recorded. We truly appreciate you taking the time 
          to share your grocery shopping experiences with us.
        </p>
        <p className="text-gray-500 text-sm mt-6">
          You may now close this window.
        </p>
      </div>
    </div>
  );
}
