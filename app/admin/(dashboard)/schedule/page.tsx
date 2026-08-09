import { requireAdmin } from "@/lib/supabase/dal";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { AvailableRuleForm } from "@/components/admin/AvailableRuleForm";
import { formatDateLabel, normalizeTime } from "@/lib/dates";
import {
  addAvailableRule,
  deleteAvailableRule,
  addBlockedSlot,
  deleteBlockedSlot,
} from "./actions";

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
        <h2 className="mb-1 text-lg font-semibold text-navy">가능시간 설정</h2>
        <p className="mb-3 text-sm text-gray-500">
          기본적으로 모든 시간은 예약 불가 상태이며, 아래에서 연 시간만 예약을 받을 수 있습니다.
        </p>
        <Card className="mb-4">
          <AvailableRuleForm action={addAvailableRule} />
        </Card>

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
        <h2 className="mb-1 text-lg font-semibold text-navy">불가능시간 설정</h2>
        <p className="mb-3 text-sm text-gray-500">
          이미 열어둔 가능시간 중 공휴일·연차 등 특정 날짜/시간을 다시 막습니다.
        </p>
        <Card className="mb-4">
          <form action={addBlockedSlot} className="space-y-3">
            <div className="flex flex-wrap items-end gap-3">
              <div>
                <label className="mb-1 block text-xs text-gray-500">날짜</label>
                <input
                  type="date"
                  name="block_date"
                  required
                  className="rounded-md border border-border px-2 py-1.5 text-sm outline-none focus:border-navy-300"
                />
              </div>
              <label className="mb-1.5 flex items-center gap-2 text-sm text-navy">
                <input
                  type="checkbox"
                  name="is_full_day"
                  defaultChecked
                  className="h-4 w-4 rounded border-border accent-navy"
                />
                하루 종일
              </label>
              <div>
                <label className="mb-1 block text-xs text-gray-500">시작</label>
                <input
                  type="time"
                  name="start_time"
                  className="rounded-md border border-border px-2 py-1.5 text-sm outline-none focus:border-navy-300"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-gray-500">종료</label>
                <input
                  type="time"
                  name="end_time"
                  className="rounded-md border border-border px-2 py-1.5 text-sm outline-none focus:border-navy-300"
                />
              </div>
              <div className="flex-1">
                <label className="mb-1 block text-xs text-gray-500">사유 (선택)</label>
                <input
                  type="text"
                  name="reason"
                  placeholder="예: 연차, 공휴일"
                  className="w-full rounded-md border border-border px-2 py-1.5 text-sm outline-none focus:border-navy-300"
                />
              </div>
            </div>
            <Button type="submit" variant="secondary">
              불가능시간 추가
            </Button>
          </form>
        </Card>

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
