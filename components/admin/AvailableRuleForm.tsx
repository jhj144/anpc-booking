"use client";

import { useState, useTransition, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import {
  daysInMonth,
  dayOfWeek,
  formatDate,
  formatMonthLabel,
  formatDateLabel,
  todayKST,
} from "@/lib/dates";

const WEEKDAY_LABELS = ["일", "월", "화", "수", "목", "금", "토"];

interface AvailableRuleFormProps {
  action: (formData: FormData) => void | Promise<void>;
}

export function AvailableRuleForm({ action }: AvailableRuleFormProps) {
  const [viewYear, viewMonthInit] = todayKST().split("-").map(Number);
  const [viewYearState, setViewYear] = useState(viewYear);
  const [viewMonth, setViewMonth] = useState(viewMonthInit);
  const [startDate, setStartDate] = useState<string | null>(null);
  const [endDate, setEndDate] = useState<string | null>(null);
  const [selectedDays, setSelectedDays] = useState<Set<number>>(new Set());
  const [startTime, setStartTime] = useState("10:00");
  const [endTime, setEndTime] = useState("18:00");
  const [isPending, startTransition] = useTransition();

  function handleSelectDate(date: string) {
    if (!startDate || (startDate && endDate)) {
      setStartDate(date);
      setEndDate(null);
      return;
    }
    if (date < startDate) {
      setStartDate(date);
      setEndDate(null);
      return;
    }
    setEndDate(date);
  }

  function toggleDay(day: number) {
    setSelectedDays((prev) => {
      const next = new Set(prev);
      if (next.has(day)) next.delete(day);
      else next.add(day);
      return next;
    });
  }

  function goPrevMonth() {
    if (viewMonth === 1) {
      setViewYear((y) => y - 1);
      setViewMonth(12);
    } else {
      setViewMonth((m) => m - 1);
    }
  }

  function goNextMonth() {
    if (viewMonth === 12) {
      setViewYear((y) => y + 1);
      setViewMonth(1);
    } else {
      setViewMonth((m) => m + 1);
    }
  }

  const totalDays = daysInMonth(viewYearState, viewMonth);
  const leadingBlanks = dayOfWeek(formatDate(viewYearState, viewMonth, 1));
  const cells: (string | null)[] = [
    ...Array(leadingBlanks).fill(null),
    ...Array.from({ length: totalDays }, (_, i) => formatDate(viewYearState, viewMonth, i + 1)),
  ];

  const canSubmit = Boolean(startDate && endDate && selectedDays.size > 0);

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!canSubmit) return;

    const formData = new FormData();
    formData.set("range_start_date", startDate!);
    formData.set("range_end_date", endDate!);
    selectedDays.forEach((day) => formData.set(`day-${day}`, "on"));
    formData.set("start_time", startTime);
    formData.set("end_time", endTime);

    startTransition(() => {
      action(formData);
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <div className="mb-2 flex items-center justify-between">
          <button
            type="button"
            onClick={goPrevMonth}
            className="rounded-md px-2 py-1 text-sm text-gray-500 hover:bg-navy-50"
          >
            이전
          </button>
          <span className="text-sm font-semibold text-navy">
            {formatMonthLabel(viewYearState, viewMonth)}
          </span>
          <button
            type="button"
            onClick={goNextMonth}
            className="rounded-md px-2 py-1 text-sm text-gray-500 hover:bg-navy-50"
          >
            다음
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1 text-center text-xs text-gray-400">
          {WEEKDAY_LABELS.map((label) => (
            <div key={label} className="py-1">
              {label}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
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
                onClick={() => handleSelectDate(date)}
                className={[
                  "aspect-square rounded-md text-sm transition-colors",
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

        <p className="mt-2 text-xs text-gray-500">
          {startDate && endDate
            ? `${formatDateLabel(startDate)} ~ ${formatDateLabel(endDate)}`
            : startDate
              ? `${formatDateLabel(startDate)} ~ 종료일을 선택하세요`
              : "시작일을 선택하세요"}
          {(startDate || endDate) && (
            <button
              type="button"
              onClick={() => {
                setStartDate(null);
                setEndDate(null);
              }}
              className="ml-2 text-gray-400 underline hover:text-navy"
            >
              초기화
            </button>
          )}
        </p>
      </div>

      <div>
        <label className="mb-1 block text-xs text-gray-500">요일 (복수 선택)</label>
        <div className="flex flex-wrap gap-3">
          {WEEKDAY_LABELS.map((label, day) => (
            <label key={day} className="flex items-center gap-1.5 text-sm text-navy">
              <input
                type="checkbox"
                checked={selectedDays.has(day)}
                onChange={() => toggleDay(day)}
                className="h-4 w-4 rounded border-border accent-navy"
              />
              {label}
            </label>
          ))}
        </div>
      </div>

      <div className="flex items-end gap-3">
        <div>
          <label className="mb-1 block text-xs text-gray-500">시작 시간</label>
          <input
            type="time"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            required
            className="rounded-md border border-border px-2 py-1.5 text-sm outline-none focus:border-navy-300"
          />
        </div>
        <span className="pb-2 text-sm text-gray-400">~</span>
        <div>
          <label className="mb-1 block text-xs text-gray-500">종료 시간</label>
          <input
            type="time"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            required
            className="rounded-md border border-border px-2 py-1.5 text-sm outline-none focus:border-navy-300"
          />
        </div>
        <Button type="submit" disabled={!canSubmit || isPending}>
          {isPending ? "추가 중..." : "가능시간 추가"}
        </Button>
      </div>
    </form>
  );
}
