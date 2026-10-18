import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";
import { buildXlsxMulti } from "@/lib/xlsx";

export const dynamic = "force-dynamic";

const RIYADH_OFFSET_MS = 3 * 60 * 60 * 1000;

// تاريخ ووقت بتوقيت الرياض: 2026-10-18 02:15
function riyadh(date: Date): string {
  const iso = new Date(date.getTime() + RIYADH_OFFSET_MS).toISOString();
  return `${iso.slice(0, 10)} ${iso.slice(11, 16)}`;
}

const STATUS_LABELS: Record<string, string> = {
  PENDING: "قيد الانتظار",
  CONFIRMED: "مؤكد",
  DELIVERED: "تم التوصيل",
  CANCELLED: "ملغي",
  PROCESSING: "قيد التجهيز",
  SHIPPED: "تم الشحن",
};

export async function GET() {
  const session = await requireAdmin();
  if (!session) {
    return new Response("غير مصرح", { status: 401 });
  }

  // الملف فيه بيانات شخصية، فنحدّ التنزيل
  const adminKey = session.user?.email ?? "admin";
  if (!rateLimit(`backup:${adminKey}`, 10, 60 * 60 * 1000)) {
    return new Response("محاولات كثيرة، حاول لاحقًا", { status: 429 });
  }

  const [orders, customers, subscribers] = await Promise.all([
    prisma.order.findMany({
      orderBy: { createdAt: "asc" },
      include: { items: true },
    }),
    prisma.user.findMany({
      where: { role: "CUSTOMER" },
      orderBy: { createdAt: "asc" },
      select: {
        name: true,
        email: true,
        phone: true,
        createdAt: true,
        _count: { select: { orders: true, wishlist: true, reviews: true } },
      },
    }),
    prisma.newsletterSubscriber.findMany({ orderBy: { createdAt: "asc" } }),
  ]);

  // ==== الطلبات ====
  const orderRows = orders.map((o) => [
    o.orderNumber,
    riyadh(o.createdAt),
    STATUS_LABELS[o.status] ?? o.status,
    o.customerName ?? "",
    o.customerPhone ?? "",
    o.customerEmail ?? "",
    o.customerId ? "نعم" : "لا",
    Number(o.subtotal),
    Number(o.discount),
    o.couponCode ?? "",
    o.vatAmount === null ? "" : Number(o.vatAmount),
    o.fulfillmentMethod ?? "",
    o.fulfillmentPrice === null ? "" : Number(o.fulfillmentPrice),
    o.paymentMethod ?? "",
    Number(o.total),
    o.locationLink ?? "",
  ]);

  // ==== تفاصيل الطلبات (سطر لكل منتج) ====
  const itemRows: (string | number)[][] = [];
  for (const o of orders) {
    for (const item of o.items) {
      itemRows.push([
        o.orderNumber,
        item.productName,
        item.quantity,
        Number(item.price),
        Number(item.price) * item.quantity,
      ]);
    }
  }

  // ==== العملاء (بدون كلمات المرور ولا أي بيانات دخول) ====
  const customerRows = customers.map((c) => [
    c.name ?? "",
    c.email,
    c.phone ?? "",
    riyadh(c.createdAt),
    c._count.orders,
    c._count.wishlist,
    c._count.reviews,
  ]);

  const subscriberRows = subscribers.map((s) => [s.email, riyadh(s.createdAt)]);

  const now = new Date();
  const infoRows = [
    ["البند", "القيمة"],
    ["تاريخ النسخة (بتوقيت الرياض)", riyadh(now)],
    ["عدد الطلبات", orders.length],
    ["عدد سطور تفاصيل الطلبات", itemRows.length],
    ["عدد العملاء", customers.length],
    ["عدد مشتركي النشرة", subscribers.length],
    ["ملاحظة", "هذا الملف فيه بيانات شخصية للعملاء، احفظه بمكان آمن ولا تشاركه."],
  ];

  const xlsx = buildXlsxMulti([
    {
      name: "Orders",
      rows: [
        [
          "orderNumber",
          "createdAt",
          "status",
          "customerName",
          "customerPhone",
          "customerEmail",
          "hasAccount",
          "subtotal",
          "discount",
          "couponCode",
          "vatAmount",
          "fulfillmentMethod",
          "fulfillmentPrice",
          "paymentMethod",
          "total",
          "locationLink",
        ],
        ...orderRows,
      ],
      widths: [16, 18, 14, 22, 16, 28, 11, 10, 10, 14, 10, 18, 12, 14, 10, 40],
    },
    {
      name: "OrderItems",
      rows: [
        ["orderNumber", "productName", "quantity", "unitPrice", "lineTotal"],
        ...itemRows,
      ],
      widths: [16, 40, 10, 10, 10],
    },
    {
      name: "Customers",
      rows: [
        ["name", "email", "phone", "createdAt", "orders", "wishlistItems", "reviews"],
        ...customerRows,
      ],
      widths: [22, 30, 16, 18, 8, 12, 8],
    },
    {
      name: "Newsletter",
      rows: [["email", "subscribedAt"], ...subscriberRows],
      widths: [32, 18],
    },
    { name: "Info", rows: infoRows, widths: [32, 60] },
  ]);

  const day = riyadh(now).slice(0, 10);
  return new Response(new Uint8Array(xlsx), {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="hit-backup-${day}.xlsx"`,
      "Cache-Control": "no-store",
    },
  });
}
