"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/supabase/dal";
import { createClient } from "@/lib/supabase/server";

export async function saveNotificationSettings(formData: FormData) {
  const user = await requireAdmin();
  const supabase = await createClient();

  const discordEnabled = formData.get("discord_enabled") === "on";
  const discordWebhookUrl = String(formData.get("discord_webhook_url") ?? "").trim() || null;
  const emailEnabled = formData.get("email_enabled") === "on";
  const notificationEmail = String(formData.get("notification_email") ?? "").trim() || null;

  await supabase.from("notification_settings").upsert({
    admin_id: user.id,
    discord_enabled: discordEnabled,
    discord_webhook_url: discordWebhookUrl,
    email_enabled: emailEnabled,
    notification_email: notificationEmail,
    updated_at: new Date().toISOString(),
  });

  revalidatePath("/admin/notifications");
}
