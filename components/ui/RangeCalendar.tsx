"use client";

import { daysInMonth, dayOfWeek, formatDate, formatMonthLabel } from "@/lib/dates";

const WEEKDAY_LABELS = ["일", "월", "화", "수", "목", "금", "토"];

interface RangeCalendarProps {
  viewYear: number;
  viewMonth: number;
  startDate: string | null;
  endDate: string | null;
  onSelectDate: (date: string) => void;
  onPrevMonth: () => void;
  onNextMonth: () => void;
}

export function RangeCalendar({
  viewYear,
  viewMonth,
  startDate,
  endDate,
  onSelectDate,
  onPrevMonth,
  onNextMonth,
}: RangeCalendarProps) {
  const totalDays = daysInMonth(viewYear, viewMonth);
  const leadingBlanks = dayOfWeek(formatDate(viewYear, viewMonth, 1));
  const cells: (string | null)[] = [
    ...Array(leadingBlanks).fill(null),
    ...Array.from({ length: totalDays }, (_, i) => formatDate(viewYear, viewMonth, i + 1)),
  ];

  return (
    <div className="w-64">
      <div className="mb-1.5 flex items-center justify-between">
        <button
          type="button"
          onClick={onPrevMonth}
          className="rounded px-1.5 py-0.5 text-xs text-gray-500 hover:bg-navy-50"
        >
          이전
        </button>
        <span className="text-xs font-semibold text-navy">{formatMonthLabel(viewYear, viewMonth)}</span>
        <button
          type="button"
          onClick={onNextMonth}
          className="rounded px-1.5 py-0.5 text-xs text-gray-500 hover:bg-navy-50"
        >
          다음
        </button>
      </div>

      <div className="grid grid-cols-7 gap-0.5 text-center text-[10px] text-gray-400">
        {WEEKDAY_LABELS.map((label) => (
          <div key={label} className="py-0.5">
            {label}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-0.5">
        {cells.map((date, idx) => {
          if (!date) return <div key={`blank-${idx}`} />;

          const isStart = date === startDate;
          const isEnd = date === endDate;
          const isInRange = Boolean(startDate && endDate && date > startDate && date < endDate);
          const day = Number(date.slice(-2));

          return (
            <button
              key={date}
              type="button"
              onClick={() => onSelectDate(date)}
              className={[
                "aspect-square w-full rounded text-xs transition-colors",
                isStart || isEnd
                  ? "bg-navy text-white"
                  : isInRange
                    ? "bg-navy-50 text-navy"
                    : "text-navy hover:bg-navy-50",
              ].join(" ")}
            >
              {day}
            </button>
          );
        })}
      </div>
    </div>
  );
}
