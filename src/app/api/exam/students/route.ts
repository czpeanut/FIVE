import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { logActivity } from "@/lib/activityLog";
import { getModule } from "@/exams/spec";

// 整合測驗模組的名冊（exam_students），與 FIVE 的 report_students 完全分開。
function checkScope(module: unknown, exam: unknown, branch: unknown): string | null {
  const spec = getModule(typeof module === "string" ? module : null);
  if (!spec) return "unknown module";
  if (typeof exam !== "string" || !spec.exams.some(e => e.key === exam)) return "unknown exam";
  if (typeof branch !== "string" || !branch) return "missing branch";
  return null;
}

export async function GET(req: NextRequest) {
  const p = req.nextUrl.searchParams;
  const mod = p.get("module"), exam = p.get("exam"), branch = p.get("branch");
  const bad = checkScope(mod, exam, branch);
  if (bad) return NextResponse.json({ error: bad }, { status: 400 });

  const { data, error } = await supabaseAdmin
    .from("exam_students")
    .select("student, info")
    .eq("module", mod).eq("exam", exam).eq("branch", branch)
    .order("student");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ students: (data ?? []).map(r => ({ student: r.student, info: r.info ?? {} })) });
}

export async function POST(req: NextRequest) {
  const { module: mod, exam, branch, student, info } = await req.json();
  const userAgent = req.headers.get("user-agent");
  const bad = checkScope(mod, exam, branch) ?? (typeof student === "string" && student.trim() ? null : "missing student");
  if (bad) return NextResponse.json({ error: bad }, { status: 400 });

  const cleanInfo = {
    school: typeof info?.school === "string" ? info.school.trim() : "",
    examDate: typeof info?.examDate === "string" ? info.examDate.trim() : "",
  };
  const { error } = await supabaseAdmin
    .from("exam_students")
    .upsert({ module: mod, exam, branch, student, info: cleanInfo, updated_at: new Date().toISOString() }, { onConflict: "module,exam,branch,student" });

  if (error) {
    await logActivity({ branch, student, action: "exam_add_student", ok: false, detail: { module: mod, exam, error: error.message }, userAgent });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  await logActivity({ branch, student, action: "exam_add_student", ok: true, detail: { module: mod, exam }, userAgent });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const { module: mod, exam, branch, student } = await req.json();
  const userAgent = req.headers.get("user-agent");
  const bad = checkScope(mod, exam, branch) ?? (typeof student === "string" && student ? null : "missing student");
  if (bad) return NextResponse.json({ error: bad }, { status: 400 });

  const { error: e1 } = await supabaseAdmin
    .from("exam_answers").delete()
    .eq("module", mod).eq("exam", exam).eq("branch", branch).eq("student", student);
  if (e1) {
    await logActivity({ branch, student, action: "exam_remove_student", ok: false, detail: { module: mod, exam, error: e1.message }, userAgent });
    return NextResponse.json({ error: e1.message }, { status: 500 });
  }
  const { error: e2 } = await supabaseAdmin
    .from("exam_students").delete()
    .eq("module", mod).eq("exam", exam).eq("branch", branch).eq("student", student);
  if (e2) {
    await logActivity({ branch, student, action: "exam_remove_student", ok: false, detail: { module: mod, exam, error: e2.message }, userAgent });
    return NextResponse.json({ error: e2.message }, { status: 500 });
  }
  await logActivity({ branch, student, action: "exam_remove_student", ok: true, detail: { module: mod, exam }, userAgent });
  return NextResponse.json({ ok: true });
}
