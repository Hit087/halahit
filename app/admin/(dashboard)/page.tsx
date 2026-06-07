import { getAnalyticsSummary } from "@/server/analytics";
import { Card } from "@/components/ui/Card";
import { formatPrice, decimalToNumber } from "@/lib/utils";
import Image from "next/image";

export default async function AdminDashboardPage() {
  const analytics = await getAnalyticsSummary();

  return (
    <div>
      <h1 className="font-display text-3xl font-bold">لوحة التحكم</h1>
      <p className="mt-1 text-text/60">مرحباً بك في إدارة Hit</p>

      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <p className="text-sm text-text/60">إجمالي الزيارات</p>
          <p className="mt-2 text-4xl font-bold text-accent">
            {analytics.totalVisits}
          </p>
        </Card>
        <Card>
          <p className="text-sm text-text/60">إجمالي الطلبات</p>
          <p className="mt-2 text-4xl font-bold text-accent">
            {analytics.totalOrders}
          </p>
        </Card>
        <Card>
          <p className="text-sm text-text/60">المنتجات الأكثر مشاهدة</p>
          <p className="mt-2 text-4xl font-bold text-accent">
            {analytics.popularProducts.length}
          </p>
        </Card>
      </div>

      <section className="mt-10">
        <h2 className="text-xl font-semibold mb-4">المنتجات الأكثر شعبية</h2>
        {analytics.popularProducts.length === 0 ? (
          <p className="text-text/50">لا توجد بيانات بعد</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {analytics.popularProducts.map((product) => {
              if (!product) return null;
              const views = analytics.productViewCounts.find(
                (v) => v.productId === product.id
              )?._count.productId ?? 0;
              const image = product.images[0]?.url;
              return (
                <Card key={product.id} className="flex gap-4 items-center">
                  {image && (
                    <div className="relative h-16 w-16 rounded-luxury overflow-hidden bg-beige flex-shrink-0">
                      <Image src={image} alt="" fill className="object-cover" />
                    </div>
                  )}
                  <div>
                    <p className="font-medium">{product.name}</p>
                    <p className="text-sm text-text/60">{views} مشاهدة</p>
                    <p className="text-accent font-bold">
                      {product.price ? formatPrice(decimalToNumber(product.price)) : "—"}
                    </p>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
