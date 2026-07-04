export type Subject = "國文" | "英文" | "數學" | "自然";
export type WeekKey = "W1" | "W2" | "W3" | "W4" | "W5";

export const SUBJECTS: Subject[] = ["國文", "英文", "數學", "自然"];
export const WEEKS: WeekKey[] = ["W1", "W2", "W3", "W4", "W5"];
export const WEEK_ZH = ["一", "二", "三", "四", "五"];

export interface IndicatorData {
  indicators: string[];
  weeks: Record<WeekKey, string[]>;
}

export type IndicatorDB = Record<Subject, IndicatorData>;

export interface IndicatorScore {
  indicator: string;
  correct: number;
  total: number;
  percent: number;
}
