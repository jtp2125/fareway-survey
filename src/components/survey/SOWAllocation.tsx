'use client';

import { useState, useEffect } from 'react';

interface Store {
  code: string;
  label: string;
}

interface SOWAllocationProps {
  stores: Store[];
  values: Record<string, number>;
  onChange: (values: Record<string, number>) => void;
}

export default function SOWAllocation({ stores, values, onChange }: SOWAllocationProps) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const total = Object.values(values).reduce((sum, v) => sum + (v || 0), 0);
  const isValid = total === 100;

  const handleChange = (code: string, val: number) => {
    const clamped = Math.max(0, Math.min(100, isNaN(val) ? 0 : val));
    onChange({ ...values, [code]: clamped });
  };

  return (
    <div>
      {/* Running total bar */}
      <div className="mb-6 sticky top-0 bg-white py-3 z-10">
        <div className="flex justify-between text-sm mb-1">
          <span className="font-medium text-gray-700">Total allocated</span>
          <span className={`font-bold ${isValid ? 'text-success' : total > 100 ? 'text-error' : 'text-gray-600'}`}>
            {total}%
          </span>
        </div>
        <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-300 rounded-full ${
              isValid ? 'bg-success' : total > 100 ? 'bg-error' : 'bg-primary'
            }`}
            style={{ width: `${Math.min(total, 100)}%` }}
          />
        </div>
        {total !== 100 && total > 0 && (
          <p className="text-xs text-gray-500 mt-1">
            {total < 100 ? `${100 - total}% remaining` : `${total - 100}% over — please adjust`}
          </p>
        )}
      </div>

      {/* Store inputs */}
      <div className="flex flex-col gap-4">
        {stores.map((store) => (
          <div key={store.code} className="border border-gray-200 rounded-lg p-4">
            <label className="text-sm font-medium text-gray-700 mb-2 block">
              {store.label}
            </label>
            <div className="flex items-center gap-3">
              {!isMobile && (
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={values[store.code] || 0}
                  onChange={(e) => handleChange(store.code, parseInt(e.target.value))}
                  className="flex-1 h-2 accent-primary"
                />
              )}
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  inputMode="numeric"
                  min={0}
                  max={100}
                  value={values[store.code] || 0}
                  onChange={(e) => handleChange(store.code, parseInt(e.target.value))}
                  className={`w-16 h-10 text-center border rounded-lg text-sm font-medium
                    focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent
                    ${isMobile ? 'w-full' : ''}`}
                />
                <span className="text-sm text-gray-500">%</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
