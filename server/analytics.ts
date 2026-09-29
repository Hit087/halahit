import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export async function trackEvent(
  type: string,
  path?: string,
  productId?: string,
  metadata?: Prisma.InputJsonValue
) {
  try {
    await prisma.analyticsEvent.create({
      data: {
        type,
        path,
        productId,
        metadata,
      },
    });
  } catch {
    // Non-blocking analytics
  }
}

export async function getAnalyticsSummary() {
  const [visits, orders, productViews] = await Promise.all([
    prisma.analyticsEvent.count({ where: { type: "PAGE_VIEW" } }),
    prisma.order.count(),
    prisma.analyticsEvent.groupBy({
      by: ["productId"],
      where: { type: "PRODUCT_VIEW", productId: { not: null } },
      _count: { productId: true },
      orderBy: { _count: { productId: "desc" } },
      take: 5,
    }),
  ]);

  const popularProductIds = productViews
    .map((p) => p.productId)
    .filter((id): id is string => !!id);

  const popularProducts =
    popularProductIds.length > 0
      ? await prisma.product.findMany({
          where: { id: { in: popularProductIds } },
          include: { images: { orderBy: { sortOrder: "asc" }, take: 1 } },
        })
      : [];

  const orderedPopular = popularProductIds
    .map((id) => popularProducts.find((p) => p.id === id))
    .filter(Boolean);

  return {
    totalVisits: visits,
    totalOrders: orders,
    popularProducts: orderedPopular,
    productViewCounts: productViews,
  };
}

// ==================== المبيعات (للرسم البياني) ====================

export type SalesDay = {
  date: string; // YYYY-MM-DD بتوقيت الرياض
  total: number;
  orders: number;
};

const RIYADH_OFFSET_MS = 3 * 60 * 60 * 1000; // الرياض UTC+3 بدون توقيت صيفي
const SALES_DAYS = 90;

function pad(n: number) {
  return String(n).padStart(2, "0");
}

// المبيعات = كل الطلبات ما عدا الملغية (CANCELLED)
export async function getSalesSummary() {
  const nowRiyadh = new Date(Date.now() + RIYADH_OFFSET_MS);
  const year = nowRiyadh.getUTCFullYear();
  const month = nowRiyadh.getUTCMonth();
  const day = nowRiyadh.getUTCDate();

  // بداية أول يوم بالفترة (بتوقيت الرياض) محوّلة لـ UTC
  const startUtc = new Date(
    Date.UTC(year, month, day - (SALES_DAYS - 1)) - RIYADH_OFFSET_MS
  );

  const [allTime, recentOrders] = await Promise.all([
    prisma.order.aggregate({
      where: { status: { not: "CANCELLED" } },
      _sum: { total: true },
      _count: true,
    }),
    prisma.order.findMany({
      where: { status: { not: "CANCELLED" }, createdAt: { gte: startUtc } },
      select: { total: true, createdAt: true },
    }),
  ]);

  const buckets = new Map<string, SalesDay>();
  for (let i = SALES_DAYS - 1; i >= 0; i--) {
    const d = new Date(Date.UTC(year, month, day - i));
    const key = `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(
      d.getUTCDate()
    )}`;
    buckets.set(key, { date: key, total: 0, orders: 0 });
  }

  for (const order of recentOrders) {
    const shifted = new Date(order.createdAt.getTime() + RIYADH_OFFSET_MS);
    const key = `${shifted.getUTCFullYear()}-${pad(
      shifted.getUTCMonth() + 1
    )}-${pad(shifted.getUTCDate())}`;
    const bucket = buckets.get(key);
    if (bucket) {
      bucket.total += Number(order.total);
      bucket.orders += 1;
    }
  }

  const totalSales = Number(allTime._sum.total ?? 0);
  const salesOrderCount = allTime._count;

  return {
    totalSales,
    salesOrderCount,
    averageOrder: salesOrderCount > 0 ? totalSales / salesOrderCount : 0,
    days: Array.from(buckets.values()),
  };
}
