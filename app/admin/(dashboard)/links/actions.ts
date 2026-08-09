"use server";

import { nanoid } from "nanoid";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/supabase/dal";
import { createClient } from "@/lib/supabase/server";

export type LinkFormState = { error: string } | undefined;

interface ParsedLinkValue {
  name: string;
  duration_minutes: number;
  range_start_date: string;
  range_end_date: string;
  template_id: string | null;
}

type ParseLinkFormResult = { error: string; value?: undefined } | { error?: undefined; value: ParsedLinkValue };

function parseLinkForm(formData: FormData): ParseLinkFormResult {
  const name = String(formData.get("name") ?? "").trim();
  const durationMinutes = Number(formData.get("duration_minutes"));
  const rangeStartDate = String(formData.get("range_start_date") ?? "");
  const rangeEndDate = String(formData.get("range_end_date") ?? "");
  const templateIdRaw = String(formData.get("template_id") ?? "");

  if (!name) return { error: "예약 이름을 입력해주세요." };
  if (!durationMinutes || durationMinutes <= 0) {
    return { error: "예약 진행 시간을 입력해주세요." };
  }
  if (!rangeStartDate || !rangeEndDate || rangeStartDate > rangeEndDate) {
    return { error: "선택 가능 기간을 올바르게 입력해주세요." };
  }

  return {
    value: {
      name,
      duration_minutes: durationMinutes,
      range_start_date: rangeStartDate,
      range_end_date: rangeEndDate,
      template_id: templateIdRaw || null,
    },
  };
}

export async function createBookingLink(
  _prevState: LinkFormState,
  formData: FormData
): Promise<LinkFormState> {
  const user = await requireAdmin();
  const parsed = parseLinkForm(formData);
  if (parsed.error) return { error: parsed.error };

  const supabase = await createClient();
  const slug = nanoid(10);

  const { data, error } = await supabase
    .from("booking_links")
    .insert({ admin_id: user.id, slug, ...parsed.value })
    .select("id")
    .single();

  if (error || !data) {
    return { error: "예약 링크 생성 중 문제가 발생했습니다." };
  }

  revalidatePath("/admin");
  redirect(`/admin/links/${data.id}`);
}

export async function updateBookingLink(
  id: string,
  _prevState: LinkFormState,
  formData: FormData
): Promise<LinkFormState> {
  const user = await requireAdmin();
  const parsed = parseLinkForm(formData);
  if (parsed.error) return { error: parsed.error };

  const supabase = await createClient();
  const { error } = await supabase
    .from("booking_links")
    .update({ ...parsed.value, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("admin_id", user.id);

  if (error) {
    return { error: "예약 링크 수정 중 문제가 발생했습니다." };
  }

  revalidatePath("/admin");
  revalidatePath(`/admin/links/${id}`);
  redirect(`/admin/links/${id}`);
}

export async function toggleBookingLinkStatus(id: string, nextStatus: "active" | "archived") {
  const user = await requireAdmin();
  const supabase = await createClient();

  await supabase
    .from("booking_links")
    .update({ status: nextStatus, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("admin_id", user.id);

  revalidatePath("/admin");
  revalidatePath(`/admin/links/${id}`);
}

export async function deleteBookingLink(id: string) {
  const user = await requireAdmin();
  const supabase = await createClient();

  await supabase.from("booking_links").delete().eq("id", id).eq("admin_id", user.id);

  revalidatePath("/admin");
  redirect("/admin");
}

export async function deleteBookingLinks(ids: string[]) {
  if (ids.length === 0) return;

  const user = await requireAdmin();
  const supabase = await createClient();

  await supabase.from("booking_links").delete().in("id", ids).eq("admin_id", user.id);

  revalidatePath("/admin");
}

export async function cancelBooking(linkId: string, bookingId: string) {
  const user = await requireAdmin();
  const supabase = await createClient();

  await supabase
    .from("bookings")
    .update({ status: "cancelled", cancelled_at: new Date().toISOString() })
    .eq("id", bookingId)
    .eq("admin_id", user.id);

  revalidatePath(`/admin/links/${linkId}`);
}
