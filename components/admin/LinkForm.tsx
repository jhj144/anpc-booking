"use client";

import { useActionState, useState, useTransition, type FormEvent } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { RangeCalendar } from "@/components/ui/RangeCalendar";
import { useDateRangeCalendar } from "@/lib/useDateRangeCalendar";
import { formatDateLabel } from "@/lib/dates";
import type { LinkFormState } from "@/app/admin/(dashboard)/links/actions";

interface TemplateOption {
  id: string;
  title: string;
}

const DURATION_PRESETS = [
  { value: "30", label: "30분" },
  { value: "60", label: "1시간" },
  { value: "120", label: "2시간" },
  { value: "custom", label: "직접 입력" },
];

interface LinkFormProps {
  action: (state: LinkFormState, formData: FormData) => Promise<LinkFormState>;
  templates: TemplateOption[];
  submitLabel: string;
  defaultValues?: {
    name: string;
    duration_minutes: number;
    range_start_date: string;
    range_end_date: string;
    template_id: string | null;
  };
}

export function LinkForm({ action, templates, submitLabel, defaultValues }: LinkFormProps) {
  const [state, formAction, pending] = useActionState(action, undefined);

  const initialPreset = defaultValues
    ? DURATION_PRESETS.some((p) => p.value === String(defaultValues.duration_minutes))
      ? String(defaultValues.duration_minutes)
      : "custom"
    : "30";
  const [durationPreset, setDurationPreset] = useState(initialPreset);

  const { viewYear, viewMonth, startDate, endDate, selectDate, goPrevMonth, goNextMonth } =
    useDateRangeCalendar(defaultValues?.range_start_date ?? null, defaultValues?.range_end_date ?? null);
  const [, startTransition] = useTransition();

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    formData.set("range_start_date", startDate ?? "");
    formData.set("range_end_date", endDate ?? startDate ?? "");
    startTransition(() => {
      formAction(formData);
    });
  }

  return (
    <Card>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-navy">예약 이름</label>
          <input
            name="name"
            required
            defaultValue={defaultValues?.name}
            placeholder="예: A고객사 제안 미팅"
            className="w-full rounded-md border border-border px-3 py-2 text-sm outline-none focus:border-navy-300"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-navy">예약 진행 시간</label>
          <select
            value={durationPreset}
            onChange={(e) => setDurationPreset(e.target.value)}
            className="w-full rounded-md border border-border bg-white px-3 py-2 text-sm outline-none focus:border-navy-300"
          >
            {DURATION_PRESETS.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
          {durationPreset === "custom" ? (
            <input
              key="custom"
              type="number"
              name="duration_minutes"
              min={5}
              step={5}
              required
              defaultValue={
                defaultValues && initialPreset === "custom" ? defaultValues.duration_minutes : undefined
              }
              placeholder="분 단위로 입력 (예: 45)"
              className="mt-2 w-full rounded-md border border-border px-3 py-2 text-sm outline-none focus:border-navy-300"
            />
          ) : (
            <input key="preset" type="hidden" name="duration_minutes" value={durationPreset} />
          )}
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-navy">예약 가능 기간</label>
          <div className="rounded-md border border-border p-3">
            <RangeCalendar
              viewYear={viewYear}
              viewMonth={viewMonth}
              startDate={startDate}
              endDate={endDate}
              onSelectDate={selectDate}
              onPrevMonth={goPrevMonth}
              onNextMonth={goNextMonth}
            />
          </div>
          <p className="mt-2 text-xs text-gray-500">
            {startDate && endDate
              ? `${formatDateLabel(startDate)} ~ ${formatDateLabel(endDate)}`
              : startDate
                ? `${formatDateLabel(startDate)} (하루 · 기간으로 지정하려면 종료일도 선택)`
                : "날짜를 선택하세요"}
          </p>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-navy">
            안내 메시지 템플릿 <span className="font-normal text-gray-400">(선택)</span>
          </label>
          <select
            name="template_id"
            defaultValue={defaultValues?.template_id ?? ""}
            className="w-full rounded-md border border-border bg-white px-3 py-2 text-sm outline-none focus:border-navy-300"
          >
            <option value="">선택 안 함</option>
            {templates.map((t) => (
              <option key={t.id} value={t.id}>
                {t.title}
              </option>
            ))}
          </select>
        </div>

        {state?.error && <p className="text-sm text-red-600">{state.error}</p>}

        <Button type="submit" disabled={pending || !startDate} className="w-full">
          {pending ? "저장 중..." : submitLabel}
        </Button>
      </form>
    </Card>
  );
}
