'use client';

interface Option {
  value: number | string;
  label: string;
  exclusive?: boolean; // "None of the above" type option
}

interface MultiSelectProps {
  options: Option[];
  values: (number | string)[];
  onChange: (values: (number | string)[]) => void;
  maxSelections?: number;
}

export default function MultiSelect({ options, values, onChange, maxSelections }: MultiSelectProps) {
  const handleToggle = (option: Option) => {
    if (option.exclusive) {
      // If exclusive option clicked, clear others and toggle this one
      if (values.includes(option.value)) {
        onChange([]);
      } else {
        onChange([option.value]);
      }
      return;
    }

    // If clicking a non-exclusive option, remove any exclusive options
    const nonExclusiveValues = values.filter(v => {
      const opt = options.find(o => o.value === v);
      return !opt?.exclusive;
    });

    if (nonExclusiveValues.includes(option.value)) {
      onChange(nonExclusiveValues.filter(v => v !== option.value));
    } else {
      if (maxSelections && nonExclusiveValues.length >= maxSelections) return;
      onChange([...nonExclusiveValues, option.value]);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      {options.map((option) => {
        const isSelected = values.includes(option.value);
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => handleToggle(option)}
            className={`checkbox-option ${isSelected ? 'selected' : ''}`}
          >
            <span className={`w-5 h-5 rounded border-2 flex-shrink-0 flex items-center justify-center
              ${isSelected ? 'border-primary bg-primary' : 'border-gray-300'}`}
            >
              {isSelected && (
                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              )}
            </span>
            <span className="text-sm text-gray-700 text-left">{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}
