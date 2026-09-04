import { formatPrice } from "./utils";

export type WhatsAppLineItem = {
  name: string;
  nameEn?: string;
  quantity: number;
  price: number;
  imageUrl?: string;
};

export function buildWhatsAppMessage(params: {
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  items: WhatsAppLineItem[];
  subtotal: number;
  discount: number;
  vatAmount?: number;
  fulfillmentPrice?: number;
  total: number;
  couponCode?: string;
  storeName?: string;
  fulfillmentMethodName?: string;
  paymentMethodName?: string;
  locationLink?: string;
}): string {
  const {
    orderNumber,
    customerName,
    customerPhone,
    items,
    subtotal,
    discount,
    vatAmount = 0,
    fulfillmentPrice = 0,
    total,
    couponCode,
    storeName = "Hit | هيت",
    fulfillmentMethodName,
    paymentMethodName,
    locationLink,
  } = params;

  const lines: string[] = [
    `🍰 *طلب جديد من ${storeName}*`,
    `━━━━━━━━━━━━━━`,
    `📋 رقم الطلب: *${orderNumber}*`,
    `👤 الاسم: ${customerName}`,
    `📱 الجوال: ${customerPhone}`,
  ];

  if (fulfillmentMethodName) {
    lines.push(`🚚 طريقة الاستلام: ${fulfillmentMethodName}`);
  }

  if (locationLink) {
    lines.push(`📍 الموقع: ${locationLink}`);
  }

  if (paymentMethodName) {
    lines.push(`💳 طريقة الدفع: ${paymentMethodName}`);
  }

  lines.push(``, `🛒 *تفاصيل الطلب:*`);

  items.forEach((item, i) => {
    const lineTotal = item.price * item.quantity;
    lines.push(
      `${i + 1}. ${item.name}`,
      `   الكمية: ${item.quantity} × ${formatPrice(item.price)} = ${formatPrice(lineTotal)}`
    );
    if (item.imageUrl) {
      lines.push(`   🖼️ الصورة: ${item.imageUrl}`);
    }
  });

  lines.push(
    ``,
    `━━━━━━━━━━━━━━`,
    `💰 المجموع الفرعي: ${formatPrice(subtotal)}`
  );

  if (discount > 0) {
    lines.push(
      `🏷️ الخصم${couponCode ? ` (${couponCode})` : ""}: -${formatPrice(discount)}`
    );
  }

  if (vatAmount > 0) {
    lines.push(`🧾 ضريبة القيمة المضافة (15%): ${formatPrice(vatAmount)}`);
  }

  if (fulfillmentPrice > 0) {
    lines.push(`🚚 رسوم التوصيل: ${formatPrice(fulfillmentPrice)}`);
  }

  lines.push(
    `✨ *الإجمالي: ${formatPrice(total)}*`,
    ``,
    `شكراً لاختياركم هيت! 💕`
  );

  return lines.join("\n");
}

export function getWhatsAppUrl(phone: string, message: string): string {
  const cleanPhone = phone.replace(/\D/g, "");
  const encoded = encodeURIComponent(message);
  return `https://wa.me/${cleanPhone}?text=${encoded}`;
}
