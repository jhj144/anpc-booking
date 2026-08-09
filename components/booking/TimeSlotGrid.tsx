"use client";

interface TimeSlotGridProps {
  times: string[];
  selectedTime: string | null;
  onSelectTime: (time: string) => void;
}

export function TimeSlotGrid({ times, selectedTime, onSelectTime }: TimeSlotGridProps) {
  if (times.length === 0) {
    return <p className="text-sm text-gray-400">선택 가능한 시간이 없습니다.</p>;
  }

  return (
    <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
      {times.map((time) => {
        const isSelected = time === selectedTime;
        return (
          <button
            key={time}
            type="button"
            onClick={() => onSelectTime(time)}
            className={[
              "rounded-md border px-3 py-2 text-sm transition-colors",
              isSelected
                ? "border-navy bg-navy text-white"
                : "border-border text-navy hover:bg-navy-50",
            ].join(" ")}
          >
            {time}
          </button>
        );
      })}
    </div>
  );
}
