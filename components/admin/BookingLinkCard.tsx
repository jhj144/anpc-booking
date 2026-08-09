"use client";

import { useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { formatDateLabel } from "@/lib/dates";

interface BookingLinkCardProps {
  id: string;
  name: string;
  status: string;
  durationMinutes: number;
  rangeStartDate: string;
  rangeEndDate: string;
  shareUrl: string;
}

export function BookingLinkCard({
  id,
  name,
  status,
  durationMinutes,
  rangeStartDate,
  rangeEndDate,
  shareUrl,
}: BookingLinkCardProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <Card>
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-navy">{name}</h3>
            {status === "archived" && (
              <span className="rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-500">보관됨</span>
            )}
          </div>
          <p className="mt-1 text-sm text-gray-500">{durationMinutes}분</p>
          <p className="mt-1 text-xs text-gray-400">
            {formatDateLabel(rangeStartDate)} ~ {formatDateLabel(rangeEndDate)}
          </p>
        </div>
        <Link href={`/admin/links/${id}`} className="shrink-0 text-sm font-medium text-navy hover:underline">
          상세보기
        </Link>
      </div>

      <div className="mt-4 flex items-center gap-2 rounded-md border border-border bg-navy-50/40 px-3 py-2">
        <input
          readOnly
          value={shareUrl}
          className="w-full truncate bg-transparent text-xs text-gray-600 outline-none"
          onFocus={(e) => e.currentTarget.select()}
        />
        <button
          type="button"
          onClick={handleCopy}
          className="shrink-0 text-xs font-medium text-navy hover:underline"
        >
          {copied ? "복사됨" : "링크 복사"}
        </button>
      </div>
    </Card>
  );
}
