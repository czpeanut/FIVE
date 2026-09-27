// 整合測驗模組的前端資料層（呼叫 /api/exam/*）。
import type { Answers, Extra, StudentInfo } from "./spec";

export interface StudentRow { student: string; info: StudentInfo }
export interface AnswerRow { student: string; subject: string; answers: Answers; extra: Extra }
// { [student]: { [subject]: AnswerRow } }
export type AnswerMap = Record<string, Record<string, AnswerRow>>;

async function readError(res: Response, fallback: string): Promise<string> {
  const data = await res.json().catch(() => ({}));
  return data.error ?? `${fallback}（HTTP ${res.status}）`;
}

export async function getStudents(module: string, exam: string, branch: string): Promise<StudentRow[]> {
  const q = new URLSearchParams({ module, exam, branch });
  const res = await fetch(`/api/exam/students?${q}`, { cache: "no-store" });
  if (!res.ok) throw new Error(await readError(res, "名冊載入失敗"));
  const data = await res.json();
  return data.students ?? [];
}

export async function saveStudent(module: string, exam: string, branch: string, student: string, info: StudentInfo): Promise<void> {
  const res = await fetch("/api/exam/students", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ module, exam, branch, student, info }),
  });
  if (!res.ok) throw new Error(await readError(res, "學生資料儲存失敗"));
}

export async function removeStudent(module: string, exam: string, branch: string, student: string): Promise<void> {
  const res = await fetch("/api/exam/students", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ module, exam, branch, student }),
  });
  if (!res.ok) throw new Error(await readError(res, "刪除失敗"));
}

export async function getAnswers(module: string, exam: string, branch: string, student?: string): Promise<AnswerMap> {
  const q = new URLSearchParams({ module, exam, branch });
  if (student) q.set("student", student);
  const res = await fetch(`/api/exam/answers?${q}`, { cache: "no-store" });
  if (!res.ok) throw new Error(await readError(res, "成績載入失敗"));
  const data = await res.json();
  const out: AnswerMap = {};
  for (const row of (data.rows ?? []) as AnswerRow[]) {
    (out[row.student] ??= {})[row.subject] = { ...row, extra: row.extra ?? {} };
  }
  return out;
}

export async function saveAnswers(
  module: string, exam: string, branch: string, student: string, subject: string, answers: Answers, extra: Extra,
): Promise<void> {
  let res: Response;
  try {
    res = await fetch("/api/exam/answers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ module, exam, branch, student, subject, answers, extra }),
    });
  } catch (networkErr) {
    // 請求沒送達伺服器（離線／斷線），用 beacon 在黑盒子補記一筆
    try {
      const body = JSON.stringify({
        branch, student, action: "exam_save_answer_client_error",
        detail: { module, exam, subject, error: String(networkErr) },
      });
      navigator.sendBeacon?.("/api/report/log", new Blob([body], { type: "application/json" }));
    } catch { /* best-effort */ }
    throw new Error("網路連線失敗，請檢查網路後重試");
  }
  if (!res.ok) throw new Error(await readError(res, "儲存失敗"));
}
