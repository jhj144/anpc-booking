"use client";

import { Button } from "@/components/ui/Button";
import { formatDateLabel } from "@/lib/dates";

interface BookingSummaryProps {
  linkName: string;
  date: string;
  time: string;
  durationMinutes: number;
  pending: boolean;
  errorMessage: string | null;
  onConfirm: () => void;
  onBack: () => void;
}

export function BookingSummary({
  linkName,
  date,
  time,
  durationMinutes,
  pending,
  errorMessage,
  onConfirm,
  onBack,
}: BookingSummaryProps) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-base font-semibold text-navy">{linkName}</h2>
        <dl className="mt-3 space-y-1 text-sm text-gray-600">
          <div className="flex gap-2">
            <dt className="w-20 shrink-0 text-gray-400">일시</dt>
            <dd>
              {formatDateLabel(date)} {time} ({durationMinutes}분)
            </dd>
          </div>
        </dl>
      </div>

      {errorMessage && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">
          {errorMessage}
        </p>
      )}

      <div className="flex gap-2">
        <Button variant="secondary" onClick={onBack} disabled={pending}>
          다시 선택
        </Button>
        <Button onClick={onConfirm} disabled={pending}>
          {pending ? "예약 중..." : "예약 확정"}
        </Button>
      </div>
    </div>
  );
}
