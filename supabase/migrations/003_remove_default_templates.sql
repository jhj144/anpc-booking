-- 기본 제공 템플릿 제거: 이제 관리자별 커스텀 템플릿만 사용
-- Supabase Studio > SQL Editor에 붙여넣고 실행하세요.

delete from message_templates where admin_id is null;

alter table message_templates alter column admin_id set not null;
alter table message_templates drop column if exists is_default;

drop policy if exists "message_templates_select_own_or_system" on message_templates;
drop policy if exists "message_templates_insert_own" on message_templates;
drop policy if exists "message_templates_update_own" on message_templates;
drop policy if exists "message_templates_delete_own" on message_templates;

create policy "message_templates_owner_all"
  on message_templates for all
  using (admin_id = auth.uid())
  with check (admin_id = auth.uid());
