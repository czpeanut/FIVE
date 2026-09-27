// 國中模考成績單（原 test-output-sys）計分邏輯。
// 逐行移植自原 script.js 的 getLevel / getBackgroundColor / getGradeBand / analyzeAndGenerateReport，
// 計算方式、排序、評語文字皆維持原樣，請勿「順手」修正，差異需經行政端確認後才改。
import rawData from "./data.json";

export interface JmQuestion { id: number; correct: string; skill: string[] | string; weight: number }
export interface JmSubjectData { maxScore?: number; skills: string[]; questions: JmQuestion[] }
type Thresholds = Record<string, number>;
interface BandCfg {
  mode?: string;
  thresholds?: Thresholds;
  nonChoiceBands?: Record<string, Thresholds>;
  [band: string]: unknown;
}
type ExamData = { gradeBands?: Record<string, BandCfg> } & Record<string, JmSubjectData | Record<string, BandCfg> | undefined>;

export const JM_DATA = rawData as unknown as Record<string, ExamData>;

export const JM_EXAMS: string[] = Object.keys(JM_DATA);

export function jmSubjects(exam: string): string[] {
  return Object.keys(JM_DATA[exam] ?? {}).filter(k => k !== "gradeBands");
}

export function jmSubjectData(exam: string, subject: string): JmSubjectData | null {
  if (subject === "gradeBands") return null;
  return (JM_DATA[exam]?.[subject] as JmSubjectData | undefined) ?? null;
}

export type JmLevel = "精通" | "熟練" | "待加強";

// 熟練度標籤（知識點用）
export function getLevel(percentage: number): JmLevel {
  if (percentage >= 80) return "精通";
  if (percentage >= 60) return "熟練";
  return "待加強";
}

// 知識點百分比對應的淺色背景（熱力感）
export function getBackgroundColor(percentage: number): string {
  const hue = Math.round((percentage / 100) * 120); // 0=紅, 120=綠
  return `hsla(${hue}, 90%, 45%, 0.20)`;
}

export function getGradeBand(
  studentGrade: string, subjectName: string, correctCount: number, totalScore: number, nonChoiceScore: number | null,
): string {
  const order = ["A++", "A+", "A", "B++", "B+", "B"];

  // ---- 1) 優先：讀取「該測驗」的級距設定 ----
  const cfg = JM_DATA?.[studentGrade]?.gradeBands?.[subjectName];
  if (cfg) {
    const mode = (typeof cfg.mode === "string") ? cfg.mode : "correct";
    let thresholds: Thresholds | undefined = cfg.thresholds ? cfg.thresholds : (cfg as unknown as Thresholds);
    let v = (mode === "score") ? Number(totalScore) : Number(correctCount);

    if (mode === "nonChoiceCorrect") {
      if (!Number.isInteger(nonChoiceScore)) return "—";
      thresholds = cfg.nonChoiceBands?.[String(nonChoiceScore)];
      v = Number(correctCount);
    }

    if (!thresholds || !Number.isFinite(v)) return "—";

    for (const band of order) {
      const minVal = Number(thresholds[band]);
      if (Number.isFinite(minVal) && v >= minVal) return band;
    }
    return "C";
  }

  // ---- 2) 相容舊版：quizData 未設定 gradeBands 時的寫死規則 ----
  if (subjectName === "國文") {
    if (correctCount >= 41) return "A++";
    if (correctCount === 39 || correctCount === 40) return "A+";
    if (correctCount >= 36) return "A";
    if (correctCount >= 32) return "B++";
    if (correctCount >= 28) return "B+";
    if (correctCount >= 18) return "B";
    return "C";
  }
  if (subjectName === "英文") {
    if (correctCount >= 42) return "A++";
    if (correctCount === 41) return "A+";
    if (correctCount >= 38) return "A";
    if (correctCount >= 33) return "B++";
    if (correctCount >= 28) return "B+";
    if (correctCount >= 22) return "B";
    return "C";
  }
  if (subjectName === "自然") {
    if (correctCount >= 48) return "A++";
    if (correctCount === 47) return "A+";
    if (correctCount >= 44) return "A";
    if (correctCount >= 37) return "B++";
    if (correctCount >= 28) return "B+";
    if (correctCount >= 19) return "B";
    return "C";
  }
  if (subjectName === "社會") {
    if (correctCount >= 52) return "A++";
    if (correctCount >= 50) return "A+";
    if (correctCount >= 47) return "A";
    if (correctCount >= 41) return "B++";
    if (correctCount >= 34) return "B+";
    if (correctCount >= 21) return "B";
    return "C";
  }
  if (subjectName === "數學") {
    if (correctCount >= 24) return "A++";
    if (correctCount === 23) return "A+";
    if (correctCount >= 21) return "A";
    if (correctCount >= 17) return "B++";
    if (correctCount >= 13) return "B+";
    if (correctCount >= 9) return "B";
    return "C";
  }
  return "—";
}

export interface JmSkillRow { name: string; percentage: number; level: JmLevel }
export interface JmResult {
  correctCount: number;
  totalScore: number;
  totalItems: number;
  skills: JmSkillRow[];
  gradeBand: string;
  message: string;
}

export function analyzeJuniorMock(
  exam: string, subjectName: string, answers: string[], nonChoiceScore: number | null,
): JmResult | null {
  const quizData = jmSubjectData(exam, subjectName);
  if (!quizData) return null;

  // 原程式把每格輸入串成一個字串再依索引取值（需全部作答才可產生報告）
  const studentAnswers = answers.map(a => (a || "").trim().toUpperCase()).join("");

  let totalScore = 0;
  let correctCount = 0;
  const skillScores: Record<string, number> = {};
  const skillMaxScores: Record<string, number> = {};
  quizData.skills.forEach(s => { skillScores[s] = 0; skillMaxScores[s] = 0; });

  quizData.questions.forEach((q, i) => {
    const ans = studentAnswers[i];
    const skills = q.skill as string[];
    const perSkill = q.weight / skills.length;
    if (ans === q.correct) {
      totalScore += q.weight;
      correctCount += 1;
      skills.forEach(s => { skillScores[s] += perSkill; });
    }
    skills.forEach(s => { skillMaxScores[s] += perSkill; });
  });

  const skills = quizData.skills.map(s => {
    const score = skillScores[s] || 0;
    const max   = skillMaxScores[s] || 1;
    const pct   = Math.round((score / max) * 100);
    return { name: s, percentage: pct, level: getLevel(pct) };
  }).sort((a, b) => a.name.localeCompare(b.name, "zh-Hant"));

  const gradeBand = getGradeBand(exam, subjectName, correctCount, totalScore, nonChoiceScore);

  const strong = skills.filter(s => s.percentage >= 80).map(s => s.name);
  const weak   = skills.filter(s => s.percentage < 60).map(s => s.name);
  let msg = `本次 ${subjectName} 答對 ${correctCount} 題`;
  if (subjectName === "數學") msg += `，非選題得分 ${nonChoiceScore} 分`;
  msg += `，等級為 ${gradeBand}。`;
  if (strong.length) msg += ` 表現較佳：${strong.join("、")}。`;
  if (weak.length)   msg += ` 建議優先加強：${weak.join("、")}。`;
  if (!weak.length)  msg += ` 各知識點掌握度均達及格以上，建議持續維持練習以鞏固實力。`;

  return { correctCount, totalScore, totalItems: quizData.questions.length, skills, gradeBand, message: msg };
}
