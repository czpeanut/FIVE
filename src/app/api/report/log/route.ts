import { NextRequest, NextResponse } from "next/server";
import { logActivity } from "@/lib/activityLog";

// 供前端在「連伺服器都連不上」（fetch 直接 throw，例如離線）時回報一筆，
// 這種情況下 /api/report/answers 從未送達，伺服器端不會留下記錄。
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body?.action) return NextResponse.json({ error: "missing action" }, { status: 400 });

  await logActivity({
    branch: body.branch ?? null,
    student: body.student ?? null,
    action: body.action,
    ok: false,
    detail: body.detail ?? null,
    userAgent: req.headers.get("user-agent"),
  });
  return NextResponse.json({ ok: true });
}
