"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/supabase/dal";
import { createClient } from "@/lib/supabase/server";

export async function createTemplate(formData: FormData) {
  const user = await requireAdmin();
  const supabase = await createClient();

  const title = String(formData.get("title") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  if (!title || !body) return;

  await supabase.from("message_templates").insert({ admin_id: user.id, title, body });

  revalidatePath("/admin/templates");
}

export async function updateTemplate(id: string, formData: FormData) {
  const user = await requireAdmin();
  const supabase = await createClient();

  const title = String(formData.get("title") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  if (!title || !body) return;

  await supabase
    .from("message_templates")
    .update({ title, body, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("admin_id", user.id);

  revalidatePath("/admin/templates");
}

export async function deleteTemplate(id: string) {
  const user = await requireAdmin();
  const supabase = await createClient();

  await supabase.from("message_templates").delete().eq("id", id).eq("admin_id", user.id);

  revalidatePath("/admin/templates");
}
