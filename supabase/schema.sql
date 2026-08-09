-- ANPC 예약 페이지 - Supabase 스키마
-- Supabase Studio > SQL Editor에 그대로 붙여넣고 실행하세요.
-- 실행 순서: 이 파일 실행 -> Authentication에서 관리자 계정 1개 수동 생성 -> 앱 배포

create extension if not exists "pgcrypto"; -- gen_random_uuid() 사용

-- =========================================================
-- 1) profiles: auth.users 부가정보 (배포본당 1행)
-- =========================================================
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default 'ANPC 관리자',
  created_at timestamptz not null default now()
);

alter table profiles enable row level security;

create policy "profiles_owner_all"
  on profiles for all
  using (id = auth.uid())
  with check (id = auth.uid());

-- 신규 관리자 가입(Auth 사용자 생성) 시 profiles 행 자동 생성
create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id) values (new.id);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- =========================================================
-- 2) available_rules: 가능시간 설정 (마스터 캘린더, 기본은 전부 닫혀있음)
--    관리자가 기간+요일+시간대로 명시적으로 연 시간만 예약 가능해진다.
-- =========================================================
create table available_rules (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid not null references auth.users(id) on delete cascade,
  day_of_week smallint not null check (day_of_week between 0 and 6), -- 0=일 ~ 6=토
  start_time time not null,
  end_time time not null,
  range_start_date date not null,
  range_end_date date not null,
  created_at timestamptz not null default now(),
  check (start_time < end_time),
  check (range_start_date <= range_end_date)
);

create index available_rules_admin_date_idx on available_rules (admin_id, range_start_date, range_end_date);

alter table available_rules enable row level security;

create policy "available_rules_owner_all"
  on available_rules for all
  using (admin_id = auth.uid())
  with check (admin_id = auth.uid());

-- =========================================================
-- 3) blocked_slots: 불가능시간 설정 (이미 열어둔 가능시간 중 공휴일/연차/개인 일정 등을 다시 막음)
-- =========================================================
create table blocked_slots (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid not null references auth.users(id) on delete cascade,
  block_date date not null,
  is_full_day boolean not null default true,
  start_time time, -- is_full_day = false 일 때만 사용
  end_time time,
  reason text,
  created_at timestamptz not null default now(),
  check (
    (is_full_day = true and start_time is null and end_time is null)
    or (is_full_day = false and start_time is not null and end_time is not null and start_time < end_time)
  )
);

create index blocked_slots_admin_date_idx on blocked_slots (admin_id, block_date);

alter table blocked_slots enable row level security;

create policy "blocked_slots_owner_all"
  on blocked_slots for all
  using (admin_id = auth.uid())
  with check (admin_id = auth.uid());

-- =========================================================
-- 4) message_templates: 관리자별 커스텀 안내 메시지 템플릿
-- =========================================================
create table message_templates (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  body text not null, -- {날짜} {시간} 플레이스홀더 지원
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index message_templates_admin_idx on message_templates (admin_id);

alter table message_templates enable row level security;

create policy "message_templates_owner_all"
  on message_templates for all
  using (admin_id = auth.uid())
  with check (admin_id = auth.uid());

-- =========================================================
-- 5) booking_links: 예약 페이지(링크)
-- =========================================================
create table booking_links (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid not null references auth.users(id) on delete cascade,
  slug text not null unique, -- 공개 URL: /book/[slug]
  name text not null,
  duration_minutes int not null check (duration_minutes > 0),
  range_start_date date not null,
  range_end_date date not null,
  template_id uuid references message_templates(id) on delete set null,
  status text not null default 'active' check (status in ('active', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (range_start_date <= range_end_date)
);

create index booking_links_admin_status_idx on booking_links (admin_id, status);

alter table booking_links enable row level security;

create policy "booking_links_owner_all"
  on booking_links for all
  using (admin_id = auth.uid())
  with check (admin_id = auth.uid());

-- =========================================================
-- 6) bookings: 실제 예약 건
-- =========================================================
create table bookings (
  id uuid primary key default gen_random_uuid(),
  booking_link_id uuid not null references booking_links(id) on delete cascade,
  admin_id uuid not null references auth.users(id) on delete cascade, -- 비정규화: 마스터캘린더 단위 충돌검사/RLS용
  booking_date date not null,
  start_time time not null,
  end_time time not null,
  status text not null default 'confirmed' check (status in ('confirmed', 'cancelled')),
  cancelled_at timestamptz,
  created_at timestamptz not null default now()
);

create index bookings_admin_date_idx on bookings (admin_id, booking_date);
create index bookings_link_idx on bookings (booking_link_id);

-- 슬롯 재오픈의 핵심: "confirmed" 상태에 대해서만 admin_id+날짜+시작시간 유일성 강제.
-- 취소(status='cancelled')되면 이 인덱스 대상에서 빠지므로 동일 시간이 즉시 재예약 가능해짐.
create unique index bookings_unique_active_slot
  on bookings (admin_id, booking_date, start_time)
  where status = 'confirmed';

alter table bookings enable row level security;

-- 관리자는 자신의 예약만 조회/수정(취소) 가능. 삽입은 공개 예약 플로우 전용
-- Service Role 클라이언트(RLS 우회, 서버 전용)로만 수행하므로 anon insert 정책은 만들지 않는다.
create policy "bookings_owner_select"
  on bookings for select
  using (admin_id = auth.uid());

create policy "bookings_owner_update"
  on bookings for update
  using (admin_id = auth.uid())
  with check (admin_id = auth.uid());

-- =========================================================
-- 7) notification_settings: 알림 채널 설정 (배포본당 1행)
-- =========================================================
create table notification_settings (
  admin_id uuid primary key references auth.users(id) on delete cascade,
  discord_enabled boolean not null default false,
  discord_webhook_url text,
  email_enabled boolean not null default false,
  notification_email text, -- 하이웍스 등 알림 수신 이메일 주소
  updated_at timestamptz not null default now()
);

alter table notification_settings enable row level security;

create policy "notification_settings_owner_all"
  on notification_settings for all
  using (admin_id = auth.uid())
  with check (admin_id = auth.uid());
