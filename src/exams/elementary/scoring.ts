// 國小學力檢測成績單（原 Transcript-Export-System）計分邏輯。
// 逐行移植自原 App.tsx 的 ReportCard，計算方式與顯示順序維持原樣。
import { examData, abilityDescriptions, Subject, Grade, QuestionData } from "./data";

export const EL_SUBJECTS: { key: Subject; name: string }[] = [
  { key: "math", name: "數學科" },
  { key: "english", name: "英文科" },
  { key: "chinese", name: "國文科" },
];
export const EL_GRADES: { key: Grade; name: string }[] = [
  { key: "4", name: "四年級" },
  { key: "5", name: "五年級" },
  { key: "6", name: "六年級" },
];

export function elQuestions(grade: string, subject: string): QuestionData[] {
  return examData[subject as Subject]?.[grade as Grade] ?? [];
}

export interface ElResult {
  score: number;
  correctCount: number;
  total: number;
  radarData: { subject: string; A: number }[];
  abilityRows: { ability: string; description: string }[];
  barData: { name: string; correctRate: number; incorrectRate: number; correctCount: number; incorrectCount: number }[];
}

export function analyzeElementary(grade: string, subject: string, answers: string[]): ElResult {
  const currentExam = elQuestions(grade, subject);
  const ans = (id: number) => answers[id - 1];

  let correctCount = 0;
  currentExam.forEach(q => { if (ans(q.id) === q.answer) correctCount++; });
  const score = Math.round((correctCount / currentExam.length) * 100);

  const abilityStats: Record<string, { total: number; correct: number }> = {};
  currentExam.forEach(q => {
    const isCorrect = ans(q.id) === q.answer;
    q.abilities.forEach(ability => {
      if (!abilityStats[ability]) abilityStats[ability] = { total: 0, correct: 0 };
      abilityStats[ability].total++;
      if (isCorrect) abilityStats[ability].correct++;
    });
  });
  const radarData = Object.keys(abilityStats).map(ability => ({
    subject: ability,
    A: Math.round((abilityStats[ability].correct / abilityStats[ability].total) * 100),
  }));

  const scopeStats: Record<string, { total: number; correct: number; incorrect: number }> = {};
  currentExam.forEach(q => {
    const isCorrect = ans(q.id) === q.answer;
    if (!scopeStats[q.scope]) scopeStats[q.scope] = { total: 0, correct: 0, incorrect: 0 };
    scopeStats[q.scope].total++;
    if (isCorrect) scopeStats[q.scope].correct++;
    else scopeStats[q.scope].incorrect++;
  });
  const barData = Object.keys(scopeStats).map(scope => {
    const stat = scopeStats[scope];
    return {
      name: scope,
      correctRate: Math.round((stat.correct / stat.total) * 100),
      incorrectRate: Math.round((stat.incorrect / stat.total) * 100),
      correctCount: stat.correct,
      incorrectCount: stat.incorrect,
    };
  });

  return {
    score, correctCount, total: currentExam.length, radarData,
    abilityRows: Object.keys(abilityStats).map(a => ({ ability: a, description: abilityDescriptions[a] || "無說明" })),
    barData,
  };
}
