// 國小學科能力檢測成績單（原 Excel 活頁簿）計分邏輯。
// data.json 由 Excel「資料區」的公式自動解析而來；計算方式對應原公式：
//   知識點 = 指定題號答對數 / 題數（例：=(C4+D4+E4+N4+U4)/5）
//   分數   = 答對題數 × 5（=SUM(C4:V4)*5）
//   等級   = VLOOKUP(分數,{0,"C";45,"B";55,"B+";65,"B++";75,"A";85,"A+";95,"A++"},2,TRUE)
//   等級條 = 分數 >0、>=45、>=55、>=65、>=75、>=85、>=95 各一格
//   排名   = 2106-ROUND(2105*分數/100,)
import rawData from "./data.json";

export interface EbDimension { label: string; questions: number[] }
export interface EbSubjectData { dimensions: EbDimension[]; descriptions: { name: string; text: string }[]; section: string }
type EbData = Record<string, Record<string, EbSubjectData>>;
const DATA = rawData as unknown as EbData;

// 三份 Excel 分別是不同年級的考卷；卷 A / 卷 B 的年級待行政端確認後再改名稱即可（key 不要改，會影響已存資料）
export const EB_EXAMS: { key: string; name: string }[] = [
  { key: "fileA", name: "卷 A（年級待確認）" },
  { key: "fileC", name: "小五" },
  { key: "fileB", name: "卷 B（年級待確認）" },
];
export const EB_SUBJECTS = ["國文", "英文", "數學"] as const;
export const EB_QUESTION_COUNT = 20;
export const EB_CHART_TITLE: Record<string, string> = { 國文: "國語文能力", 英文: "英語文能力", 數學: "數學科能力" };

export function ebSubjectData(exam: string, subject: string): EbSubjectData | null {
  return DATA[exam]?.[subject] ?? null;
}

const BAND_TABLE: [number, string][] = [[0, "C"], [45, "B"], [55, "B+"], [65, "B++"], [75, "A"], [85, "A+"], [95, "A++"]];
const BAR_CELLS: ((s: number) => boolean)[] = [s => s > 0, s => s >= 45, s => s >= 55, s => s >= 65, s => s >= 75, s => s >= 85, s => s >= 95];

export interface EbResult {
  dimensions: { label: string; value: number }[]; // value 為 0~1，與 Excel 儲存格相同
  score: number;
  grade: string;
  bar: number[];
  rank: number;
}

export function analyzeBasic(exam: string, subject: string, answers: boolean[]): EbResult | null {
  const d = ebSubjectData(exam, subject);
  if (!d) return null;
  const v = (q: number) => (answers[q - 1] ? 1 : 0);
  const dimensions = d.dimensions.map(dim => ({
    label: dim.label,
    value: dim.questions.reduce((a, q) => a + v(q), 0) / dim.questions.length,
  }));
  let sum = 0;
  for (let q = 1; q <= EB_QUESTION_COUNT; q++) sum += v(q);
  const score = sum * 5;
  let grade = "C";
  for (const [min, g] of BAND_TABLE) if (score >= min) grade = g;
  const bar = BAR_CELLS.map(f => (f(score) ? 1 : 0));
  const rank = 2106 - Math.round((2105 * score) / 100);
  return { dimensions, score, grade, bar, rank };
}
