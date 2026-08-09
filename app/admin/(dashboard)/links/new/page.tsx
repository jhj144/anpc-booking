import { requireAdmin } from "@/lib/supabase/dal";
import { createClient } from "@/lib/supabase/server";
import { LinkForm } from "@/components/admin/LinkForm";
import { createBookingLink } from "../actions";

export default async function NewBookingLinkPage() {
  const user = await requireAdmin();
  const supabase = await createClient();

  const { data: templates } = await supabase
    .from("message_templates")
    .select("id, title")
    .eq("admin_id", user.id)
    .order("created_at", { ascending: true });

  return (
    <div className="mx-auto max-w-md space-y-4">
      <h2 className="text-lg font-semibold text-navy">새 예약 링크 생성</h2>
      <LinkForm action={createBookingLink} templates={templates ?? []} submitLabel="생성" />
    </div>
  );
}
