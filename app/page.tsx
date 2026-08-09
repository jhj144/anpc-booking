import Link from "next/link";

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-3 p-8 text-center">
      <h1 className="text-xl font-semibold text-navy">ANPC 예약 페이지</h1>
      <p className="text-sm text-gray-500">
        공유받은 예약 링크(/book/[slug])로 접속하거나, 관리자는 대시보드에서 일정을 관리하세요.
      </p>
      <Link href="/admin" className="text-sm font-medium text-navy underline">
        관리자 대시보드로 이동
      </Link>
    </main>
  );
}
