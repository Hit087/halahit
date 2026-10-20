import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/lib/utils";
import { getClientIp, rateLimit } from "@/lib/rate-limit";

// بيانات طلب خاصة: ما تنخزّن بالكاش أبدًا
export const dynamic = "force-dynamic";

// ما تظهر بنتائج قوقل، وما يتسرّب الرابط (فيه رمز التتبع) للمواقع الخارجية
export const metadata: Metadata = {
  title: "تتبع الطلب",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

const statusLabels: Record<string, string> = {
  PENDING: "قيد الانتظار",
  CONFIRMED: "مؤكد",
  DELIVERED: "تم التوصيل",
  CANCELLED: "ملغي",
  PROCESSING: "قيد التجهيز",
  SHIPPED: "تم الشحن",
};

const statusColors: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-700",
  CONFIRMED: "bg-blue-100 text-blue-700",
  DELIVERED: "bg-green-100 text-green-700",
  CANCELLED: "bg-red-100 text-red-700",
  PROCESSING: "bg-blue-100 text-blue-700",
  SHIPPED: "bg-blue-100 text-blue-700",
};

export default async function OrderTrackingPage({
  params,
}: {
  params: { token: string };
}) {
  // حد للمحاولات: يمنع تجربة رموز كثيرة لتخمين طلبات الناس
  const ip = getClientIp();
  if (!rateLimit(`track:${ip}`, 30, 60 * 1000)) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center sm:px-6">
        <p className="text-text/70">طلبات كثيرة خلال وقت قصير، الرجاء المحاولة بعد دقيقة.</p>
      </div>
    );
  }

  // رمز بطول غير منطقي ما يوصل للقاعدة أصلًا
  if (params.token.length < 10 || params.token.length > 100) notFound();

  const order = await prisma.order.findUnique({
    where: { trackingToken: params.token },
    include: { items: true },
  });

  if (!order) notFound();

  return (
    <div className="mx-auto max-w-lg px-4 py-16 sm:px-6">
      <h1 className="font-display text-3xl font-bold">تتبع الطلب</h1>
      <p className="mt-1 text-text/60">رقم الطلب: {order.orderNumber}</p>
      <p className="mt-1 text-sm text-text/50">
        {order.createdAt.toLocaleDateString("ar-SA", {
          timeZone: "Asia/Riyadh",
          year: "numeric",
          month: "long",
          day: "numeric",
        })}
      </p>

      <div className="mt-6 rounded-luxury-lg bg-white p-5 shadow-soft">
        <span
          className={`inline-block rounded-full px-4 py-1.5 text-sm font-semibold ${
            statusColors[order.status] ?? "bg-gray-100 text-gray-700"
          }`}
        >
          {statusLabels[order.status] ?? order.status}
        </span>

        <div className="mt-6 space-y-2">
          {order.items.map((item) => (
            <div key={item.id} className="flex justify-between text-sm">
              <span>{item.productName} × {item.quantity}</span>
              <span>{formatPrice(Number(item.price) * item.quantity)}</span>
            </div>
          ))}
        </div>

        <div className="mt-4 border-t border-beige pt-4 flex justify-between font-bold">
          <span>الإجمالي</span>
          <span className="text-accent">{formatPrice(Number(order.total))}</span>
        </div>

        {order.fulfillmentMethod && (
          <p className="mt-4 text-sm text-text/60">طريقة الاستلام: {order.fulfillmentMethod}</p>
        )}
      </div>
    </div>
  );
}
