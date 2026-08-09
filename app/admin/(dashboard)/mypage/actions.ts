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

  revalidatePath("/admin/mypage");
}

export type ChangePasswordState = { error: string } | { success: true } | undefined;

export async function changePassword(
  _prevState: ChangePasswordState,
  formData: FormData
): Promise<ChangePasswordState> {
  const password = String(formData.get("password") ?? "");
  const passwordConfirm = String(formData.get("password_confirm") ?? "");

  if (password.length < 6) {
    return { error: "비밀번호는 6자 이상이어야 합니다." };
  }
  if (password !== passwordConfirm) {
    return { error: "비밀번호가 서로 일치하지 않습니다." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    return { error: error.message === "New password should be different from the old password."
      ? "기존 비밀번호와 다른 비밀번호를 입력해주세요."
      : "비밀번호 변경 중 문제가 발생했습니다." };
  }

  return { success: true };
}
