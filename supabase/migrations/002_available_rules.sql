-- 가능시간을 "요일별 무한 반복" 방식에서 "기간이 지정된 규칙" 방식으로 전환
-- (기본은 전부 닫혀있고, 관리자가 명시적으로 연 시간만 예약 가능)
-- Supabase Studio > SQL Editor에 붙여넣고 실행하세요.

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

-- 기존 요일별 고정 시간표(무한 반복)를 오늘부터 180일간 유효한 규칙으로 이전
insert into available_rules (admin_id, day_of_week, start_time, end_time, range_start_date, range_end_date)
select admin_id, day_of_week, start_time, end_time, current_date, current_date + interval '180 days'
from weekly_schedule
where is_active = true;

drop table weekly_schedule;
