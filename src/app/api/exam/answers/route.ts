import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { logActivity } from "@/lib/activityLog";
import { getModule, validateAnswers } from "@/exams/spec";

// 整合測驗模組的作答（exam_answers），與 FIVE 的 report_answers 完全分開。
export async function GET(req: NextRequest) {
  const p = req.nextUrl.searchParams;
  const mod = p.get("module"), exam = p.get("exam"), branch = p.get("branch"), student = p.get("student");
  const spec = getModule(mod);
  if (!spec || !exam || !spec.exams.some(e => e.key === exam) || !branch) {
    return NextResponse.json({ error: "missing/invalid module, exam or branch" }, { status: 400 });
  }

  // Supabase 單次查詢最多回傳 1000 筆，依主鍵排序分頁讀到沒有資料為止
  const data: Record<string, unknown>[] = [];
  for (;;) {
    let query = supabaseAdmin
      .from("exam_answers")
      .select("student, subject, answers, extra")
      .eq("module", mod).eq("exam", exam).eq("branch", branch);
    if (student) query = query.eq("student", student);
    const { data: page, error } = await query
      .order("student").order("subject")
      .range(data.length, data.length + 999);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    if (!page || page.length === 0) break;
    data.push(...page);
  }
  return NextResponse.json({ rows: data });
}

export async function POST(req: NextRequest) {
  const { module: mod, exam, branch, student, subject, answers, extra } = await req.json();
  const userAgent = req.headers.get("user-agent");
  const spec = getModule(mod);
  const input = spec && typeof exam === "string" && typeof subject === "string" ? spec.input(exam, subject) : null;

  let bad: string | null = null;
  if (!spec || !input || !branch || !student) bad = "missing/invalid fields";
  else bad = validateAnswers(input, answers, extra);

  const total = Array.isArray(answers) ? answers.length : 0;
  if (bad) {
    await logActivity({ branch, student, action: "exam_save_answer", ok: false, detail: { module: mod, exam, subject, total, error: bad }, userAgent });
    return NextResponse.json({ error: bad }, { status: 400 });
  }

  // 確保學生存在於名冊；已存在時不覆寫學校／日期等資料
  await supabaseAdmin.from("exam_students").upsert(
    { module: mod, exam, branch, student, info: {} },
    { onConflict: "module,exam,branch,student", ignoreDuplicates: true },
  );

  const cleanExtra = input!.nonChoice ? { nonChoice: extra.nonChoice } : {};
  const { error } = await supabaseAdmin
    .from("exam_answers")
    .upsert(
      { module: mod, exam, branch, student, subject, answers, extra: cleanExtra, updated_at: new Date().toISOString() },
      { onConflict: "module,exam,branch,student,subject" },
    );

  if (error) {
    await logActivity({ branch, student, action: "exam_save_answer", ok: false, detail: { module: mod, exam, subject, total, error: error.message }, userAgent });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  await logActivity({ branch, student, action: "exam_save_answer", ok: true, detail: { module: mod, exam, subject, total }, userAgent });
  return NextResponse.json({ ok: true });
}
