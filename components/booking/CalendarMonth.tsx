"use client";

import { daysInMonth, dayOfWeek, formatDate, formatMonthLabel } from "@/lib/dates";

const WEEKDAY_HEADERS = ["일", "월", "화", "수", "목", "금", "토"];

interface CalendarMonthProps {
  year: number;
  month: number; // 1~12
  availableDates: Set<string>;
  selectedDate: string | null;
  onSelectDate: (date: string) => void;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  canGoPrev: boolean;
  canGoNext: boolean;
}

export function CalendarMonth({
  year,
  month,
  availableDates,
  selectedDate,
  onSelectDate,
  onPrevMonth,
  onNextMonth,
  canGoPrev,
  canGoNext,
}: CalendarMonthProps) {
  const totalDays = daysInMonth(year, month);
  const firstDate = formatDate(year, month, 1);
  const leadingBlanks = dayOfWeek(firstDate);

  const cells: (string | null)[] = [
    ...Array(leadingBlanks).fill(null),
    ...Array.from({ length: totalDays }, (_, i) => formatDate(year, month, i + 1)),
  ];

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <button
          type="button"
          onClick={onPrevMonth}
          disabled={!canGoPrev}
          className="rounded-md px-2 py-1 text-sm text-gray-500 hover:bg-navy-50 disabled:invisible"
        >
          이전
        </button>
        <span className="text-sm font-semibold text-navy">
          {formatMonthLabel(year, month)}
        </span>
        <button
          type="button"
          onClick={onNextMonth}
          disabled={!canGoNext}
          className="rounded-md px-2 py-1 text-sm text-gray-500 hover:bg-navy-50 disabled:invisible"
        >
          다음
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-xs text-gray-400">
        {WEEKDAY_HEADERS.map((label) => (
          <div key={label} className="py-1">
            {label}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {cells.map((date, idx) => {
          if (!date) return <div key={`blank-${idx}`} />;

          const isAvailable = availableDates.has(date);
          const isSelected = date === selectedDate;
          const day = Number(date.slice(-2));

          return (
            <button
              key={date}
              type="button"
              disabled={!isAvailable}
              onClick={() => onSelectDate(date)}
              className={[
                "aspect-square rounded-md text-sm transition-colors",
                isSelected
                  ? "bg-navy text-white"
                  : isAvailable
                    ? "text-navy hover:bg-navy-50"
                    : "text-gray-300",
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
