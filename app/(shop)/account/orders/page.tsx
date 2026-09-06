import { redirect } from "next/navigation";
import Link from "next/link";
import { requireCustomer } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/lib/utils";

const statusLabels: Record<string, string> = {
  PENDING: "قيد الانتظار",
  CONFIRMED: "مؤكد",
  DELIVERED: "تم التوصيل",
  CANCELLED: "ملغي",
};

export default async function AccountOrdersPage() {
  const session = await requireCustomer();
  if (!session?.user?.id) redirect("/account/login");

  const orders = await prisma.order.findMany({
    where: { customerId: session.user.id },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
      <h1 className="font-display text-3xl font-bold">طلباتي</h1>

      <div className="mt-8 space-y-4">
        {orders.map((order) => (
          <Link
            key={order.id}
            href={`/orders/${order.trackingToken}`}
            className="block rounded-luxury-lg bg-white p-4 shadow-soft"
          >
            <div className="flex items-center justify-between">
              <p className="font-semibold">#{order.orderNumber}</p>
              <span className="text-sm text-accent">{statusLabels[order.status]}</span>
            </div>
            <p className="mt-1 text-sm text-text/60">
              {new Date(order.createdAt).toLocaleDateString("ar-SA")} · {formatPrice(Number(order.total))}
            </p>
          </Link>
        ))}
        {orders.length === 0 && (
          <p className="text-center text-text/50 py-12">لا توجد طلبات بعد</p>
        )}
      </div>
    </div>
  );
}
