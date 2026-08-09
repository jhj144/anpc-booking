import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAvailableSlots } from "@/lib/slots";
import { todayKST, nowTimeKST } from "@/lib/dates";
import { BookingFlow } from "@/components/booking/BookingFlow";
import { Logo } from "@/components/ui/Logo";

export default async function BookingPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = createAdminClient();

  const { data: link } = await supabase
    .from("booking_links")
    .select("id, admin_id, slug, name, duration_minutes, range_start_date, range_end_date, status")
    .eq("slug", slug)
    .maybeSingle();

  if (!link || link.status !== "active") {
    notFound();
  }

  const today = todayKST();
  const viewStartDate = today > link.range_start_date ? today : link.range_start_date;
  const viewEndDate = link.range_end_date;

  if (viewStartDate > viewEndDate) {
    notFound();
  }

  const [{ data: availableRules }, { data: blockedSlots }, { data: confirmedBookings }] =
    await Promise.all([
      supabase
        .from("available_rules")
        .select("day_of_week, start_time, end_time, range_start_date, range_end_date")
        .eq("admin_id", link.admin_id)
        .lte("range_start_date", viewEndDate)
        .gte("range_end_date", viewStartDate),
      supabase
        .from("blocked_slots")
        .select("block_date, is_full_day, start_time, end_time")
        .eq("admin_id", link.admin_id)
        .gte("block_date", viewStartDate)
        .lte("block_date", viewEndDate),
      supabase
        .from("bookings")
        .select("booking_date, start_time, end_time")
        .eq("admin_id", link.admin_id)
        .eq("status", "confirmed")
        .gte("booking_date", viewStartDate)
        .lte("booking_date", viewEndDate),
    ]);

  const availability = getAvailableSlots({
    viewStartDate,
    viewEndDate,
    linkRangeStartDate: link.range_start_date,
    linkRangeEndDate: link.range_end_date,
    durationMinutes: link.duration_minutes,
    availableRules: availableRules ?? [],
    blockedSlots: blockedSlots ?? [],
    confirmedBookings: confirmedBookings ?? [],
    todayDate: today,
    nowTime: nowTimeKST(),
  });

  return (
    <main className="mx-auto max-w-md px-4 py-10">
      <div className="mb-6 flex justify-center">
        <Logo size={40} />
      </div>
      <BookingFlow
        slug={link.slug}
        linkName={link.name}
        durationMinutes={link.duration_minutes}
        rangeStartDate={viewStartDate}
        rangeEndDate={viewEndDate}
        initialAvailability={availability}
      />
    </main>
  );
}
