-- 미팅방법 필드 제거 (booking_links.meeting_method / meeting_method_detail)
-- Supabase Studio > SQL Editor에 붙여넣고 실행하세요.

alter table booking_links drop column if exists meeting_method;
alter table booking_links drop column if exists meeting_method_detail;
