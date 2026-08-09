"use client";

import { useMemo, useState, useTransition } from "react";
import { createBooking } from "@/app/book/[slug]/actions";
import { Card } from "@/components/ui/Card";
import { CalendarMonth } from "./CalendarMonth";
import { TimeSlotGrid } from "./TimeSlotGrid";
import { BookingSummary } from "./BookingSummary";
import { formatDateLabel, parseDateParts } from "@/lib/dates";
import type { AvailabilityMap } from "@/lib/slots";

interface BookingFlowProps {
  slug: string;
  linkName: string;
  durationMinutes: number;
  rangeStartDate: string;
  rangeEndDate: string;
  initialAvailability: AvailabilityMap;
}

function monthKey(year: number, month: number) {
  return year * 12 + month;
}

export function BookingFlow({
  slug,
  linkName,
  durationMinutes,
  rangeStartDate,
  rangeEndDate,
  initialAvailability,
}: BookingFlowProps) {
  const availability = initialAvailability;
  const availableDateList = useMemo(
    () => Object.keys(availability).sort(),
    [availability]
  );

  const rangeStart = parseDateParts(rangeStartDate);
  const rangeEnd = parseDateParts(rangeEndDate);
  const firstAvailable = availableDateList[0]
    ? parseDateParts(availableDateList[0])
    : rangeStart;

  const [cursor, setCursor] = useState({
    year: firstAvailable.year,
    month: firstAvailable.month,
  });
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [confirmedAt, setConfirmedAt] = useState<{ date: string; time: string } | null>(
    null
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [removedSlots, setRemovedSlots] = useState<Set<string>>(new Set());
  const [pending, startTransition] = useTransition();

  const availableDateSet = useMemo(
    () => new Set(availableDateList),
    [availableDateList]
  );

  const timesForSelectedDate = useMemo(() => {
    if (!selectedDate) return [];
    const times = availability[selectedDate] ?? [];
    return times.filter((t) => !removedSlots.has(`${selectedDate}T${t}`));
  }, [availability, selectedDate, removedSlots]);

  const canGoPrev = monthKey(cursor.year, cursor.month) > monthKey(rangeStart.year, rangeStart.month);
  const canGoNext = monthKey(cursor.year, cursor.month) < monthKey(rangeEnd.year, rangeEnd.month);

  function handleSelectDate(date: string) {
    setSelectedDate(date);
    setSelectedTime(null);
    setErrorMessage(null);
  }

  function handleConfirm() {
    if (!selectedDate || !selectedTime) return;
    startTransition(async () => {
      const result = await createBooking(slug, selectedDate, selectedTime);
      if (result.ok) {
        setConfirmedAt({ date: result.date, time: result.time });
        return;
      }
      if (result.reason === "SLOT_TAKEN") {
        setRemovedSlots((prev) => new Set(prev).add(`${selectedDate}T${selectedTime}`));
        setErrorMessage("이미 다른 분이 선택한 시간입니다. 다른 시간을 선택해주세요.");
        setSelectedTime(null);
        setConfirming(false);
      } else {
        setErrorMessage("예약 처리 중 문제가 발생했습니다. 잠시 후 다시 시도해주세요.");
      }
    });
  }

  if (confirmedAt) {
    return (
      <Card className="text-center">
        <p className="text-sm text-gray-400">예약이 완료되었습니다</p>
        <h2 className="mt-2 text-lg font-semibold text-navy">
          {formatDateLabel(confirmedAt.date)} {confirmedAt.time}
        </h2>
        <p className="mt-4 text-xs text-gray-400">
          확정 안내는 담당자가 별도로 전달드립니다.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <h1 className="text-base font-semibold text-navy">{linkName}</h1>
        <p className="mt-1 text-sm text-gray-500">{durationMinutes}분</p>
      </Card>

      <Card>
        <CalendarMonth
          year={cursor.year}
          month={cursor.month}
          availableDates={availableDateSet}
          selectedDate={selectedDate}
          onSelectDate={handleSelectDate}
          onPrevMonth={() =>
            setCursor((c) => (c.month === 1 ? { year: c.year - 1, month: 12 } : { year: c.year, month: c.month - 1 }))
          }
          onNextMonth={() =>
            setCursor((c) => (c.month === 12 ? { year: c.year + 1, month: 1 } : { year: c.year, month: c.month + 1 }))
          }
          canGoPrev={canGoPrev}
          canGoNext={canGoNext}
        />
      </Card>

      {selectedDate && !confirming && (
        <Card>
          <p className="mb-3 text-sm font-medium text-navy">
            {formatDateLabel(selectedDate)}
          </p>
          <TimeSlotGrid
            times={timesForSelectedDate}
            selectedTime={selectedTime}
            onSelectTime={(time) => {
              setSelectedTime(time);
              setConfirming(true);
              setErrorMessage(null);
            }}
          />
        </Card>
      )}

      {selectedDate && selectedTime && confirming && (
        <Card>
          <BookingSummary
            linkName={linkName}
            date={selectedDate}
            time={selectedTime}
            durationMinutes={durationMinutes}
            pending={pending}
            errorMessage={errorMessage}
            onConfirm={handleConfirm}
            onBack={() => {
              setConfirming(false);
              setSelectedTime(null);
              setErrorMessage(null);
            }}
          />
        </Card>
      )}

      {errorMessage && !confirming && (
        <p className="text-sm text-red-600">{errorMessage}</p>
      )}
    </div>
  );
}
