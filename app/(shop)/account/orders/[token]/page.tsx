import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/lib/utils";

const statusLabels: Record<string, string> = {
  PENDING: "قيد الانتظار",
  CONFIRMED: "مؤكد",
  DELIVERED: "تم التوصيل",
  CANCELLED: "ملغي",
};

const statusColors: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-700",
  CONFIRMED: "bg-blue-100 text-blue-700",
  DELIVERED: "bg-green-100 text-green-700",
  CANCELLED: "bg-red-100 text-red-700",
};

export default async function OrderTrackingPage({
  params,
}: {
  params: { token: string };
}) {
  const order = await prisma.order.findUnique({
    where: { trackingToken: params.token },
    include: { items: true },
  });

  if (!order) notFound();

  return (
    <div className="mx-auto max-w-lg px-4 py-16 sm:px-6">
      <h1 className="font-display text-3xl font-bold">تتبع الطلب</h1>
      <p className="mt-1 text-text/60">رقم الطلب: {order.orderNumber}</p>

      <div className="mt-6 rounded-luxury-lg bg-white p-5 shadow-soft">
        <span
          className={`inline-block rounded-full px-4 py-1.5 text-sm font-semibold ${statusColors[order.status]}`}
        >
          {statusLabels[order.status]}
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
