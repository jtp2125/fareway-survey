'use client';

import { useState, useEffect } from 'react';

interface RankItem {
  value: string;
  label: string;
}

interface RankingQuestionProps {
  items: RankItem[];
  maxRank?: number;
  value: string[];  // ordered array of ranked item values
  onChange: (ranked: string[]) => void;
}

export default function RankingQuestion({
  items,
  maxRank = 3,
  value,
  onChange,
}: RankingQuestionProps) {
  const [isMobile, setIsMobile] = useState(false);
  const [draggedItem, setDraggedItem] = useState<string | null>(null);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const getRank = (itemValue: string): number => {
    const idx = value.indexOf(itemValue);
    return idx === -1 ? 0 : idx + 1;
  };

  // Mobile: tap-to-rank
  const handleTap = (itemValue: string) => {
    const currentRank = getRank(itemValue);
    if (currentRank > 0) {
      // Remove this item
      onChange(value.filter((v) => v !== itemValue));
    } else if (value.length < maxRank) {
      // Add to next rank
      onChange([...value, itemValue]);
    }
  };

  // Desktop: drag-and-drop
  const handleDragStart = (itemValue: string) => {
    setDraggedItem(itemValue);
  };

  const handleDrop = (slotIndex: number) => {
    if (!draggedItem) return;

    const newValue = [...value.filter((v) => v !== draggedItem)];
    newValue.splice(slotIndex, 0, draggedItem);
    // Trim to maxRank
    onChange(newValue.slice(0, maxRank));
    setDraggedItem(null);
  };

  const handleRemoveRank = (itemValue: string) => {
    onChange(value.filter((v) => v !== itemValue));
  };

  const unrankedItems = items.filter((item) => !value.includes(item.value));

  if (isMobile) {
    // Mobile: tap-to-rank interface
    return (
      <div>
        <p className="text-xs text-gray-500 mb-3">
          Tap to rank (tap again to deselect). Rank up to {maxRank}.
        </p>
        <div className="flex flex-col gap-2">
          {items.map((item) => {
            const rank = getRank(item.value);
            return (
              <button
                key={item.value}
                type="button"
                onClick={() => handleTap(item.value)}
                className={`flex items-center gap-3 p-3 rounded-lg border-2 transition-all text-left
                  ${rank > 0
                    ? 'border-primary bg-blue-50'
                    : value.length >= maxRank
                      ? 'border-gray-200 opacity-50 cursor-not-allowed'
                      : 'border-gray-200 hover:border-primary'
                  }`}
                disabled={rank === 0 && value.length >= maxRank}
              >
                <span
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0
                    ${rank > 0 ? 'bg-primary text-white' : 'bg-gray-200 text-gray-400'}`}
                >
                  {rank > 0 ? rank : '-'}
                </span>
                <span className="text-sm text-gray-700">{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // Desktop: drag-and-drop
  return (
    <div>
      <p className="text-xs text-gray-500 mb-3">
        Drag items from left to the ranked slots on the right, or click to add/remove.
      </p>
      <div className="grid grid-cols-2 gap-6">
        {/* Available items */}
        <div>
          <h4 className="text-sm font-medium text-gray-500 mb-2">Available</h4>
          <div className="flex flex-col gap-2 min-h-[100px] p-3 bg-gray-50 rounded-lg">
            {unrankedItems.length === 0 && (
              <p className="text-xs text-gray-400 text-center py-4">All items ranked</p>
            )}
            {unrankedItems.map((item) => (
              <div
                key={item.value}
                draggable
                onDragStart={() => handleDragStart(item.value)}
                onClick={() => {
                  if (value.length < maxRank) {
                    onChange([...value, item.value]);
                  }
                }}
                className="flex items-center gap-2 p-2.5 bg-white rounded-lg border border-gray-200
                           cursor-grab active:cursor-grabbing hover:border-primary hover:shadow-sm transition-all"
              >
                <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M7 2a2 2 0 10.001 4.001A2 2 0 007 2zm0 6a2 2 0 10.001 4.001A2 2 0 007 8zm0 6a2 2 0 10.001 4.001A2 2 0 007 14zm6-8a2 2 0 10-.001-4.001A2 2 0 0013 6zm0 2a2 2 0 10.001 4.001A2 2 0 0013 8zm0 6a2 2 0 10.001 4.001A2 2 0 0013 14z" />
                </svg>
                <span className="text-sm text-gray-700">{item.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Ranked slots */}
        <div>
          <h4 className="text-sm font-medium text-gray-500 mb-2">Your Ranking</h4>
          <div className="flex flex-col gap-2">
            {Array.from({ length: maxRank }, (_, i) => {
              const rankedValue = value[i];
              const rankedItem = rankedValue
                ? items.find((item) => item.value === rankedValue)
                : null;

              return (
                <div
                  key={i}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => handleDrop(i)}
                  className={`flex items-center gap-2 p-2.5 rounded-lg border-2 min-h-[44px] transition-all
                    ${rankedItem
                      ? 'border-primary bg-blue-50'
                      : 'border-dashed border-gray-300 bg-gray-50'
                    }`}
                >
                  <span className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0
                    ${rankedItem ? 'bg-primary text-white' : 'bg-gray-200 text-gray-400'}`}
                  >
                    {i + 1}
                  </span>
                  {rankedItem ? (
                    <>
                      <span className="text-sm text-gray-700 flex-1">{rankedItem.label}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveRank(rankedValue)}
                        className="text-gray-400 hover:text-error p-1"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </>
                  ) : (
                    <span className="text-xs text-gray-400">Drop here or click from left</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
