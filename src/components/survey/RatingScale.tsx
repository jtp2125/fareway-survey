'use client';

interface RatingScaleProps {
  value: number | null;
  onChange: (value: number) => void;
  labels: { value: number; label: string }[];
}

export default function RatingScale({ value, onChange, labels }: RatingScaleProps) {
  return (
    <div className="flex gap-2">
      {labels.map((item) => (
        <button
          key={item.value}
          type="button"
          onClick={() => onChange(item.value)}
          className={`flex-1 py-2.5 px-1 rounded-lg text-xs sm:text-sm font-medium
                      transition-all border-2 text-center leading-tight
                      ${value === item.value
                        ? 'bg-primary text-white border-primary'
                        : 'bg-white text-gray-600 border-gray-200 hover:border-primary hover:bg-primary-light'
                      }`}
          title={item.label}
        >
          {item.value}
        </button>
      ))}
    </div>
  );
}
