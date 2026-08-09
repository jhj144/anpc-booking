"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/Button";
import { changePassword } from "@/app/admin/(dashboard)/mypage/actions";

export function ChangePasswordForm() {
  const [state, formAction, pending] = useActionState(changePassword, undefined);

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <label className="mb-1 block text-sm font-medium text-navy">새 비밀번호</label>
        <input
          type="password"
          name="password"
          required
          minLength={6}
          autoComplete="new-password"
          className="w-full rounded-md border border-border px-3 py-2 text-sm outline-none focus:border-navy-300"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-navy">새 비밀번호 확인</label>
        <input
          type="password"
          name="password_confirm"
          required
          minLength={6}
          autoComplete="new-password"
          className="w-full rounded-md border border-border px-3 py-2 text-sm outline-none focus:border-navy-300"
        />
      </div>

      {state && "error" in state && <p className="text-sm text-red-600">{state.error}</p>}
      {state && "success" in state && (
        <p className="text-sm text-green-600">비밀번호가 변경되었습니다.</p>
      )}

      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "변경 중..." : "비밀번호 변경"}
      </Button>
    </form>
  );
}
