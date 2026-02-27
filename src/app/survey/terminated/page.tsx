'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { TERMINATION_MESSAGES } from '@/lib/constants';

function TerminatedContent() {
  const searchParams = useSearchParams();
  const reason = searchParams.get('reason') || 'default';
  const message = TERMINATION_MESSAGES[reason] || TERMINATION_MESSAGES.default;

  return (
    <div className="min-h-screen flex items-center justify-center p-8">
      <div className="text-center max-w-md">
        <h1 className="text-xl font-semibold text-gray-900 mb-4">
          Thank You
        </h1>
        <p className="text-gray-600">{message}</p>
        <p className="text-gray-500 text-sm mt-6">
          You may now close this window.
        </p>
      </div>
    </div>
  );
}

export default function TerminatedPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><p>Loading...</p></div>}>
      <TerminatedContent />
    </Suspense>
  );
}
