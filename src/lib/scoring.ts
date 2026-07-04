import { IndicatorScore } from "./types";

export function calcScores(
  indicatorsForWeek: string[],
  correctFlags: boolean[]
): IndicatorScore[] {
  const map = new Map<string, { correct: number; total: number }>();
  indicatorsForWeek.forEach((indicator, i) => {
    const entry = map.get(indicator) ?? { correct: 0, total: 0 };
    entry.total += 1;
    if (correctFlags[i]) entry.correct += 1;
    map.set(indicator, entry);
  });
  return Array.from(map.entries()).map(([indicator, { correct, total }]) => ({
    indicator, correct, total,
    percent: total === 0 ? 0 : Math.round((correct / total) * 100),
  }));
}

// Each week has its own indicator list; merge across all filled weeks
export function calcAggregateScores(
  weekIndicators: string[][],       // [W1indicators, W2indicators, ...]
  weekAnswers: (boolean[] | null)[] // [W1answers, W2answers, ...]
): IndicatorScore[] {
  const map = new Map<string, { correct: number; total: number }>();
  weekAnswers.forEach((answers, wi) => {
    if (!answers) return;
    const indicators = weekIndicators[wi] ?? [];
    answers.forEach((correct, i) => {
      const ind = indicators[i];
      if (!ind) return;
      const entry = map.get(ind) ?? { correct: 0, total: 0 };
      entry.total += 1;
      if (correct) entry.correct += 1;
      map.set(ind, entry);
    });
  });
  return Array.from(map.entries()).map(([indicator, { correct, total }]) => ({
    indicator, correct, total,
    percent: total === 0 ? 0 : Math.round((correct / total) * 100),
  }));
}
