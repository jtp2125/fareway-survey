/**
 * Randomize an array of items, keeping "anchored" items at the end.
 * Used for question option randomization (e.g., "Other" stays last).
 */
export interface RandomizableItem {
  anchored?: boolean;
  [key: string]: unknown;
}

export function randomizeWithAnchors<T extends RandomizableItem>(items: T[]): T[] {
  const anchored = items.filter(i => i.anchored);
  const randomizable = items.filter(i => !i.anchored);

  // Fisher-Yates shuffle
  for (let i = randomizable.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [randomizable[i], randomizable[j]] = [randomizable[j], randomizable[i]];
  }

  return [...randomizable, ...anchored];
}

/**
 * Simple Fisher-Yates shuffle (no anchors).
 */
export function shuffle<T>(arr: T[]): T[] {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
