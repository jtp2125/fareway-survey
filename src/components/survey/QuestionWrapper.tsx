'use client';

import React from 'react';

interface QuestionWrapperProps {
  questionNumber?: string;
  questionText: string;
  subText?: string;
  error?: string;
  children: React.ReactNode;
}

export default function QuestionWrapper({
  questionNumber,
  questionText,
  subText,
  error,
  children,
}: QuestionWrapperProps) {
  return (
    <div className="mb-8">
      <div className="mb-4">
        {questionNumber && (
          <span className="text-sm font-medium text-gray-400 mb-1 block">
            {questionNumber}
          </span>
        )}
        <h2 className="text-lg font-medium text-gray-900 leading-snug">
          {questionText}
        </h2>
        {subText && (
          <p className="text-sm text-gray-500 mt-1">{subText}</p>
        )}
      </div>
      {children}
      {error && (
        <p className="mt-2 text-sm text-error font-medium">{error}</p>
      )}
    </div>
  );
}
