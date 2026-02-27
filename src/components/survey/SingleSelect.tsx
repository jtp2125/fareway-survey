'use client';

interface Option {
  value: number | string;
  label: string;
}

interface SingleSelectProps {
  options: Option[];
  value: number | string | null;
  onChange: (value: number | string) => void;
}

export default function SingleSelect({ options, value, onChange }: SingleSelectProps) {
  return (
    <div className="flex flex-col gap-2">
      {options.map((option) => {
        const isSelected = value === option.value;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={`radio-option ${isSelected ? 'selected' : ''}`}
          >
            <span className={`radio-dot ${isSelected ? 'selected' : ''}`} />
            <span className="text-sm text-gray-700 text-left">{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}
