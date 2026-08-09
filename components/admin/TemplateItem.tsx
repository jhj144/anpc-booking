"use client";

import { useState, useTransition } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { updateTemplate, deleteTemplate } from "@/app/admin/(dashboard)/templates/actions";

interface TemplateItemProps {
  id: string;
  title: string;
  body: string;
}

export function TemplateItem({ id, title, body }: TemplateItemProps) {
  const [editing, setEditing] = useState(false);
  const [pending, startTransition] = useTransition();

  if (!editing) {
    return (
      <Card>
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-sm font-semibold text-navy">{title}</h3>
          <div className="flex shrink-0 gap-3">
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="text-xs font-medium text-navy hover:underline"
            >
              수정
            </button>
            <button
              type="button"
              onClick={() => startTransition(() => deleteTemplate(id))}
              disabled={pending}
              className="text-xs text-gray-400 hover:text-red-600"
            >
              삭제
            </button>
          </div>
        </div>
        <p className="mt-2 whitespace-pre-wrap text-sm text-gray-600">{body}</p>
      </Card>
    );
  }

  return (
    <Card>
      <form
        action={(formData) =>
          startTransition(async () => {
            await updateTemplate(id, formData);
            setEditing(false);
          })
        }
        className="space-y-3"
      >
        <input
          name="title"
          defaultValue={title}
          required
          className="w-full rounded-md border border-border px-3 py-2 text-sm outline-none focus:border-navy-300"
        />
        <textarea
          name="body"
          defaultValue={body}
          required
          rows={4}
          className="w-full rounded-md border border-border px-3 py-2 text-sm outline-none focus:border-navy-300"
        />
        <div className="flex gap-2">
          <Button type="submit" disabled={pending}>
            저장
          </Button>
          <Button type="button" variant="secondary" onClick={() => setEditing(false)} disabled={pending}>
            취소
          </Button>
        </div>
      </form>
    </Card>
  );
}
