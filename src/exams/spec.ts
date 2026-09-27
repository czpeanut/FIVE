// 整合進來的測驗模組規格（前端頁面與 API 驗證共用，不含 React）。
// FIVE（/report）不經過這裡，維持原本的程式碼路徑。
import { JM_EXAMS, jmSubjects, jmSubjectData } from "./junior-mock/scoring";
import { EL_GRADES, EL_SUBJECTS, elQuestions } from "./elementary/scoring";
import { EB_EXAMS, EB_SUBJECTS, EB_QUESTION_COUNT } from "./elementary-basic/scoring";
import { menuItem } from "./menu";

export type ModuleId = "junior-mock" | "elementary" | "elementary-basic";

export interface Option { key: string; name: string }

export interface InputSpec {
  kind: "letter" | "bool";
  count: number;
  letters?: string;            // kind=letter 時可輸入的選項
  hints?: string[];            // 每題滑鼠提示（原系統顯示的知識點）
  nonChoice?: { label: string; min: number; max: number }; // 國中模考數學非選題得分
}

export interface StudentField { key: "school" | "examDate"; label: string; placeholder: string; required: boolean }

export interface ModuleSpec {
  id: ModuleId;
  no: string;
  title: string;
  desc: string[];
  examLabel: string;            // 「測驗項目」或「年級」
  exams: Option[];
  subjects: (exam: string) => Option[];
  input: (exam: string, subject: string) => InputSpec | null;
  studentFields: StudentField[];
}

export const MODULES: Record<ModuleId, ModuleSpec> = {
  "junior-mock": {
    id: "junior-mock",
    no: menuItem("junior-mock").no,
    title: menuItem("junior-mock").title,
    desc: [...menuItem("junior-mock").desc],
    examLabel: "測驗項目",
    exams: JM_EXAMS.map(e => ({ key: e, name: e })),
    subjects: exam => jmSubjects(exam).map(s => ({ key: s, name: s })),
    input: (exam, subject) => {
      const d = jmSubjectData(exam, subject);
      if (!d) return null;
      return {
        kind: "letter", count: d.questions.length, letters: "ABCDE",
        hints: d.questions.map(q => (Array.isArray(q.skill) ? q.skill.join(" / ") : String(q.skill || ""))),
        nonChoice: subject === "數學" ? { label: "非選題得分", min: 0, max: 6 } : undefined,
      };
    },
    studentFields: [{ key: "school", label: "學校", placeholder: "XX國中", required: true }],
  },
  "elementary": {
    id: "elementary",
    no: menuItem("elementary").no,
    title: menuItem("elementary").title,
    desc: [...menuItem("elementary").desc],
    examLabel: "年級",
    exams: EL_GRADES.map(g => ({ key: g.key, name: g.name })),
    subjects: () => EL_SUBJECTS.map(s => ({ key: s.key, name: s.name })),
    input: (exam, subject) => {
      const qs = elQuestions(exam, subject);
      if (qs.length === 0) return null;
      return { kind: "letter", count: qs.length, letters: "ABCD", hints: qs.map(q => q.scope) };
    },
    studentFields: [{ key: "examDate", label: "測驗日期", placeholder: "", required: true }],
  },
  "elementary-basic": {
    id: "elementary-basic",
    no: menuItem("elementary-basic").no,
    title: menuItem("elementary-basic").title,
    desc: [...menuItem("elementary-basic").desc],
    examLabel: "考卷",
    exams: EB_EXAMS,
    subjects: () => EB_SUBJECTS.map(s => ({ key: s, name: s })),
    input: (exam, subject) => {
      if (!EB_EXAMS.some(e => e.key === exam) || !(EB_SUBJECTS as readonly string[]).includes(subject)) return null;
      return { kind: "bool", count: EB_QUESTION_COUNT };
    },
    studentFields: [
      { key: "school", label: "就讀小學", placeholder: "XX國小", required: false },
      { key: "examDate", label: "應試日期", placeholder: "", required: true },
    ],
  },
};

export const MODULE_IDS = Object.keys(MODULES) as ModuleId[];

export function getModule(id: string | null | undefined): ModuleSpec | null {
  return id && id in MODULES ? MODULES[id as ModuleId] : null;
}

export type Answers = string[] | boolean[];
export interface Extra { nonChoice?: number }
export interface StudentInfo { school?: string; examDate?: string }

// 伺服器端與前端共用的作答格式檢查；回傳錯誤訊息或 null
export function validateAnswers(spec: InputSpec, answers: unknown, extra: Extra | null | undefined): string | null {
  if (!Array.isArray(answers) || answers.length !== spec.count) return `作答題數不符（應為 ${spec.count} 題）`;
  if (spec.kind === "bool") {
    if (!answers.every(a => typeof a === "boolean")) return "作答格式錯誤";
  } else {
    const letters = spec.letters ?? "";
    const missing = answers.findIndex(a => typeof a !== "string" || a.length !== 1 || !letters.includes(a));
    if (missing >= 0) return `第 ${missing + 1} 題尚未作答或不是 ${letters.split("").join("/")}`;
  }
  if (spec.nonChoice) {
    const v = extra?.nonChoice;
    if (typeof v !== "number" || !Number.isInteger(v) || v < spec.nonChoice.min || v > spec.nonChoice.max) {
      return `請輸入${spec.nonChoice.label}（${spec.nonChoice.min}～${spec.nonChoice.max} 的整數）`;
    }
  }
  return null;
}
