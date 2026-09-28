import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { SUBJECTS, WEEKS } from "@/lib/types";
import { logActivity } from "@/lib/activityLog";

type StudentAnswers = Record<string, Record<string, boolean[] | null>>;

function emptyStudentAnswers(): StudentAnswers {
  const out: StudentAnswers = {};
  for (const s of SUBJECTS) {
    out[s] = {};
    for (const w of WEEKS) out[s][w] = null;
  }
  return out;
}

export async function GET(req: NextRequest) {
  const branch  = req.nextUrl.searchParams.get("branch");
  const student = req.nextUrl.searchParams.get("student");
  if (!branch) return NextResponse.json({ error: "missing branch" }, { status: 400 });

  // Supabase 單次查詢最多回傳 1000 筆（max-rows），整個分校的成績可能超過（例：85 人 × 4 科 × 5 週）。
  // 依主鍵排序後分頁讀到沒有資料為止，避免名冊少顯示已填的週次。
  type Row = { student: string; subject: string; week: string; answers: boolean[] };
  const data: Row[] = [];
  for (;;) {
    let query = supabaseAdmin
      .from("report_answers")
      .select("student, subject, week, answers")
      .eq("branch", branch);
    if (student) query = query.eq("student", student);
    const { data: page, error } = await query
      .order("student").order("subject").order("week")
      .range(data.length, data.length + 999);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    if (!page || page.length === 0) break;
    data.push(...(page as Row[]));
  }

  if (student) {
    const answers = emptyStudentAnswers();
    for (const row of data ?? []) {
      if (!answers[row.subject]) answers[row.subject] = {};
      answers[row.subject][row.week] = row.answers;
    }
    return NextResponse.json({ answers });
  }

  const answersByStudent: Record<string, StudentAnswers> = {};
  for (const row of data ?? []) {
    if (!answersByStudent[row.student]) answersByStudent[row.student] = emptyStudentAnswers();
    answersByStudent[row.student][row.subject][row.week] = row.answers;
  }
  return NextResponse.json({ answersByStudent });
}

export async function POST(req: NextRequest) {
  const { branch, student, subject, week, answers } = await req.json();
  const userAgent = req.headers.get("user-agent");
  if (!branch || !student || !subject || !week || !Array.isArray(answers)) {
    await logActivity({
      branch, student, action: "save_answer", ok: false,
      detail: { subject, week, error: "missing/invalid fields" }, userAgent,
    });
    return NextResponse.json({ error: "missing/invalid fields" }, { status: 400 });
  }

  // 確保學生存在於名冊（若尚未透過新增學生流程建立）
  await supabaseAdmin.from("report_students").upsert({ branch, student }, { onConflict: "branch,student" });

  const { error } = await supabaseAdmin
    .from("report_answers")
    .upsert(
      { branch, student, subject, week, answers, updated_at: new Date().toISOString() },
      { onConflict: "branch,student,subject,week" }
    );

  const correct = answers.filter(Boolean).length;
  if (error) {
    await logActivity({
      branch, student, action: "save_answer", ok: false,
      detail: { subject, week, correct, total: answers.length, error: error.message }, userAgent,
    });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await logActivity({
    branch, student, action: "save_answer", ok: true,
    detail: { subject, week, correct, total: answers.length }, userAgent,
  });
  return NextResponse.json({ ok: true });
}
