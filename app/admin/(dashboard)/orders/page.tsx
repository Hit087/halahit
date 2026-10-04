import { getOrdersAdmin } from "@/server/queries";
import { formatPrice, decimalToNumber } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";
import { OrderStatusSelect } from "./OrderStatusSelect";

const statusLabels: Record<string, string> = {
  PENDING: "قيد الانتظار",
  CONFIRMED: "مؤكد",
  DELIVERED: "تم التوصيل",
  CANCELLED: "ملغي",
};

export default async function AdminOrdersPage() {
  const orders = await getOrdersAdmin();

  return (
    <div>
      <h1 className="font-display text-3xl font-bold mb-8">الطلبات</h1>

      <div className="space-y-4">
        {orders.map((order) => (
          <div key={order.id} className="rounded-luxury-lg bg-white p-6 shadow-soft">
            <div className="flex flex-wrap justify-between gap-4">
              <div>
                <p className="font-mono font-bold text-accent">{order.orderNumber}</p>
                <p className="text-sm text-text/60 mt-1">
                  {order.customerName} · {order.customerPhone}
                </p>
                <p className="text-xs text-text/50 mt-1">
                  {order.createdAt.toLocaleString("ar-SA")}
                </p>
              </div>
              <div className="text-left">
                <p className="text-xl font-bold">{formatPrice(decimalToNumber(order.total))}</p>
                {order.couponCode && (
                  <p className="text-sm text-green-600">كوبون: {order.couponCode}</p>
                )}
                <Badge className="mt-2">{statusLabels[order.status]}</Badge>
              </div>
            </div>

            <ul className="mt-4 border-t border-beige pt-4 space-y-1 text-sm">
              {order.items.map((item) => (
                <li key={item.id} className="flex justify-between">
                  <span>
                    {item.productName} × {item.quantity}
                  </span>
                  <span>{formatPrice(decimalToNumber(item.price) * item.quantity)}</span>
                </li>
              ))}
            </ul>

            <details className="mt-4">
              <summary className="cursor-pointer text-sm text-accent">رسالة واتساب</summary>
              <pre className="mt-2 whitespace-pre-wrap rounded-luxury bg-cream p-4 text-xs dir-ltr text-left">
                {order.whatsappMessage}
              </pre>
            </details>

            <OrderStatusSelect orderId={order.id} status={order.status} />
          </div>
        ))}
        {orders.length === 0 && (
          <p className="text-center text-text/50 py-12">لا توجد طلبات بعد</p>
        )}
      </div>
    </div>
  );
}
