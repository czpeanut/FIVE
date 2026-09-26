-- report-card 雲端資料表（獨立於 student-app 現有資料表，僅共用同一個 Supabase 專案）
-- 於 Supabase SQL Editor 執行一次即可

create table if not exists report_students (
  branch text not null,
  student text not null,
  created_at timestamptz not null default now(),
  primary key (branch, student)
);

create table if not exists report_answers (
  branch text not null,
  student text not null,
  subject text not null,
  week text not null,
  answers jsonb not null,
  updated_at timestamptz not null default now(),
  primary key (branch, student, subject, week)
);

create index if not exists report_answers_branch_student_idx
  on report_answers (branch, student);

-- 全部僅透過 API 路由以 service role 存取，故啟用 RLS 但不建立任何 policy（anon/authenticated 完全無法直接存取）
alter table report_students enable row level security;
alter table report_answers enable row level security;

-- 偵錯黑盒子：記錄所有登記/儲存操作，供事後依時間點回溯問題
create table if not exists report_activity_log (
  id bigserial primary key,
  created_at timestamptz not null default now(),
  branch text,
  student text,
  action text not null,       -- save_answer / add_student / remove_student ...
  ok boolean not null default true,
  detail jsonb,
  user_agent text
);

create index if not exists report_activity_log_created_at_idx
  on report_activity_log (created_at desc);
create index if not exists report_activity_log_branch_idx
  on report_activity_log (branch);

alter table report_activity_log enable row level security;
