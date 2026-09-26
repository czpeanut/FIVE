import { SUBJECTS, WEEKS, Subject, WeekKey } from "./types";

// Shape: { [subject]: { [week]: boolean[] | null } }
export type WeekAnswers = boolean[] | null;
export type StudentAnswers = Record<Subject, Record<WeekKey, WeekAnswers>>;

export function emptyStudentAnswers(): StudentAnswers {
  const out = {} as StudentAnswers;
  for (const s of SUBJECTS) {
    out[s] = {} as Record<WeekKey, WeekAnswers>;
    for (const w of WEEKS) out[s][w] = null;
  }
  return out;
}

export async function getStudentList(branch: string): Promise<string[]> {
  const res = await fetch(`/api/report/students?branch=${encodeURIComponent(branch)}`);
  if (!res.ok) return [];
  const data = await res.json();
  return data.students ?? [];
}

export async function addStudent(branch: string, name: string): Promise<void> {
  await fetch("/api/report/students", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ branch, student: name }),
  });
}

export async function removeStudent(branch: string, name: string): Promise<void> {
  await fetch("/api/report/students", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ branch, student: name }),
  });
}

export async function getStudentAnswers(branch: string, name: string): Promise<StudentAnswers> {
  const res = await fetch(`/api/report/answers?branch=${encodeURIComponent(branch)}&student=${encodeURIComponent(name)}`);
  if (!res.ok) return emptyStudentAnswers();
  const data = await res.json();
  return data.answers ?? emptyStudentAnswers();
}

export async function getBranchAnswers(branch: string): Promise<Record<string, StudentAnswers>> {
  const res = await fetch(`/api/report/answers?branch=${encodeURIComponent(branch)}`);
  if (!res.ok) return {};
  const data = await res.json();
  return data.answersByStudent ?? {};
}

export async function saveAnswers(branch: string, name: string, subject: Subject, week: WeekKey, answers: boolean[]): Promise<void> {
  let res: Response;
  try {
    res = await fetch("/api/report/answers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ branch, student: name, subject, week, answers }),
    });
  } catch (networkErr) {
    // 請求根本沒送達伺服器（離線／斷線），伺服器端不會有記錄，用 beacon 補記一筆
    try {
      const body = JSON.stringify({
        branch, student: name, action: "save_answer_client_error",
        detail: { subject, week, error: String(networkErr) },
      });
      navigator.sendBeacon?.("/api/report/log", new Blob([body], { type: "application/json" }));
    } catch { /* best-effort */ }
    throw new Error("網路連線失敗，請檢查網路後重試");
  }
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error ?? `儲存失敗（HTTP ${res.status}）`);
  }
}

export function computeProgress(answers: StudentAnswers): Record<Subject, Record<WeekKey, boolean>> {
  const result = {} as Record<Subject, Record<WeekKey, boolean>>;
  for (const s of SUBJECTS) {
    result[s] = {} as Record<WeekKey, boolean>;
    for (const w of WEEKS) {
      result[s][w] = answers[s]?.[w] !== null && answers[s]?.[w] !== undefined;
    }
  }
  return result;
}

export function isComplete(answers: StudentAnswers): boolean {
  const prog = computeProgress(answers);
  return SUBJECTS.every(s => WEEKS.every(w => prog[s]?.[w]));
}
