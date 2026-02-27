'use client';

interface NPSScaleProps {
  value: number | null;
  onChange: (value: number) => void;
}

export default function NPSScale({ value, onChange }: NPSScaleProps) {
  return (
    <div>
      <div className="flex justify-between gap-1 sm:gap-2">
        {Array.from({ length: 11 }, (_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => onChange(i)}
            className={`flex-1 min-w-[36px] h-11 sm:h-12 rounded-lg font-semibold text-sm
                        transition-all border-2
                        ${value === i
                          ? 'bg-primary text-white border-primary'
                          : 'bg-white text-gray-600 border-gray-200 hover:border-primary hover:bg-primary-light'
                        }`}
          >
            {i}
          </button>
        ))}
      </div>
      <div className="flex justify-between mt-2">
        <span className="text-xs text-gray-500">Not at all likely</span>
        <span className="text-xs text-gray-500">Extremely likely</span>
      </div>
    </div>
  );
}
