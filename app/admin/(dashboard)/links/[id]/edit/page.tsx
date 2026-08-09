import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/supabase/dal";
import { createClient } from "@/lib/supabase/server";
import { LinkForm } from "@/components/admin/LinkForm";
import { updateBookingLink } from "../../actions";

export default async function EditBookingLinkPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireAdmin();
  const supabase = await createClient();

  const [{ data: link }, { data: templates }] = await Promise.all([
    supabase
      .from("booking_links")
      .select("id, name, duration_minutes, range_start_date, range_end_date, template_id")
      .eq("id", id)
      .eq("admin_id", user.id)
      .maybeSingle(),
    supabase
      .from("message_templates")
      .select("id, title")
      .eq("admin_id", user.id)
      .order("created_at", { ascending: true }),
  ]);

  if (!link) notFound();

  return (
    <div className="mx-auto max-w-md space-y-4">
      <h2 className="text-lg font-semibold text-navy">예약 링크 수정</h2>
      <LinkForm
        action={updateBookingLink.bind(null, link.id)}
        templates={templates ?? []}
        submitLabel="저장"
        defaultValues={link}
      />
    </div>
  );
}
