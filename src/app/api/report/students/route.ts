import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { logActivity } from "@/lib/activityLog";

export async function GET(req: NextRequest) {
  const branch = req.nextUrl.searchParams.get("branch");
  if (!branch) return NextResponse.json({ error: "missing branch" }, { status: 400 });

  const { data, error } = await supabaseAdmin
    .from("report_students")
    .select("student")
    .eq("branch", branch)
    .order("student");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ students: (data ?? []).map(r => r.student) });
}

export async function POST(req: NextRequest) {
  const { branch, student } = await req.json();
  const userAgent = req.headers.get("user-agent");
  if (!branch || !student) return NextResponse.json({ error: "missing branch/student" }, { status: 400 });

  const { error } = await supabaseAdmin
    .from("report_students")
    .upsert({ branch, student }, { onConflict: "branch,student" });

  if (error) {
    await logActivity({ branch, student, action: "add_student", ok: false, detail: { error: error.message }, userAgent });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  await logActivity({ branch, student, action: "add_student", ok: true, userAgent });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const { branch, student } = await req.json();
  const userAgent = req.headers.get("user-agent");
  if (!branch || !student) return NextResponse.json({ error: "missing branch/student" }, { status: 400 });

  const { error: e1 } = await supabaseAdmin
    .from("report_answers").delete().eq("branch", branch).eq("student", student);
  if (e1) {
    await logActivity({ branch, student, action: "remove_student", ok: false, detail: { error: e1.message }, userAgent });
    return NextResponse.json({ error: e1.message }, { status: 500 });
  }

  const { error: e2 } = await supabaseAdmin
    .from("report_students").delete().eq("branch", branch).eq("student", student);
  if (e2) {
    await logActivity({ branch, student, action: "remove_student", ok: false, detail: { error: e2.message }, userAgent });
    return NextResponse.json({ error: e2.message }, { status: 500 });
  }

  await logActivity({ branch, student, action: "remove_student", ok: true, userAgent });
  return NextResponse.json({ ok: true });
}
