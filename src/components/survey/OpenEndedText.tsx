'use client';

interface OpenEndedTextProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minChars?: number;
  maxChars?: number;
}

export default function OpenEndedText({
  value,
  onChange,
  placeholder = 'Please type your response here...',
  minChars = 5,
  maxChars = 500,
}: OpenEndedTextProps) {
  const charCount = value.length;
  const isUnderMin = charCount > 0 && charCount < minChars;

  return (
    <div>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value.slice(0, maxChars))}
        placeholder={placeholder}
        rows={4}
        className="w-full p-3 border border-gray-300 rounded-lg text-base resize-y
                   focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent
                   placeholder:text-gray-400"
      />
      <div className="flex justify-between mt-1">
        {isUnderMin ? (
          <span className="text-xs text-error">
            Please provide at least {minChars} characters.
          </span>
        ) : (
          <span />
        )}
        <span className={`text-xs ${charCount >= maxChars ? 'text-error' : 'text-gray-400'}`}>
          {charCount}/{maxChars}
        </span>
      </div>
    </div>
  );
}
