-- HAMO MVP 초기 스키마 + RLS 정책
-- 게스트 모드는 localStorage 기반이며, 이 스키마는 Google 로그인 사용자와
-- 공유 스냅샷(share_snapshots, 익명)을 위한 것이다.

-- ---------------------------------------------------------------- profiles

create table if not exists profiles (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid null references auth.users(id) on delete cascade,
  display_name text not null default '',
  user_type text not null default 'guest', -- 'senior' | 'caregiver' | 'guest'
  birth_year int null,
  age_range text null,
  gender text null,
  is_guest boolean not null default false,
  guest_id text null, -- 게스트 → 계정 전환 시 연결용
  created_at timestamptz not null default now()
);

create unique index if not exists profiles_auth_user_id_idx
  on profiles(auth_user_id) where auth_user_id is not null;

-- ------------------------------------------------------------ user_concerns

create table if not exists user_concerns (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  concern_fall boolean not null default false,
  concern_strength boolean not null default false,
  concern_balance boolean not null default false,
  concern_walking boolean not null default false,
  concern_exercise boolean not null default false,
  concern_parent_status boolean not null default false,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------- consents

create table if not exists consents (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  privacy_required boolean not null,
  health_notice_required boolean not null,
  anonymous_stats_required boolean not null default false,
  marketing_optional boolean not null default false,
  raw_landmark_optional boolean not null default false,
  created_at timestamptz not null default now()
);

-- ------------------------------------------------------------- assessments

create table if not exists assessments (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  assessment_type text not null, -- 'sit_to_stand_30s'
  status text not null default 'completed', -- 'completed' | 'failed' | 'cancelled'
  started_at timestamptz null,
  completed_at timestamptz null,
  duration_sec int null,
  device_type text null,
  browser text null,
  camera_facing text null, -- 'user' | 'environment' | 'unknown'
  analyzer_version text null,
  created_at timestamptz not null default now()
);

create index if not exists assessments_profile_idx
  on assessments(profile_id, completed_at desc);

-- ------------------------------------------------------ assessment_results

create table if not exists assessment_results (
  id uuid primary key default gen_random_uuid(),
  assessment_id uuid not null references assessments(id) on delete cascade,
  rep_count int not null default 0,
  avg_rep_time_sec numeric null,
  valid_frame_ratio numeric not null default 0,
  avg_fps numeric not null default 0,
  tracking_lost_count int not null default 0,
  quality_score int not null default 0,
  quality_level text not null default 'retry', -- 'high' | 'medium' | 'low' | 'retry'
  result_level text not null default 'retry',  -- 'good' | 'normal' | 'caution' | 'retry'
  stability_score int null,
  asymmetry_score int null,
  result_summary text not null default '',
  recommendation_json jsonb null,
  created_at timestamptz not null default now()
);

create index if not exists assessment_results_assessment_idx
  on assessment_results(assessment_id);

-- --------------------------------------------------------------- daily_logs

create table if not exists daily_logs (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  log_date date not null, -- 기기 로컬 날짜 기준 (클라이언트에서 계산)
  completed boolean not null default false,
  assessment_id uuid null references assessments(id) on delete set null,
  streak_count int not null default 0, -- 참고용 (실제 streak은 클라이언트에서 날짜 목록으로 계산)
  created_at timestamptz not null default now(),
  unique(profile_id, log_date)
);

-- ----------------------------------------------------- reminder_preferences

create table if not exists reminder_preferences (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  preferred_time text null,
  enabled boolean not null default false,
  created_at timestamptz not null default now(),
  unique(profile_id)
);

-- ------------------------------------------------------------- report_views

create table if not exists report_views (
  id uuid primary key default gen_random_uuid(),
  assessment_id uuid not null references assessments(id) on delete cascade,
  viewed_at timestamptz not null default now(),
  shared_channel text null
);

-- ---------------------------------------------------------- share_snapshots
-- 가족 공유용 요약 스냅샷 (게스트·로그인 공통).
-- 개인정보 최소화: 결과 요약과 표시 이름만 저장하며 profile과 연결하지 않는다.

create table if not exists share_snapshots (
  id uuid primary key default gen_random_uuid(),
  share_token text not null unique,
  rep_count int not null default 0,
  result_level text not null default 'retry',
  quality_level text not null default 'retry',
  result_summary text not null default '',
  display_name text not null default '부모님',
  measured_at timestamptz null,
  created_at timestamptz not null default now()
);

-- ============================================================ RLS 정책
-- 본인(auth.uid())이 소유한 profile에 연결된 데이터만 접근 가능

alter table profiles enable row level security;
alter table user_concerns enable row level security;
alter table consents enable row level security;
alter table assessments enable row level security;
alter table assessment_results enable row level security;
alter table daily_logs enable row level security;
alter table reminder_preferences enable row level security;
alter table report_views enable row level security;
alter table share_snapshots enable row level security;

-- profiles: 본인 행만
create policy "profiles_select_own" on profiles
  for select using (auth_user_id = auth.uid());
create policy "profiles_insert_own" on profiles
  for insert with check (auth_user_id = auth.uid());
create policy "profiles_update_own" on profiles
  for update using (auth_user_id = auth.uid());

-- 본인 profile 소유 여부 헬퍼
create or replace function owns_profile(p_profile_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from profiles
    where id = p_profile_id and auth_user_id = auth.uid()
  );
$$;

create policy "user_concerns_all_own" on user_concerns
  for all using (owns_profile(profile_id)) with check (owns_profile(profile_id));

create policy "consents_all_own" on consents
  for all using (owns_profile(profile_id)) with check (owns_profile(profile_id));

create policy "assessments_all_own" on assessments
  for all using (owns_profile(profile_id)) with check (owns_profile(profile_id));

-- assessment_results: 상위 assessment 소유자 기준
create or replace function owns_assessment(p_assessment_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from assessments a
    join profiles p on p.id = a.profile_id
    where a.id = p_assessment_id and p.auth_user_id = auth.uid()
  );
$$;

create policy "assessment_results_all_own" on assessment_results
  for all using (owns_assessment(assessment_id))
  with check (owns_assessment(assessment_id));

create policy "daily_logs_all_own" on daily_logs
  for all using (owns_profile(profile_id)) with check (owns_profile(profile_id));

create policy "reminder_preferences_all_own" on reminder_preferences
  for all using (owns_profile(profile_id)) with check (owns_profile(profile_id));

create policy "report_views_all_own" on report_views
  for all using (owns_assessment(assessment_id))
  with check (owns_assessment(assessment_id));

-- share_snapshots:
--  - 누구나(게스트 포함) insert 가능
--  - select 정책은 없음 → 토큰 기반 RPC(get_share_snapshot)로만 조회
create policy "share_snapshots_insert_any" on share_snapshots
  for insert to anon, authenticated with check (true);

create or replace function get_share_snapshot(p_token text)
returns table (
  share_token text,
  rep_count int,
  result_level text,
  quality_level text,
  result_summary text,
  display_name text,
  measured_at timestamptz
)
language sql
security definer
set search_path = public
stable
as $$
  select share_token, rep_count, result_level, quality_level,
         result_summary, display_name, measured_at
  from share_snapshots
  where share_token = p_token;
$$;

grant execute on function get_share_snapshot(text) to anon, authenticated;
