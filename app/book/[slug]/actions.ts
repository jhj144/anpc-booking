"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { addMinutesToTime, formatDateLabel } from "@/lib/dates";
import { sendBookingNotifications } from "@/lib/notifications";

export type CreateBookingResult =
  | { ok: true; date: string; time: string }
  | { ok: false; reason: "LINK_NOT_FOUND" | "SLOT_TAKEN" | "UNKNOWN" };

export async function createBooking(
  slug: string,
  bookingDate: string,
  startTime: string
): Promise<CreateBookingResult> {
  const supabase = createAdminClient();

  const { data: link, error: linkError } = await supabase
    .from("booking_links")
    .select("id, admin_id, name, duration_minutes, status")
    .eq("slug", slug)
    .maybeSingle();

  if (linkError || !link || link.status !== "active") {
    return { ok: false, reason: "LINK_NOT_FOUND" };
  }

  const endTime = addMinutesToTime(startTime, link.duration_minutes);

  const { error } = await supabase.from("bookings").insert({
    booking_link_id: link.id,
    admin_id: link.admin_id,
    booking_date: bookingDate,
    start_time: startTime,
    end_time: endTime,
    status: "confirmed",
  });

  if (error) {
    if (error.code === "23505") {
      return { ok: false, reason: "SLOT_TAKEN" };
    }
    return { ok: false, reason: "UNKNOWN" };
  }

  const { data: notificationSettings } = await supabase
    .from("notification_settings")
    .select("discord_enabled, discord_webhook_url, email_enabled, notification_email")
    .eq("admin_id", link.admin_id)
    .maybeSingle();

  if (notificationSettings) {
    await sendBookingNotifications({
      discordEnabled: notificationSettings.discord_enabled,
      discordWebhookUrl: notificationSettings.discord_webhook_url,
      emailEnabled: notificationSettings.email_enabled,
      notificationEmail: notificationSettings.notification_email,
      linkName: link.name,
      dateLabel: formatDateLabel(bookingDate),
      time: startTime,
    });
  }

  return { ok: true, date: bookingDate, time: startTime };
}
