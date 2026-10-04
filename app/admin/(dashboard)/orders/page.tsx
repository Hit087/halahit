import Link from "next/link";
import { getOrderStats } from "@/server/analytics";
import { Card } from "@/components/ui/Card";
import { formatPrice } from "@/lib/utils";

export const dynamic = "force-dynamic";

const RANGES: { key: string; days: number | null; label: string }[] = [
  { key: "7", days: 7, label: "7 أيام" },
  { key: "30", days: 30, label: "30 يوم" },
  { key: "90", days: 90, label: "90 يوم" },
  { key: "all", days: null, label: "الكل" },
];

const STATUS_LABELS: Record<string, string> = {
  PENDING: "قيد الانتظار",
  CONFIRMED: "مؤكد",
  DELIVERED: "تم التوصيل",
  CANCELLED: "ملغي",
  // قيم قديمة موجودة بالقاعدة وما يستخدمها الكود
  PROCESSING: "قيد التجهيز",
  SHIPPED: "تم الشحن",
};

function BarRow({
  label,
  value,
  max,
  note,
}: {
  label: string;
  value: number;
  max: number;
  note?: string;
}) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3 text-sm">
        <span className="font-medium">{label}</span>
        <span className="text-text/60">
          <span className="font-bold text-accent">{value}</span>
          {note ? ` — ${note}` : ""}
        </span>
      </div>
      <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-beige/50">
        <div
          className="h-full rounded-full bg-accent/80"
          style={{ width: `${Math.max(pct, value > 0 ? 3 : 0)}%` }}
        />
      </div>
    </div>
  );
}

export default async function AdminStatsPage({
  searchParams,
}: {
  searchParams: { range?: string };
}) {
  const active = RANGES.find((r) => r.key === searchParams.range) ?? RANGES[1];
  const stats = await getOrderStats(active.days);

  const maxProduct = Math.max(0, ...stats.topProducts.map((p) => p.quantity));
  const maxStatus = Math.max(0, ...stats.statuses.map((s) => s.count));
  const maxPayment = Math.max(0, ...stats.payments.map((s) => s.count));
  const maxFulfillment = Math.max(0, ...stats.fulfillments.map((s) => s.count));
  const maxHour = Math.max(0, ...stats.hours);
  const peakHour = maxHour > 0 ? stats.hours.indexOf(maxHour) : -1;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold">إحصائيات الطلبات</h1>
          <p className="mt-1 text-text/60">الأرقام بدون الطلبات الملغية، إلا توزيع الحالات</p>
        </div>
        <Link href="/admin" className="text-sm text-accent hover:underline">
          الرجوع للوحة التحكم
        </Link>
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        {RANGES.map((r) => (
          <Link
            key={r.key}
            href={`/admin/stats?range=${r.key}`}
            className={`rounded-luxury px-4 py-2 text-sm transition ${
              r.key === active.key
                ? "bg-primary font-medium text-text"
                : "bg-cream text-text/70 hover:bg-beige/60"
            }`}
          >
            {r.label}
          </Link>
        ))}
      </div>

      <div className="mt-6 grid gap-6 sm:grid-cols-3">
        <Card>
          <p className="text-sm text-text/60">عدد الطلبات</p>
          <p className="mt-2 text-3xl font-bold text-accent">{stats.summary.orders}</p>
        </Card>
        <Card>
          <p className="text-sm text-text/60">المبيعات</p>
          <p className="mt-2 text-3xl font-bold text-accent">
            {formatPrice(stats.summary.revenue)}
          </p>
        </Card>
        <Card>
          <p className="text-sm text-text/60">متوسط قيمة الطلب</p>
          <p className="mt-2 text-3xl font-bold text-accent">
            {formatPrice(stats.summary.average)}
          </p>
        </Card>
      </div>

      <section className="mt-10">
        <h2 className="mb-4 text-xl font-semibold">المنتجات الأكثر طلبًا</h2>
        <Card>
          {stats.topProducts.length === 0 ? (
            <p className="text-text/50">لا توجد طلبات بهذي الفترة</p>
          ) : (
            <div className="space-y-4">
              {stats.topProducts.map((p) => (
                <BarRow
                  key={p.productId}
                  label={p.name}
                  value={p.quantity}
                  max={maxProduct}
                  note={formatPrice(p.revenue)}
                />
              ))}
            </div>
          )}
        </Card>
      </section>

      <div className="mt-10 grid gap-6 lg:grid-cols-2">
        <section>
          <h2 className="mb-4 text-xl font-semibold">حالات الطلبات</h2>
          <Card>
            {stats.statuses.length === 0 ? (
              <p className="text-text/50">لا توجد بيانات</p>
            ) : (
              <div className="space-y-4">
                {stats.statuses.map((s) => (
                  <BarRow
                    key={s.status}
                    label={STATUS_LABELS[s.status] ?? s.status}
                    value={s.count}
                    max={maxStatus}
                  />
                ))}
              </div>
            )}
          </Card>
        </section>

        <section>
          <h2 className="mb-4 text-xl font-semibold">طرق الدفع</h2>
          <Card>
            {stats.payments.length === 0 ? (
              <p className="text-text/50">لا توجد بيانات</p>
            ) : (
              <div className="space-y-4">
                {stats.payments.map((s) => (
                  <BarRow
                    key={s.label}
                    label={s.label}
                    value={s.count}
                    max={maxPayment}
                    note={formatPrice(s.total)}
                  />
                ))}
              </div>
            )}
          </Card>
        </section>

        <section>
          <h2 className="mb-4 text-xl font-semibold">طرق الاستلام والتوصيل</h2>
          <Card>
            {stats.fulfillments.length === 0 ? (
              <p className="text-text/50">لا توجد بيانات</p>
            ) : (
              <div className="space-y-4">
                {stats.fulfillments.map((s) => (
                  <BarRow
                    key={s.label}
                    label={s.label}
                    value={s.count}
                    max={maxFulfillment}
                    note={formatPrice(s.total)}
                  />
                ))}
              </div>
            )}
          </Card>
        </section>

        <section>
          <h2 className="mb-4 text-xl font-semibold">ساعات الذروة</h2>
          <Card>
            {peakHour < 0 ? (
              <p className="text-text/50">لا توجد بيانات</p>
            ) : (
              <>
                <p className="text-sm text-text/70">
                  أكثر ساعة طلبات:{" "}
                  <span className="font-bold text-accent">
                    {String(peakHour).padStart(2, "0")}:00
                  </span>{" "}
                  ({maxHour} طلب) — بتوقيت الرياض
                </p>
                <div dir="ltr" className="mt-4 flex h-32 items-end gap-[3px] border-b border-beige">
                  {stats.hours.map((count, h) => (
                    <div
                      key={h}
                      title={`${String(h).padStart(2, "0")}:00 — ${count} طلب`}
                      aria-label={`${String(h).padStart(2, "0")}:00 — ${count} طلب`}
                      className="flex h-full min-w-0 flex-1 items-end"
                    >
                      <span
                        className={`block w-full rounded-t-sm ${
                          h === peakHour ? "bg-text" : count > 0 ? "bg-accent/80" : "bg-beige"
                        }`}
                        style={{
                          height:
                            count > 0 ? `${Math.max((count / maxHour) * 100, 4)}%` : "2px",
                        }}
                      />
                    </div>
                  ))}
                </div>
                <div dir="ltr" className="mt-2 flex justify-between text-xs text-text/50">
                  <span>00</span>
                  <span>06</span>
                  <span>12</span>
                  <span>18</span>
                  <span>23</span>
                </div>
              </>
            )}
          </Card>
        </section>
      </div>
    </div>
  );
}
