// 모든 예약 관련 값은 date/time 컬럼(타임존 없음)으로 저장되고 KST 단일 기준으로 취급한다.
// 서버 런타임의 실제 타임존(예: Vercel의 UTC)에 관계없이 항상 동일한 KST 값을 얻기 위해
// UTC 기준시각에 9시간을 더한 뒤 getUTC*로 값을 읽는다.

const KST_OFFSET_MS = 9 * 60 * 60 * 1000;

const WEEKDAY_LABELS_KO = ["일", "월", "화", "수", "목", "금", "토"];

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

function kstNow(): Date {
  return new Date(Date.now() + KST_OFFSET_MS);
}

export function todayKST(): string {
  const d = kstNow();
  return `${d.getUTCFullYear()}-${pad2(d.getUTCMonth() + 1)}-${pad2(d.getUTCDate())}`;
}

export function nowTimeKST(): string {
  const d = kstNow();
  return `${pad2(d.getUTCHours())}:${pad2(d.getUTCMinutes())}`;
}

/** 'yyyy-MM-dd' -> 0(일) ~ 6(토) */
export function dayOfWeek(dateStr: string): number {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}

export function weekdayLabel(dateStr: string): string {
  return WEEKDAY_LABELS_KO[dayOfWeek(dateStr)];
}

/** 'yyyy-MM-dd' 문자열의 년/월/일 각 파트를 반환 */
export function parseDateParts(dateStr: string): { year: number; month: number; day: number } {
  const [year, month, day] = dateStr.split("-").map(Number);
  return { year, month, day };
}

export function formatDate(year: number, month: number, day: number): string {
  return `${year}-${pad2(month)}-${pad2(day)}`;
}

export function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

/** [startDate, endDate] 사이(포함)의 모든 날짜를 'yyyy-MM-dd' 문자열로 반환 */
export function eachDateInRange(startDate: string, endDate: string): string[] {
  if (startDate > endDate) return [];
  const dates: string[] = [];
  const { year, month, day } = parseDateParts(startDate);
  const cursor = new Date(Date.UTC(year, month - 1, day));
  const end = parseDateParts(endDate);
  const endUtc = Date.UTC(end.year, end.month - 1, end.day);
  while (cursor.getTime() <= endUtc) {
    dates.push(
      formatDate(cursor.getUTCFullYear(), cursor.getUTCMonth() + 1, cursor.getUTCDate())
    );
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return dates;
}

/** 'HH:mm' 또는 'HH:mm:ss' -> 'HH:mm'으로 정규화 */
export function normalizeTime(time: string): string {
  return time.slice(0, 5);
}

/** 'HH:mm' 시각에 분을 더한 'HH:mm' 반환 (00:00~23:59 범위를 벗어나지 않는다고 가정) */
export function addMinutesToTime(time: string, minutes: number): string {
  const [h, m] = normalizeTime(time).split(":").map(Number);
  const total = h * 60 + m + minutes;
  const hh = Math.floor(total / 60);
  const mm = total % 60;
  return `${pad2(hh)}:${pad2(mm)}`;
}

/** [aStart, aEnd) 와 [bStart, bEnd) 구간이 겹치는지 여부 ('HH:mm' 문자열 비교) */
export function timeRangesOverlap(
  aStart: string,
  aEnd: string,
  bStart: string,
  bEnd: string
): boolean {
  return aStart < bEnd && bStart < aEnd;
}

const MONTH_LABELS = [
  "1월", "2월", "3월", "4월", "5월", "6월",
  "7월", "8월", "9월", "10월", "11월", "12월",
];

export function formatMonthLabel(year: number, month: number): string {
  return `${year}년 ${MONTH_LABELS[month - 1]}`;
}

export function formatDateLabel(dateStr: string): string {
  const { month, day } = parseDateParts(dateStr);
  return `${month}월 ${day}일 (${weekdayLabel(dateStr)})`;
}
