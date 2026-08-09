export default function BookingNotFound() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-2 px-4 text-center">
      <h1 className="text-lg font-semibold text-navy">예약 링크를 찾을 수 없습니다</h1>
      <p className="text-sm text-gray-500">
        링크가 만료되었거나 더 이상 예약을 받지 않는 페이지입니다. 담당자에게 문의해주세요.
      </p>
    </main>
  );
}
