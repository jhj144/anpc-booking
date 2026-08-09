import "server-only";

interface NotifyBookingParams {
  discordEnabled: boolean;
  discordWebhookUrl?: string | null;
  emailEnabled: boolean;
  notificationEmail?: string | null;
  linkName: string;
  dateLabel: string;
  time: string;
}

/** 예약 확정 알림을 설정된 채널로 보낸다. 알림 발송 실패가 예약 성공 여부에 영향을 주지 않도록 항상 내부에서 예외를 흡수한다. */
export async function sendBookingNotifications(params: NotifyBookingParams) {
  const tasks: Promise<void>[] = [];

  if (params.discordEnabled && params.discordWebhookUrl) {
    tasks.push(sendDiscordNotification(params));
  }
  if (params.emailEnabled && params.notificationEmail && process.env.RESEND_API_KEY) {
    tasks.push(sendEmailNotification(params));
  }

  await Promise.allSettled(tasks);
}

async function sendDiscordNotification(params: NotifyBookingParams) {
  try {
    await fetch(params.discordWebhookUrl!, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        content: `새 예약이 확정되었습니다.\n\n${params.linkName}\n${params.dateLabel} ${params.time}`,
      }),
    });
  } catch {
    // 알림 실패는 예약 성공에 영향을 주지 않는다.
  }
}

async function sendEmailNotification(params: NotifyBookingParams) {
  try {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: process.env.RESEND_FROM_EMAIL,
        to: params.notificationEmail,
        subject: `[ANPC 예약] ${params.linkName} 새 예약 확정`,
        text: `${params.dateLabel} ${params.time}`,
      }),
    });
  } catch {
    // 알림 실패는 예약 성공에 영향을 주지 않는다.
  }
}
