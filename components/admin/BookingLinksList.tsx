"use client";

import { useState, useTransition } from "react";
import { BookingLinkCard } from "@/components/admin/BookingLinkCard";

interface LinkItem {
  id: string;
  name: string;
  status: string;
  durationMinutes: number;
  rangeStartDate: string;
  rangeEndDate: string;
  shareUrl: string;
  hasBooking: boolean;
}

interface BookingLinksListProps {
  links: LinkItem[];
  onBulkDelete: (ids: string[]) => Promise<void>;
}

export function BookingLinksList({ links, onBulkDelete }: BookingLinksListProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [isPending, startTransition] = useTransition();

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function handleBulkDelete() {
    const ids = Array.from(selected);
    if (ids.length === 0) return;
    if (
      !window.confirm(
        `선택한 ${ids.length}개의 예약 링크를 삭제하면 연결된 확정 예약 내역도 함께 삭제됩니다. 계속하시겠습니까?`
      )
    ) {
      return;
    }
    startTransition(async () => {
      await onBulkDelete(ids);
      setSelected(new Set());
    });
  }

  return (
    <div className="space-y-4">
      {selected.size > 0 && (
        <div className="flex items-center justify-between rounded-md border border-border bg-navy-50/40 px-3 py-2">
          <span className="text-sm text-navy">{selected.size}개 선택됨</span>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setSelected(new Set())}
              className="text-xs text-gray-400 hover:text-navy"
            >
              선택 해제
            </button>
            <button
              type="button"
              onClick={handleBulkDelete}
              disabled={isPending}
              className="text-xs font-medium text-red-600 hover:underline disabled:text-gray-300"
            >
              {isPending ? "삭제 중..." : "선택 삭제"}
            </button>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {links.map((link) => (
          <BookingLinkCard
            key={link.id}
            {...link}
            selected={selected.has(link.id)}
            onToggleSelect={() => toggle(link.id)}
          />
        ))}
      </div>
    </div>
  );
}
