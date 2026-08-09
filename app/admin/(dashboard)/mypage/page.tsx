import { requireAdmin } from "@/lib/supabase/dal";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { saveNotificationSettings } from "./actions";
import { ChangePasswordForm } from "@/components/admin/ChangePasswordForm";

export default async function MyPage() {
  const user = await requireAdmin();
  const supabase = await createClient();

  const { data: settings } = await supabase
    .from("notification_settings")
    .select("discord_enabled, discord_webhook_url, email_enabled, notification_email")
    .eq("admin_id", user.id)
    .maybeSingle();

  const emailConfigured = Boolean(process.env.RESEND_API_KEY);

  return (
    <div className="mx-auto max-w-md space-y-8">
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-navy">알림 설정</h2>
        <p className="text-sm text-gray-500">
          예약이 완료되면 설정된 채널로 즉시 알림을 보냅니다.
        </p>

        <Card>
          <form action={saveNotificationSettings} className="space-y-5">
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-navy">
                <input
                  type="checkbox"
                  name="discord_enabled"
                  defaultChecked={settings?.discord_enabled ?? false}
                  className="h-4 w-4 rounded border-border accent-navy"
                />
                디스코드 웹훅 알림
              </label>
              <input
                type="url"
                name="discord_webhook_url"
                defaultValue={settings?.discord_webhook_url ?? ""}
                placeholder="https://discord.com/api/webhooks/..."
                className="mt-2 w-full rounded-md border border-border px-3 py-2 text-sm outline-none focus:border-navy-300"
              />
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-navy">
                <input
                  type="checkbox"
                  name="email_enabled"
                  defaultChecked={settings?.email_enabled ?? false}
                  className="h-4 w-4 rounded border-border accent-navy"
                />
                이메일 알림
              </label>
              <input
                type="email"
                name="notification_email"
                defaultValue={settings?.notification_email ?? ""}
                placeholder="alerts@anpc.co.kr"
                className="mt-2 w-full rounded-md border border-border px-3 py-2 text-sm outline-none focus:border-navy-300"
              />
              {!emailConfigured && (
                <p className="mt-1 text-xs text-gray-400">
                  이메일 발송을 사용하려면 배포 환경변수에 RESEND_API_KEY, RESEND_FROM_EMAIL을 등록해야 합니다.
                </p>
              )}
            </div>

            <Button type="submit" className="w-full">
              저장
            </Button>
          </form>
        </Card>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-navy">비밀번호 변경</h2>
        <Card>
          <ChangePasswordForm />
        </Card>
      </section>
    </div>
  );
}
