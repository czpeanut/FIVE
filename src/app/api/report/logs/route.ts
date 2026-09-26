import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function GET(req: NextRequest) {
  const key = req.nextUrl.searchParams.get("key") ?? req.headers.get("x-log-key");
  const configuredKey = process.env.REPORT_LOG_KEY;
  if (!configuredKey) return NextResponse.json({ error: "REPORT_LOG_KEY 尚未設定" }, { status: 500 });
  if (key !== configuredKey) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const branch = req.nextUrl.searchParams.get("branch");
  const action = req.nextUrl.searchParams.get("action");
  const days   = Number(req.nextUrl.searchParams.get("days") ?? "14");
  const limit  = Math.min(Number(req.nextUrl.searchParams.get("limit") ?? "1000"), 2000);

  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

  let query = supabaseAdmin
    .from("report_activity_log")
    .select("id, created_at, branch, student, action, ok, detail, user_agent")
    .gte("created_at", since)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (branch) query = query.eq("branch", branch);
  if (action) query = query.eq("action", action);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ logs: data ?? [] });
}
