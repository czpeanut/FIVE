import { supabaseAdmin } from "./supabaseAdmin";

export async function logActivity(entry: {
  branch?: string | null;
  student?: string | null;
  action: string;
  ok?: boolean;
  detail?: Record<string, unknown>;
  userAgent?: string | null;
}): Promise<void> {
  try {
    await supabaseAdmin.from("report_activity_log").insert({
      branch: entry.branch ?? null,
      student: entry.student ?? null,
      action: entry.action,
      ok: entry.ok ?? true,
      detail: entry.detail ?? null,
      user_agent: entry.userAgent ?? null,
    });
  } catch {
    // 記錄本身失敗不應影響主流程
  }
}
