import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { AdminSidebar } from "@/components/admin/AdminSidebar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireAdmin();
  if (!session) redirect("/admin/login");

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-cream" dir="rtl">
      <AdminSidebar />
      <div className="flex-1 overflow-auto p-4 md:p-8">{children}</div>
    </div>
  );
}
