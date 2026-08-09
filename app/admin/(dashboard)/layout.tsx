import { requireAdmin } from "@/lib/supabase/dal";
import { logout } from "@/app/admin/actions";
import { AdminNav } from "@/components/admin/AdminNav";
import { Logo } from "@/components/ui/Logo";

export default async function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireAdmin();

  return (
    <div className="min-h-screen bg-navy-50/40">
      <header className="border-b border-border bg-white">
        <div className="mx-auto flex max-w-3xl flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center justify-between sm:justify-start sm:gap-6">
            <div className="flex items-center gap-2">
              <Logo size={28} />
              <h1 className="text-base font-semibold text-navy">ANPC 예약 관리</h1>
            </div>
            <p className="text-xs text-gray-400">{user.email}</p>
          </div>
          <div className="flex items-center justify-between gap-3">
            <AdminNav />
            <form action={logout}>
              <button
                type="submit"
                className="whitespace-nowrap text-sm text-gray-400 hover:text-navy"
              >
                로그아웃
              </button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-8">{children}</main>
    </div>
  );
}
