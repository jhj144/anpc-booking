"use client";

import { useTransition } from "react";

interface DeleteLinkButtonProps {
  action: () => Promise<void>;
}

export function DeleteLinkButton({ action }: DeleteLinkButtonProps) {
  const [pending, startTransition] = useTransition();

  function handleClick() {
    if (!window.confirm("이 예약 링크를 삭제하면 연결된 확정 예약 내역도 함께 삭제됩니다. 계속하시겠습니까?")) return;
    startTransition(() => {
      action();
    });
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending}
      className="text-xs text-gray-400 hover:text-red-600 disabled:text-gray-300"
    >
      {pending ? "삭제 중..." : "링크 삭제"}
    </button>
  );
}
