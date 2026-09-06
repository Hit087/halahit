"use server";

import { prisma } from "@/lib/prisma";
import { calculateDiscount } from "@/lib/coupon";
import { buildWhatsAppMessage, getWhatsAppUrl } from "@/lib/whatsapp";
import { generateOrderNumber } from "@/lib/utils";
import { checkoutSchema } from "@/lib/validations";
import { trackEvent } from "@/server/analytics";

const VAT_RATE = 0.15;

export async function processCheckout(data: unknown) {
  const parsed = checkoutSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false as const, error: "بيانات الطلب غير صالحة" };
  }

  const {
    customerName,
    customerPhone,
    couponCode,
    fulfillmentMethodId,
    paymentMethodId,
    locationLink,
    items,
  } = parsed.data;

  // ==== التحقق من طريقة الاستلام/التوصيل ====
  const fulfillmentMethod = await prisma.fulfillmentMethod.findFirst({
    where: { id: fulfillmentMethodId, active: true },
  });
  if (!fulfillmentMethod) {
    return { success: false as const, error: "طريقة الاستلام غير متاحة" };
  }
  if (fulfillmentMethod.type === "DELIVERY" && !locationLink) {
    return {
      success: false as const,
      error: "الرجاء تحديد موقع التوصيل (عبر الموقع الحالي أو لصق رابط الخريطة)",
    };
  }

  // ==== التحقق من طريقة الدفع ====
  const paymentMethod = await prisma.paymentMethod.findFirst({
    where: { id: paymentMethodId, active: true },
  });
  if (!paymentMethod) {
    return { success: false as const, error: "طريقة الدفع غير متاحة" };
  }
  if (paymentMethod.type === "GATEWAY") {
    return {
      success: false as const,
      error: "الدفع الإلكتروني غير مفعّل حاليًا، الرجاء اختيار الدفع عند الاستلام",
    };
  }

  const productIds = items.map((i) => i.productId);
  const products = await prisma.product.findMany({
    where: { id: { in: productIds }, active: true },
    include: { images: { orderBy: { sortOrder: "asc" }, take: 1 } },
  });

  if (products.length !== productIds.length) {
    return { success: false as const, error: "بعض المنتجات غير متوفرة" };
  }

  // ==== إضافة جديدة: التحقق من كفاية الكمية المتوفرة ====
  for (const item of items) {
    const product = products.find((p) => p.id === item.productId)!;
    if (product.stock !== null && product.stock < item.quantity) {
      return {
        success: false as const,
        error: `الكمية المتوفرة من "${product.name}" غير كافية (المتوفر: ${product.stock})`,
      };
    }
  }

  const validatedItems = items.map((item) => {
    const product = products.find((p) => p.id === item.productId)!;
    const price = Number(product.price);
    return {
      productId: product.id,
      name: product.name,
      nameEn: product.nameEn,
      price,
      quantity: item.quantity,
      imageUrl: product.images[0]?.url,
    };
  });

  const subtotal = validatedItems.reduce(
    (sum, i) => sum + i.price * i.quantity,
    0
  );

  let discount = 0;
  let appliedCoupon: string | undefined;

  if (couponCode) {
    const coupon = await prisma.coupon.findUnique({
      where: { code: couponCode.toUpperCase() },
    });
    if (!coupon) {
      return { success: false as const, error: "كود الخصم غير صالح" };
    }
    const result = calculateDiscount(coupon, subtotal);
    if (!result.valid) {
      return { success: false as const, error: result.message ?? "كوبون غير صالح" };
    }
    discount = result.discount;
    appliedCoupon = coupon.code;
  }

  const settings = await prisma.settings.findUnique({
    where: { id: "default" },
  });

  const vatEnabled = settings?.vatEnabled ?? true;
  const netInclusive = Math.max(0, subtotal - discount);
  const vatAmount = vatEnabled
    ? Math.round((netInclusive - netInclusive / (1 + VAT_RATE)) * 100) / 100
    : 0;

  const fulfillmentPrice = Number(fulfillmentMethod.price);
  const total = Math.max(0, netInclusive + fulfillmentPrice);
  const orderNumber = generateOrderNumber();

  const whatsappMessage = buildWhatsAppMessage({
    orderNumber,
    customerName,
    customerPhone,
    items: validatedItems,
    subtotal,
    discount,
    vatAmount,
    fulfillmentPrice,
    total,
    couponCode: appliedCoupon,
    storeName: settings?.storeName,
    fulfillmentMethodName: fulfillmentMethod.name,
    paymentMethodName: paymentMethod.name,
    locationLink,
  });

  // ==== إضافة جديدة: خصم الكمية المتوفرة (فقط للمنتجات المتتبَّعة) + إنشاء الطلب بعملية واحدة ====
  const stockUpdates = products
    .filter((p) => p.stock !== null)
    .map((p) => {
      const item = validatedItems.find((i) => i.productId === p.id)!;
      return prisma.product.update({
        where: { id: p.id },
        data: { stock: { decrement: item.quantity } },
      });
    });

  const results = await prisma.$transaction([
    ...stockUpdates,
    prisma.order.create({
      data: {
        orderNumber,
        customerName,
        customerPhone,
        subtotal,
        discount,
        total,
        vatAmount,
        couponCode: appliedCoupon,
        whatsappMessage,
        fulfillmentMethod: fulfillmentMethod.name,
        fulfillmentPrice,
        paymentMethod: paymentMethod.name,
        locationLink,
        items: {
          create: validatedItems.map((item) => ({
            productId: item.productId,
            productName: item.name,
            quantity: item.quantity,
            price: item.price,
          })),
        },
      },
    }),
  ]);

  const order = results[results.length - 1] as { id: string };

  await trackEvent("ORDER", "/checkout", undefined, { orderId: order.id });

  const whatsappUrl = getWhatsAppUrl(
    settings?.whatsappNumber ?? "966500000000",
    whatsappMessage
  );

  return {
    success: true as const,
    orderId: order.id,
    orderNumber,
    whatsappUrl,
    total,
  };
}
