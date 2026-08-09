import {
  addMinutesToTime,
  eachDateInRange,
  dayOfWeek,
  normalizeTime,
  timeRangesOverlap,
} from "./dates";

export interface AvailableRuleRow {
  day_of_week: number;
  start_time: string;
  end_time: string;
  range_start_date: string;
  range_end_date: string;
}

export interface BlockedSlotRow {
  block_date: string;
  is_full_day: boolean;
  start_time: string | null;
  end_time: string | null;
}

export interface ConfirmedBookingRow {
  booking_date: string;
  start_time: string;
  end_time: string;
}

export interface AvailabilityInput {
  /** 조회할 날짜 범위 (달력에 보여줄 월 등). 예약 링크의 range와 교집합을 계산해서 사용한다. */
  viewStartDate: string;
  viewEndDate: string;
  linkRangeStartDate: string;
  linkRangeEndDate: string;
  durationMinutes: number;
  availableRules: AvailableRuleRow[];
  blockedSlots: BlockedSlotRow[];
  confirmedBookings: ConfirmedBookingRow[];
  todayDate: string;
  nowTime: string;
}

/** 'yyyy-MM-dd' -> ['HH:mm', ...] 형태의 예약 가능 시간 맵 */
export type AvailabilityMap = Record<string, string[]>;

export function getAvailableSlots(input: AvailabilityInput): AvailabilityMap {
  const rangeStart =
    input.viewStartDate > input.linkRangeStartDate ? input.viewStartDate : input.linkRangeStartDate;
  const rangeEnd =
    input.viewEndDate < input.linkRangeEndDate ? input.viewEndDate : input.linkRangeEndDate;

  if (rangeStart > rangeEnd) return {};

  const blocksByDate = new Map<string, BlockedSlotRow[]>();
  for (const block of input.blockedSlots) {
    const list = blocksByDate.get(block.block_date) ?? [];
    list.push(block);
    blocksByDate.set(block.block_date, list);
  }

  const bookingsByDate = new Map<string, ConfirmedBookingRow[]>();
  for (const booking of input.confirmedBookings) {
    const list = bookingsByDate.get(booking.booking_date) ?? [];
    list.push(booking);
    bookingsByDate.set(booking.booking_date, list);
  }

  const result: AvailabilityMap = {};

  for (const date of eachDateInRange(rangeStart, rangeEnd)) {
    const dow = dayOfWeek(date);
    const ranges = input.availableRules.filter(
      (rule) =>
        rule.day_of_week === dow &&
        rule.range_start_date <= date &&
        date <= rule.range_end_date
    );
    if (ranges.length === 0) continue;

    let daySlots: string[] = [];
    for (const range of ranges) {
      const rangeStartTime = normalizeTime(range.start_time);
      const rangeEndTime = normalizeTime(range.end_time);
      let cursor = rangeStartTime;
      while (addMinutesToTime(cursor, input.durationMinutes) <= rangeEndTime) {
        daySlots.push(cursor);
        cursor = addMinutesToTime(cursor, input.durationMinutes);
      }
    }

    const dayBlocks = blocksByDate.get(date) ?? [];
    if (dayBlocks.length > 0) {
      daySlots = daySlots.filter((slotStart) => {
        const slotEnd = addMinutesToTime(slotStart, input.durationMinutes);
        return !dayBlocks.some((block) => {
          if (block.is_full_day) return true;
          return timeRangesOverlap(
            slotStart,
            slotEnd,
            normalizeTime(block.start_time!),
            normalizeTime(block.end_time!)
          );
        });
      });
    }

    const dayBookings = bookingsByDate.get(date) ?? [];
    if (dayBookings.length > 0) {
      daySlots = daySlots.filter((slotStart) => {
        const slotEnd = addMinutesToTime(slotStart, input.durationMinutes);
        return !dayBookings.some((booking) =>
          timeRangesOverlap(
            slotStart,
            slotEnd,
            normalizeTime(booking.start_time),
            normalizeTime(booking.end_time)
          )
        );
      });
    }

    if (date === input.todayDate) {
      daySlots = daySlots.filter((slotStart) => slotStart > input.nowTime);
    }

    if (daySlots.length > 0) {
      result[date] = daySlots;
    }
  }

  return result;
}
