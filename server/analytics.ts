import { Prisma, OrderStatus } from "@prisma/client";
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
  const [visits, orders, productViewsTotal, productViews] = await Promise.all([
    prisma.analyticsEvent.count({ where: { type: "PAGE_VIEW" } }),
    prisma.order.count(),
    prisma.analyticsEvent.count({ where: { type: "PRODUCT_VIEW" } }),
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
    totalProductViews: productViewsTotal,
    popularProducts: orderedPopular,
    productViewCounts: productViews,
  };
}

// ==================== أدوات التاريخ (توقيت الرياض) ====================

const RIYADH_OFFSET_MS = 3 * 60 * 60 * 1000; // الرياض UTC+3 بدون توقيت صيفي

function pad(n: number) {
  return String(n).padStart(2, "0");
}

// بداية أول يوم بالفترة (بتوقيت الرياض) محوّلة لـ UTC
function riyadhDayStart(daysInclusive: number) {
  const nowRiyadh = new Date(Date.now() + RIYADH_OFFSET_MS);
  return new Date(
    Date.UTC(
      nowRiyadh.getUTCFullYear(),
      nowRiyadh.getUTCMonth(),
      nowRiyadh.getUTCDate() - (daysInclusive - 1)
    ) - RIYADH_OFFSET_MS
  );
}

// ==================== المبيعات (للرسم البياني) ====================

export type SalesDay = {
  date: string; // YYYY-MM-DD بتوقيت الرياض
  total: number;
  orders: number;
};

const SALES_DAYS = 90;

// المبيعات = كل الطلبات ما عدا الملغية (CANCELLED)
export async function getSalesSummary() {
  const nowRiyadh = new Date(Date.now() + RIYADH_OFFSET_MS);
  const year = nowRiyadh.getUTCFullYear();
  const month = nowRiyadh.getUTCMonth();
  const day = nowRiyadh.getUTCDate();

  const startUtc = riyadhDayStart(SALES_DAYS);

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

// ==================== إحصائيات الطلبات التفصيلية ====================

export type StatGroup = { label: string; count: number; total: number };
export type TopProduct = {
  productId: string;
  name: string;
  quantity: number;
  revenue: number;
};

// days = null يعني كل الفترة. المبيعات والمنتجات والطرق بدون الطلبات الملغية،
// أما توزيع الحالات فيشمل كل الحالات (بما فيها الملغية).
export async function getOrderStats(days: number | null) {
  const start = days ? riyadhDayStart(days) : null;
  const dateWhere: Prisma.OrderWhereInput = start
    ? { createdAt: { gte: start } }
    : {};
  const activeWhere: Prisma.OrderWhereInput = {
    ...dateWhere,
    status: { not: OrderStatus.CANCELLED },
  };

  const [statusGroups, paymentGroups, fulfillmentGroups, activeOrders, items] =
    await Promise.all([
      prisma.order.groupBy({
        by: ["status"],
        where: dateWhere,
        _count: { _all: true },
      }),
      prisma.order.groupBy({
        by: ["paymentMethod"],
        where: activeWhere,
        _count: { _all: true },
        _sum: { total: true },
      }),
      prisma.order.groupBy({
        by: ["fulfillmentMethod"],
        where: activeWhere,
        _count: { _all: true },
        _sum: { total: true },
      }),
      prisma.order.findMany({
        where: activeWhere,
        select: { total: true, createdAt: true },
      }),
      prisma.orderItem.findMany({
        where: { order: activeWhere },
        select: {
          productId: true,
          productName: true,
          quantity: true,
          price: true,
        },
      }),
    ]);

  // ملخص
  const revenue = activeOrders.reduce((sum, o) => sum + Number(o.total), 0);
  const ordersCount = activeOrders.length;

  // ساعات الذروة (بتوقيت الرياض)
  const hours: number[] = Array.from({ length: 24 }, () => 0);
  for (const o of activeOrders) {
    const h = new Date(o.createdAt.getTime() + RIYADH_OFFSET_MS).getUTCHours();
    hours[h] += 1;
  }

  // أكثر المنتجات طلبًا
  const productMap = new Map<string, TopProduct>();
  for (const it of items) {
    const existing = productMap.get(it.productId);
    const lineRevenue = Number(it.price) * it.quantity;
    if (existing) {
      existing.quantity += it.quantity;
      existing.revenue += lineRevenue;
    } else {
      productMap.set(it.productId, {
        productId: it.productId,
        name: it.productName,
        quantity: it.quantity,
        revenue: lineRevenue,
      });
    }
  }
  const topProducts = Array.from(productMap.values())
    .sort((a, b) => b.quantity - a.quantity || b.revenue - a.revenue)
    .slice(0, 10);

  const statuses = statusGroups
    .map((g) => ({ status: g.status as string, count: g._count._all }))
    .sort((a, b) => b.count - a.count);

  const payments: StatGroup[] = paymentGroups
    .map((g) => ({
      label: g.paymentMethod ?? "غير محدد",
      count: g._count._all,
      total: Number(g._sum.total ?? 0),
    }))
    .sort((a, b) => b.count - a.count);

  const fulfillments: StatGroup[] = fulfillmentGroups
    .map((g) => ({
      label: g.fulfillmentMethod ?? "غير محدد",
      count: g._count._all,
      total: Number(g._sum.total ?? 0),
    }))
    .sort((a, b) => b.count - a.count);

  return {
    summary: {
      orders: ordersCount,
      revenue,
      average: ordersCount > 0 ? revenue / ordersCount : 0,
    },
    statuses,
    payments,
    fulfillments,
    topProducts,
    hours,
  };
}
