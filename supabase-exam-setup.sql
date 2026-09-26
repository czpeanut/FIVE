-- 整合測驗模組（國中模考／國小學力檢測／國小學科能力檢測）雲端資料表
-- 與 FIVE 的 report_* 資料表完全獨立，不修改任何既有資料表。
-- 於 Supabase SQL Editor 執行一次即可（可重複執行）。

create table if not exists exam_students (
  module text not null,          -- junior-mock / elementary / elementary-basic
  exam text not null,            -- 測驗項目或年級（例：國三寒假模考、4、fileC）
  branch text not null,
  student text not null,
  info jsonb not null default '{}'::jsonb,   -- { school, examDate }
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (module, exam, branch, student)
);

create table if not exists exam_answers (
  module text not null,
  exam text not null,
  branch text not null,
  student text not null,
  subject text not null,
  answers jsonb not null,        -- 選項字母陣列（["A","C",...]）或對錯陣列（[true,false,...]）
  extra jsonb not null default '{}'::jsonb,  -- 例：數學非選題得分 { nonChoice: 4 }
  updated_at timestamptz not null default now(),
  primary key (module, exam, branch, student, subject)
);

create index if not exists exam_answers_scope_idx
  on exam_answers (module, exam, branch);

-- 全部僅透過 API 路由以 service role 存取，故啟用 RLS 但不建立任何 policy
alter table exam_students enable row level security;
alter table exam_answers enable row level security;

-- 操作記錄沿用既有的 report_activity_log（action 以 exam_ 開頭，detail 內含 module / exam）
