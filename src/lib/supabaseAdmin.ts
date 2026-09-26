import { createClient } from "@supabase/supabase-js";

// 僅供 API 路由（伺服器端）使用，service role 會繞過 RLS，絕不可暴露給前端。
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);
