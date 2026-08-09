"use client";

import { useState, useTransition } from "react";
import { Card } from "@/components/ui/Card";
import { formatDateLabel } from "@/lib/dates";
import { renderTemplate } from "@/lib/templates";
import { cancelBooking } from "@/app/admin/(dashboard)/links/actions";

interface BookingRowProps {
  linkId: string;
  bookingId: string;
  bookingDate: string;
  startTime: string;
  templateBody: string | null;
}

export function BookingRow({
  linkId,
  bookingId,
  bookingDate,
  startTime,
  templateBody,
}: BookingRowProps) {
  const [copied, setCopied] = useState(false);
  const [pending, startTransition] = useTransition();

  async function handleCopy() {
    if (!templateBody) return;
    const message = renderTemplate(templateBody, {
      date: formatDateLabel(bookingDate),
      time: startTime,
    });
    await navigator.clipboard.writeText(message);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <Card className="flex items-center justify-between py-3">
      <div>
        <p className="text-sm font-medium text-navy">
          {formatDateLabel(bookingDate)} {startTime}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-3">
        <button
          type="button"
          onClick={handleCopy}
          disabled={!templateBody}
          className="text-xs font-medium text-navy hover:underline disabled:cursor-not-allowed disabled:text-gray-300"
        >
          {copied ? "복사됨" : "안내 메시지 복사"}
        </button>
        <button
          type="button"
          onClick={() => startTransition(() => cancelBooking(linkId, bookingId))}
          disabled={pending}
          className="text-xs text-gray-400 hover:text-red-600"
        >
          취소
        </button>
      </div>
    </Card>
  );
}
