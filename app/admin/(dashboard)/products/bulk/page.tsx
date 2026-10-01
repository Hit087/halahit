import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui/Card";
import { ProductImportForm } from "./ProductImportForm";

export const dynamic = "force-dynamic";

const COLUMNS: { key: string; note: string }[] = [
  { key: "id", note: "معرّف المنتج. اتركه فاضي لإضافة منتج جديد، ولا تغيّره لمنتج موجود." },
  { key: "name / name_en", note: "اسم المنتج بالعربي والإنجليزي (مطلوبين)." },
  { key: "description / description_en", note: "الوصف بالعربي (مطلوب) والإنجليزي (اختياري)." },
  { key: "price", note: "السعر (اختياري)." },
  { key: "stock", note: "الكمية. اتركها فاضية مثل ما تسوي بنموذج المنتج." },
  { key: "category_slug", note: "اختصار التصنيف، شوف الجدول تحت. هذا العمود المعتمد." },
  { key: "category", note: "اسم التصنيف، للقراءة فقط. يُستخدم بس إذا category_slug فاضي." },
  { key: "active / featured", note: "true أو false. إذا تركتها فاضية تبقى القيمة الحالية (أو نشط للمنتج الجديد)." },
  { key: "images", note: "روابط الصور للمنتجات الجديدة فقط، تفصل بينها بـ | . التحديث ما يلمس الصور." },
];

export default async function BulkProductsPage() {
  const categories = await prisma.category.findMany({
    orderBy: { sortOrder: "asc" },
    select: { id: true, name: true, slug: true },
  });

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold">استيراد وتصدير المنتجات</h1>
          <p className="mt-1 text-text/60">
            نزّل المنتجات بملف CSV، عدّله بـExcel أو Google Sheets، وارفعه مرة ثانية.
          </p>
        </div>
        <Link href="/admin/products" className="text-sm text-accent hover:underline">
          الرجوع للمنتجات
        </Link>
      </div>

      <section className="mt-8">
        <h2 className="mb-4 text-xl font-semibold">1) التصدير</h2>
        <Card>
          <div className="flex flex-wrap gap-3">
            <a
              href="/api/admin/products/export"
              className="rounded-luxury bg-accent px-5 py-2.5 text-sm font-medium text-white transition hover:opacity-90"
            >
              تنزيل كل المنتجات
            </a>
            <a
              href="/api/admin/products/export?template=1"
              className="rounded-luxury bg-cream px-5 py-2.5 text-sm font-medium text-text transition hover:bg-beige/60"
            >
              تنزيل قالب فاضي (لإضافة منتجات جديدة)
            </a>
          </div>
          <p className="mt-4 text-sm text-text/60">
            لما تحفظ الملف بعد التعديل، اختر صيغة <strong>CSV UTF-8</strong> عشان العربي ما
            يتخرب. إذا فتح الملف بعمود واحد بالكمبيوتر، استخدم Data ثم From Text/CSV.
          </p>
        </Card>
      </section>

      <section className="mt-10">
        <h2 className="mb-4 text-xl font-semibold">2) الاستيراد</h2>
        <Card>
          <ProductImportForm />
          <ul className="mt-6 list-disc space-y-1 pr-5 text-sm text-text/70">
            <li>الاستيراد كله أو ولا شي: إذا فيه خطأ بأي سطر ما ينحفظ شي، وتطلع لك قائمة الأخطاء.</li>
            <li>السطر اللي فيه معرّف يحدّث المنتج الموجود. السطر بدون معرّف يضيف منتج جديد.</li>
            <li>المنتج الجديد بدون صور ينحفظ معطّل لين تضيف له صورة من صفحة التعديل.</li>
            <li>الحد الأقصى 200 صف بالملف الواحد.</li>
            <li>إذا استخدمت القالب، احذف صف المثال قبل الرفع.</li>
          </ul>
        </Card>
      </section>

      <section className="mt-10">
        <h2 className="mb-4 text-xl font-semibold">شرح الأعمدة</h2>
        <Card>
          <dl className="space-y-3 text-sm">
            {COLUMNS.map((c) => (
              <div key={c.key}>
                <dt dir="ltr" className="inline-block rounded bg-cream px-2 py-0.5 font-mono text-xs">
                  {c.key}
                </dt>
                <dd className="mt-1 text-text/70">{c.note}</dd>
              </div>
            ))}
          </dl>
        </Card>
      </section>

      <section className="mt-10">
        <h2 className="mb-4 text-xl font-semibold">التصنيفات المتاحة</h2>
        <Card>
          {categories.length === 0 ? (
            <p className="text-text/50">لا توجد تصنيفات</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-beige">
                    <th className="p-3 text-right">الاسم</th>
                    <th className="p-3 text-right">category_slug</th>
                  </tr>
                </thead>
                <tbody>
                  {categories.map((c) => (
                    <tr key={c.id} className="border-b border-beige/50">
                      <td className="p-3">{c.name}</td>
                      <td dir="ltr" className="p-3 text-right font-mono text-xs">
                        {c.slug}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </section>
    </div>
  );
}
