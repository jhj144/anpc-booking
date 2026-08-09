"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/admin", label: "예약 링크" },
  { href: "/admin/schedule", label: "일정 관리" },
  { href: "/admin/templates", label: "메시지 템플릿" },
  { href: "/admin/mypage", label: "마이페이지" },
];

export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav className="flex gap-1 overflow-x-auto">
      {NAV_ITEMS.map((item) => {
        const active = item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`whitespace-nowrap rounded-md px-3 py-2 text-sm font-medium transition-colors ${
              active ? "bg-navy text-white" : "text-navy-500 hover:bg-navy-50"
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
