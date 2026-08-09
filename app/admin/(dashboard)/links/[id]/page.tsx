import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/supabase/dal";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { BookingRow } from "@/components/admin/BookingRow";
import { formatDateLabel } from "@/lib/dates";
import { toggleBookingLinkStatus } from "../actions";

export default async function LinkDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireAdmin();
  const supabase = await createClient();

  const { data: link } = await supabase
    .from("booking_links")
    .select("id, slug, name, status, duration_minutes, range_start_date, range_end_date, template_id")
    .eq("id", id)
    .eq("admin_id", user.id)
    .maybeSingle();

  if (!link) notFound();

  const [{ data: template }, { data: bookings }] = await Promise.all([
    link.template_id
      ? supabase.from("message_templates").select("body").eq("id", link.template_id).maybeSingle()
      : Promise.resolve({ data: null }),
    supabase
      .from("bookings")
      .select("id, booking_date, start_time")
      .eq("booking_link_id", link.id)
      .eq("status", "confirmed")
      .order("booking_date", { ascending: true })
      .order("start_time", { ascending: true }),
  ]);

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const nextStatus = link.status === "active" ? "archived" : "active";

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin" className="text-sm text-gray-400 hover:text-navy">
          ← 예약 링크 목록
        </Link>
      </div>

      <Card>
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold text-navy">{link.name}</h2>
              {link.status === "archived" && (
                <span className="rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-500">보관됨</span>
              )}
            </div>
            <p className="mt-1 text-sm text-gray-500">{link.duration_minutes}분</p>
            <p className="mt-1 text-xs text-gray-400">
              {formatDateLabel(link.range_start_date)} ~ {formatDateLabel(link.range_end_date)}
            </p>
          </div>
          <Link href={`/admin/links/${link.id}/edit`}>
            <Button variant="secondary">수정</Button>
          </Link>
        </div>

        <div className="mt-4 rounded-md border border-border bg-navy-50/40 px-3 py-2">
          <p className="truncate text-xs text-gray-600">{appUrl}/book/{link.slug}</p>
        </div>

        <form action={toggleBookingLinkStatus.bind(null, link.id, nextStatus)} className="mt-3">
          <button type="submit" className="text-xs text-gray-400 hover:text-navy">
            {link.status === "active" ? "링크 보관하기" : "링크 다시 활성화"}
          </button>
        </form>
      </Card>

      <section>
        <h3 className="mb-3 text-sm font-semibold text-navy">확정된 예약</h3>
        {!bookings || bookings.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-gray-400">
            아직 확정된 예약이 없습니다.
          </p>
        ) : (
          <div className="space-y-2">
            {bookings.map((booking) => (
              <BookingRow
                key={booking.id}
                linkId={link.id}
                bookingId={booking.id}
                bookingDate={booking.booking_date}
                startTime={booking.start_time.slice(0, 5)}
                templateBody={template?.body ?? null}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
