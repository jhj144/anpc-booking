import { requireAdmin } from "@/lib/supabase/dal";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/Card";
import { ScheduleCalendarPanel } from "@/components/admin/ScheduleCalendarPanel";
import { formatDateLabel, normalizeTime } from "@/lib/dates";
import { addAvailableRule, deleteAvailableRule, addBlockedRange, deleteBlockedSlot } from "./actions";

const WEEKDAY_LABELS = ["일", "월", "화", "수", "목", "금", "토"];

export default async function SchedulePage() {
  const user = await requireAdmin();
  const supabase = await createClient();

  const [{ data: availableRules }, { data: blockedSlots }] = await Promise.all([
    supabase
      .from("available_rules")
      .select("id, day_of_week, start_time, end_time, range_start_date, range_end_date")
      .eq("admin_id", user.id)
      .order("range_start_date", { ascending: true }),
    supabase
      .from("blocked_slots")
      .select("id, block_date, is_full_day, start_time, end_time, reason")
      .eq("admin_id", user.id)
      .order("block_date", { ascending: true }),
  ]);

  return (
    <div className="space-y-8">
      <section>
        <h2 className="mb-1 text-lg font-semibold text-navy">일정 관리</h2>
        <p className="mb-3 text-sm text-gray-500">
          기본적으로 모든 시간은 예약 불가 상태입니다. 날짜(범위)를 먼저 고른 뒤, 가능시간으로
          열거나 불가능시간으로 막으세요.
        </p>
        <Card className="mb-6">
          <ScheduleCalendarPanel onAddAvailable={addAvailableRule} onAddBlocked={addBlockedRange} />
        </Card>
      </section>

      <section>
        <h3 className="mb-3 text-sm font-semibold text-navy">등록된 가능시간</h3>
        {!availableRules || availableRules.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-gray-400">
            등록된 가능시간이 없습니다. 위에서 먼저 열어주세요.
          </p>
        ) : (
          <div className="space-y-2">
            {availableRules.map((rule) => (
              <Card key={rule.id} className="flex items-center justify-between py-3">
                <p className="text-sm text-navy">
                  {formatDateLabel(rule.range_start_date)} ~ {formatDateLabel(rule.range_end_date)} ·{" "}
                  {WEEKDAY_LABELS[rule.day_of_week]} · {normalizeTime(rule.start_time)} ~{" "}
                  {normalizeTime(rule.end_time)}
                </p>
                <form action={deleteAvailableRule.bind(null, rule.id)}>
                  <button type="submit" className="text-xs text-gray-400 hover:text-red-600">
                    삭제
                  </button>
                </form>
              </Card>
            ))}
          </div>
        )}
      </section>

      <section>
        <h3 className="mb-3 text-sm font-semibold text-navy">등록된 불가능시간</h3>
        {!blockedSlots || blockedSlots.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-gray-400">
            등록된 불가능시간이 없습니다.
          </p>
        ) : (
          <div className="space-y-2">
            {blockedSlots.map((block) => (
              <Card key={block.id} className="flex items-center justify-between py-3">
                <div>
                  <p className="text-sm font-medium text-navy">
                    {formatDateLabel(block.block_date)}{" "}
                    {block.is_full_day
                      ? "· 하루 종일"
                      : `· ${normalizeTime(block.start_time!)} ~ ${normalizeTime(block.end_time!)}`}
                  </p>
                  {block.reason && <p className="mt-0.5 text-xs text-gray-400">{block.reason}</p>}
                </div>
                <form action={deleteBlockedSlot.bind(null, block.id)}>
                  <button type="submit" className="text-xs text-gray-400 hover:text-red-600">
                    삭제
                  </button>
                </form>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
