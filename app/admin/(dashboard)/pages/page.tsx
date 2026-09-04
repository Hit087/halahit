import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/Badge";
import { PageForm } from "./PageForm";
import { DeletePageButton } from "./DeletePageButton";

export default async function AdminPagesPage() {
  const pages = await prisma.page.findMany({
    orderBy: { sortOrder: "asc" },
  });

  return (
    <div>
      <h1 className="font-display text-3xl font-bold mb-8">الصفحات</h1>
      <p className="mb-6 text-sm text-text/60">
        أنشئ صفحات مثل الشروط والأحكام، سياسة الخصوصية، الاستبدال والاسترجاع، أو أي صفحة أخرى.
        كل صفحة تظهر على الموقع تلقائيًا على الرابط /pages/المسار
      </p>

      <div className="grid gap-8 lg:grid-cols-2">
        <div>
          <h2 className="text-lg font-semibold mb-4">إضافة صفحة جديدة</h2>
          <PageForm />
        </div>

        <div className="space-y-4">
          <h2 className="text-lg font-semibold">الصفحات الحالية</h2>
          {pages.map((page) => (
            <div
              key={page.id}
              className="rounded-luxury-lg bg-white p-4 shadow-soft"
            >
              <div className="flex items-center gap-2">
                <p className="font-medium">{page.title}</p>
                <Badge variant={page.active ? "success" : "muted"}>
                  {page.active ? "نشطة" : "معطّلة"}
                </Badge>
              </div>
              <p className="text-sm text-text/60">/pages/{page.slug}</p>
              <PageForm page={page} compact />
              <DeletePageButton id={page.id} />
            </div>
          ))}
          {pages.length === 0 && (
            <p className="text-center text-text/50 py-12">لا توجد صفحات مضافة بعد</p>
          )}
        </div>
      </div>
    </div>
  );
}
