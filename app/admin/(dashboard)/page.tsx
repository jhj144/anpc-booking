import Link from "next/link";
import { requireAdmin } from "@/lib/supabase/dal";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/Button";
import { BookingLinkCard } from "@/components/admin/BookingLinkCard";

export default async function AdminHomePage() {
  const user = await requireAdmin();
  const supabase = await createClient();

  const { data: links } = await supabase
    .from("booking_links")
    .select("id, slug, name, status, duration_minutes, range_start_date, range_end_date")
    .eq("admin_id", user.id)
    .order("created_at", { ascending: false });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-navy">예약 링크</h2>
        <Link href="/admin/links/new">
          <Button>새 예약 생성</Button>
        </Link>
      </div>

      {!links || links.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-gray-400">
          아직 생성된 예약 링크가 없습니다. [새 예약 생성]으로 첫 링크를 만들어보세요.
        </p>
      ) : (
        <div className="space-y-4">
          {links.map((link) => (
            <BookingLinkCard
              key={link.id}
              id={link.id}
              name={link.name}
              status={link.status}
              durationMinutes={link.duration_minutes}
              rangeStartDate={link.range_start_date}
              rangeEndDate={link.range_end_date}
              shareUrl={`${appUrl}/book/${link.slug}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
