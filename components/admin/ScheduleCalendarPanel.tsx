"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { RangeCalendar } from "@/components/ui/RangeCalendar";
import { useDateRangeCalendar } from "@/lib/useDateRangeCalendar";
import { formatDateLabel } from "@/lib/dates";

const WEEKDAY_LABELS = ["일", "월", "화", "수", "목", "금", "토"];

type Mode = "available" | "blocked";

interface ScheduleCalendarPanelProps {
  onAddAvailable: (formData: FormData) => void | Promise<void>;
  onAddBlocked: (formData: FormData) => void | Promise<void>;
}

export function ScheduleCalendarPanel({ onAddAvailable, onAddBlocked }: ScheduleCalendarPanelProps) {
  const [mode, setMode] = useState<Mode>("available");
  const { viewYear, viewMonth, startDate, endDate, selectDate, goPrevMonth, goNextMonth, reset } =
    useDateRangeCalendar();

  const [selectedDays, setSelectedDays] = useState<Set<number>>(new Set());
  const [startTime, setStartTime] = useState("10:00");
  const [endTime, setEndTime] = useState("18:00");

  const [blockedDays, setBlockedDays] = useState<Set<number>>(new Set());
  const [blockStartTime, setBlockStartTime] = useState("10:00");
  const [blockEndTime, setBlockEndTime] = useState("18:00");
  const [reason, setReason] = useState("");

  const [isPending, startTransition] = useTransition();

  function toggleDay(day: number) {
    setSelectedDays((prev) => {
      const next = new Set(prev);
      if (next.has(day)) next.delete(day);
      else next.add(day);
      return next;
    });
  }

  function toggleBlockedDay(day: number) {
    setBlockedDays((prev) => {
      const next = new Set(prev);
      if (next.has(day)) next.delete(day);
      else next.add(day);
      return next;
    });
  }

  const hasStart = Boolean(startDate);
  const canSubmitAvailable = hasStart && selectedDays.size > 0;
  const canSubmitBlocked =
    hasStart && blockedDays.size > 0 && Boolean(blockStartTime && blockEndTime && blockStartTime < blockEndTime);

  function handleSubmitAvailable() {
    if (!canSubmitAvailable) return;
    const formData = new FormData();
    formData.set("range_start_date", startDate!);
    formData.set("range_end_date", endDate ?? startDate!);
    selectedDays.forEach((day) => formData.set(`day-${day}`, "on"));
    formData.set("start_time", startTime);
    formData.set("end_time", endTime);
    startTransition(() => {
      onAddAvailable(formData);
    });
  }

  function handleSubmitBlocked() {
    if (!canSubmitBlocked) return;
    const formData = new FormData();
    formData.set("range_start_date", startDate!);
    formData.set("range_end_date", endDate ?? startDate!);
    blockedDays.forEach((day) => formData.set(`day-${day}`, "on"));
    formData.set("start_time", blockStartTime);
    formData.set("end_time", blockEndTime);
    formData.set("reason", reason);
    startTransition(() => {
      onAddBlocked(formData);
      setReason("");
    });
  }

  return (
    <div className="space-y-4">
      <div className="inline-flex rounded-md border border-border p-0.5">
        <button
          type="button"
          onClick={() => setMode("available")}
          className={`rounded px-3 py-1 text-xs font-medium transition-colors ${
            mode === "available" ? "bg-navy text-white" : "text-gray-500 hover:text-navy"
          }`}
        >
          가능시간
        </button>
        <button
          type="button"
          onClick={() => setMode("blocked")}
          className={`rounded px-3 py-1 text-xs font-medium transition-colors ${
            mode === "blocked" ? "bg-navy text-white" : "text-gray-500 hover:text-navy"
          }`}
        >
          불가능시간
        </button>
      </div>

      <div>
        <RangeCalendar
          viewYear={viewYear}
          viewMonth={viewMonth}
          startDate={startDate}
          endDate={endDate}
          onSelectDate={selectDate}
          onPrevMonth={goPrevMonth}
          onNextMonth={goNextMonth}
        />
        <p className="mt-2 text-xs text-gray-500">
          {startDate && endDate
            ? `${formatDateLabel(startDate)} ~ ${formatDateLabel(endDate)}`
            : startDate
              ? `${formatDateLabel(startDate)} (하루 · 기간으로 지정하려면 종료일도 선택)`
              : "날짜를 선택하세요"}
          {(startDate || endDate) && (
            <button type="button" onClick={reset} className="ml-2 text-gray-400 underline hover:text-navy">
              초기화
            </button>
          )}
        </p>
      </div>

      {mode === "available" ? (
        <div className="space-y-3">
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
                className="rounded-md border border-border px-2 py-1.5 text-sm outline-none focus:border-navy-300"
              />
            </div>
            <Button type="button" onClick={handleSubmitAvailable} disabled={!canSubmitAvailable || isPending}>
              {isPending ? "추가 중..." : "가능시간 추가"}
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-xs text-gray-500">요일 (복수 선택)</label>
            <div className="flex flex-wrap gap-3">
              {WEEKDAY_LABELS.map((label, day) => (
                <label key={day} className="flex items-center gap-1.5 text-sm text-navy">
                  <input
                    type="checkbox"
                    checked={blockedDays.has(day)}
                    onChange={() => toggleBlockedDay(day)}
                    className="h-4 w-4 rounded border-border accent-navy"
                  />
                  {label}
                </label>
              ))}
            </div>
          </div>
          <div className="flex items-end gap-3">
            <div>
              <label className="mb-1 block text-xs text-gray-500">시작</label>
              <input
                type="time"
                value={blockStartTime}
                onChange={(e) => setBlockStartTime(e.target.value)}
                className="rounded-md border border-border px-2 py-1.5 text-sm outline-none focus:border-navy-300"
              />
            </div>
            <span className="pb-2 text-sm text-gray-400">~</span>
            <div>
              <label className="mb-1 block text-xs text-gray-500">종료</label>
              <input
                type="time"
                value={blockEndTime}
                onChange={(e) => setBlockEndTime(e.target.value)}
                className="rounded-md border border-border px-2 py-1.5 text-sm outline-none focus:border-navy-300"
              />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs text-gray-500">사유 (선택)</label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="예: 연차, 공휴일"
              className="w-full rounded-md border border-border px-2 py-1.5 text-sm outline-none focus:border-navy-300"
            />
          </div>
          <Button type="button" variant="secondary" onClick={handleSubmitBlocked} disabled={!canSubmitBlocked || isPending}>
            {isPending ? "추가 중..." : "불가능시간 추가"}
          </Button>
        </div>
      )}
    </div>
  );
}
