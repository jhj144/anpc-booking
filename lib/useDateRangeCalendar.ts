import { useState } from "react";
import { todayKST } from "@/lib/dates";

export function useDateRangeCalendar(initialStart?: string | null, initialEnd?: string | null) {
  const base = initialStart ?? todayKST();
  const [baseYear, baseMonth] = base.split("-").map(Number);
  const [viewYear, setViewYear] = useState(baseYear);
  const [viewMonth, setViewMonth] = useState(baseMonth);
  const [startDate, setStartDate] = useState<string | null>(initialStart ?? null);
  const [endDate, setEndDate] = useState<string | null>(initialEnd ?? null);

  function selectDate(date: string) {
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

  function reset() {
    setStartDate(null);
    setEndDate(null);
  }

  return {
    viewYear,
    viewMonth,
    startDate,
    endDate,
    selectDate,
    goPrevMonth,
    goNextMonth,
    reset,
  };
}
