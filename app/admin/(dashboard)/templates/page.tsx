import { requireAdmin } from "@/lib/supabase/dal";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { TemplateItem } from "@/components/admin/TemplateItem";
import { createTemplate } from "./actions";

export default async function TemplatesPage() {
  const user = await requireAdmin();
  const supabase = await createClient();

  const { data: templates } = await supabase
    .from("message_templates")
    .select("id, title, body")
    .eq("admin_id", user.id)
    .order("created_at", { ascending: true });

  const myTemplates = templates ?? [];

  return (
    <div className="space-y-8">
      <section>
        <h2 className="mb-1 text-lg font-semibold text-navy">메시지 템플릿</h2>
        <p className="mb-4 text-sm text-gray-500">
          <code className="rounded bg-navy-50 px-1 py-0.5">{"{날짜}"}</code>{" "}
          <code className="rounded bg-navy-50 px-1 py-0.5">{"{시간}"}</code> 은 예약 확정 시
          자동으로 치환됩니다.
        </p>

        <Card>
          <form action={createTemplate} className="space-y-3">
            <p className="text-sm font-medium text-navy">새 템플릿 추가</p>
            <input
              name="title"
              placeholder="템플릿 이름"
              required
              className="w-full rounded-md border border-border px-3 py-2 text-sm outline-none focus:border-navy-300"
            />
            <textarea
              name="body"
              placeholder={"{날짜} {시간}에 미팅이 확정되었습니다."}
              required
              rows={4}
              className="w-full rounded-md border border-border px-3 py-2 text-sm outline-none focus:border-navy-300"
            />
            <Button type="submit" variant="secondary">
              추가
            </Button>
          </form>
        </Card>
      </section>

      <section>
        <h3 className="mb-3 text-sm font-semibold text-navy">내 템플릿</h3>
        {myTemplates.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-gray-400">
            아직 추가한 템플릿이 없습니다.
          </p>
        ) : (
          <div className="space-y-3">
            {myTemplates.map((t) => (
              <TemplateItem key={t.id} id={t.id} title={t.title} body={t.body} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
