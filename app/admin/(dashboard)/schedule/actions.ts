"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/supabase/dal";
import { createClient } from "@/lib/supabase/server";
import { eachDateInRange, dayOfWeek } from "@/lib/dates";

const DAY_COUNT = 7;

export async function addAvailableRule(formData: FormData) {
  const user = await requireAdmin();
  const supabase = await createClient();

  const rangeStartDate = String(formData.get("range_start_date") ?? "");
  const rangeEndDate = String(formData.get("range_end_date") ?? "");
  const startTime = String(formData.get("start_time") ?? "");
  const endTime = String(formData.get("end_time") ?? "");

  if (!rangeStartDate || !rangeEndDate || rangeStartDate > rangeEndDate) return;
  if (!startTime || !endTime || startTime >= endTime) return;

  const days: number[] = [];
  for (let day = 0; day < DAY_COUNT; day++) {
    if (formData.get(`day-${day}`) === "on") days.push(day);
  }
  if (days.length === 0) return;

  const rows = days.map((day) => ({
    admin_id: user.id,
    day_of_week: day,
    start_time: startTime,
    end_time: endTime,
    range_start_date: rangeStartDate,
    range_end_date: rangeEndDate,
  }));

  await supabase.from("available_rules").insert(rows);

  revalidatePath("/admin/schedule");
}

export async function deleteAvailableRule(id: string) {
  const user = await requireAdmin();
  const supabase = await createClient();

  await supabase.from("available_rules").delete().eq("id", id).eq("admin_id", user.id);

  revalidatePath("/admin/schedule");
}

export async function addBlockedRange(formData: FormData) {
  const user = await requireAdmin();
  const supabase = await createClient();

  const rangeStartDate = String(formData.get("range_start_date") ?? "");
  const rangeEndDate = String(formData.get("range_end_date") ?? "");
  const startTime = String(formData.get("start_time") ?? "");
  const endTime = String(formData.get("end_time") ?? "");
  const reason = String(formData.get("reason") ?? "").trim() || null;

  if (!rangeStartDate || !rangeEndDate || rangeStartDate > rangeEndDate) return;
  if (!startTime || !endTime || startTime >= endTime) return;

  const days = new Set<number>();
  for (let day = 0; day < DAY_COUNT; day++) {
    if (formData.get(`day-${day}`) === "on") days.add(day);
  }
  if (days.size === 0) return;

  const rows = eachDateInRange(rangeStartDate, rangeEndDate)
    .filter((date) => days.has(dayOfWeek(date)))
    .map((date) => ({
      admin_id: user.id,
      block_date: date,
      is_full_day: false,
      start_time: startTime,
      end_time: endTime,
      reason,
    }));

  if (rows.length === 0) return;

  await supabase.from("blocked_slots").insert(rows);

  revalidatePath("/admin/schedule");
}

export async function deleteBlockedSlot(id: string) {
  const user = await requireAdmin();
  const supabase = await createClient();

  await supabase.from("blocked_slots").delete().eq("id", id).eq("admin_id", user.id);

  revalidatePath("/admin/schedule");
}
