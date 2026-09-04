"use client";

import { useState } from "react";
import { useCartStore } from "@/store/cart-store";
import { useLocaleStore } from "@/store/locale-store";
import { formatPrice } from "@/lib/utils";
import { t } from "@/lib/i18n";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { processCheckout } from "@/server/actions/checkout";
import Link from "next/link";

type FulfillmentMethod = {
  id: string;
  name: string;
  type: string; // "PICKUP" | "DELIVERY"
  price: number;
};

type PaymentMethod = {
  id: string;
  name: string;
  type: string; // "CASH" | "GATEWAY"
};

export function CheckoutPageClient({
  fulfillmentMethods,
  paymentMethods,
  vatEnabled = true,
}: {
  fulfillmentMethods: FulfillmentMethod[];
  paymentMethods: PaymentMethod[];
  vatEnabled?: boolean;
}) {
  const locale = useLocaleStore((s) => s.locale);
  const { items, coupon, getSubtotal, getVat, getTotal, clearCart } = useCartStore();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [fulfillmentMethodId, setFulfillmentMethodId] = useState(
    fulfillmentMethods[0]?.id ?? ""
  );
  const [paymentMethodId, setPaymentMethodId] = useState(
    paymentMethods[0]?.id ?? ""
  );
  const [locationLink, setLocationLink] = useState("");
  const [locating, setLocating] = useState(false);

  const selectedFulfillment = fulfillmentMethods.find(
    (m) => m.id === fulfillmentMethodId
  );
  const isDelivery = selectedFulfillment?.type === "DELIVERY";
  const fulfillmentPrice = selectedFulfillment?.price ?? 0;

  const subtotal = getSubtotal();
  const discount = coupon?.discount ?? 0;
  const vat = vatEnabled ? getVat() : 0;
  const totalBeforeFulfillment = vatEnabled ? getTotal() : Math.max(0, subtotal - discount);
  const total = totalBeforeFulfillment + (isDelivery ? fulfillmentPrice : 0);

  if (items.length === 0) {
    return (
      <div className="text-center py-20">
        <p className="text-text/60">{t("emptyCart", locale)}</p>
        <Link href="/products" className="mt-6 inline-block">
          <Button variant="accent">{t("shopNow", locale)}</Button>
        </Link>
      </div>
    );
  }

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError("المتصفح لا يدعم تحديد الموقع");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setLocationLink(`https://www.google.com/maps?q=${latitude},${longitude}`);
        setLocating(false);
      },
      () => {
        setLocating(false);
        setError("تعذّر الوصول للموقع، الرجاء لصق رابط الموقع يدويًا");
      }
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (isDelivery && !locationLink) {
      setError("الرجاء تحديد موقع التوصيل (استخدام الموقع الحالي أو لصق رابط)");
      return;
    }

    setLoading(true);

    const result = await processCheckout({
      customerName: name,
      customerPhone: phone,
      couponCode: coupon?.code,
      fulfillmentMethodId,
      paymentMethodId,
      locationLink: isDelivery ? locationLink : undefined,
      items: items.map((i) => ({
        productId: i.productId,
        name: i.name,
        nameEn: i.nameEn,
        price: i.price,
        quantity: i.quantity,
      })),
    });

    setLoading(false);

    if (!result.success) {
      setError(result.error);
      return;
    }

    clearCart();
    window.location.href = result.whatsappUrl;
  };

  return (
    <>
      <h1 className="font-display text-3xl font-bold">{t("checkout", locale)}</h1>
      <p className="mt-2 text-text/60">{t("orderViaWhatsapp", locale)}</p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-6">
        <Input
          id="name"
          label={t("customerName", locale)}
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <Input
          id="phone"
          label={t("customerPhone", locale)}
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          required
          placeholder="05xxxxxxxx"
        />

        {/* ==== طريقة الاستلام والتوصيل ==== */}
        {fulfillmentMethods.length > 0 && (
          <div>
            <p className="mb-2 text-sm font-medium text-text/80">طريقة الاستلام</p>
            <div className="space-y-2">
              {fulfillmentMethods.map((method) => (
                <label
                  key={method.id}
                  className="flex items-center justify-between rounded-luxury border border-beige bg-white px-4 py-3 text-sm cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="fulfillmentMethod"
                      value={method.id}
                      checked={fulfillmentMethodId === method.id}
                      onChange={() => setFulfillmentMethodId(method.id)}
                    />
                    {method.name}
                  </span>
                  <span className="text-text/60">
                    {method.price > 0 ? formatPrice(method.price) : "مجاني"}
                  </span>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* ==== حقول التوصيل: تظهر فقط لو الطريقة المختارة توصيل ==== */}
        {isDelivery && (
          <div>
            <p className="mb-2 text-sm font-medium text-text/80">موقع التوصيل</p>
            <button
              type="button"
              onClick={handleUseCurrentLocation}
              disabled={locating}
              className="w-full rounded-luxury border border-beige bg-white px-4 py-2.5 text-sm text-accent"
            >
              📍 {locating ? "جارٍ التحديد..." : "استخدم موقعي الحالي"}
            </button>
            <p className="my-2 text-center text-xs text-text/40">أو</p>
            <Input
              id="locationLink"
              placeholder="الصق رابط جوجل مابس هنا"
              value={locationLink}
              onChange={(e) => setLocationLink(e.target.value)}
            />
          </div>
        )}

        {/* ==== طريقة الدفع ==== */}
        {paymentMethods.length > 0 && (
          <div>
            <p className="mb-2 text-sm font-medium text-text/80">طريقة الدفع</p>
            <div className="space-y-2">
              {paymentMethods.map((method) => (
                <label
                  key={method.id}
                  className="flex items-center gap-2 rounded-luxury border border-beige bg-white px-4 py-3 text-sm cursor-pointer"
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value={method.id}
                    checked={paymentMethodId === method.id}
                    onChange={() => setPaymentMethodId(method.id)}
                  />
                  {method.name}
                </label>
              ))}
            </div>
          </div>
        )}

        <div className="rounded-luxury-lg bg-white p-4 shadow-soft space-y-2">
          {items.map((item) => (
            <div key={item.productId} className="flex justify-between text-sm">
              <span>
                {item.name} × {item.quantity}
              </span>
              <span>{formatPrice(item.price * item.quantity)}</span>
            </div>
          ))}
          <div className="border-t border-beige pt-2 flex justify-between text-sm text-text/60">
            <span>{t("subtotal", locale) ?? "المجموع الفرعي"}</span>
            <span>{formatPrice(subtotal)}</span>
          </div>
          {discount > 0 && (
            <div className="flex justify-between text-sm text-accent">
              <span>الخصم</span>
              <span>-{formatPrice(discount)}</span>
            </div>
          )}
          {vatEnabled && vat > 0 && (
            <div className="flex justify-between text-sm text-text/60">
              <span>ضريبة القيمة المضافة (15%)</span>
              <span>{formatPrice(vat)}</span>
            </div>
          )}
          {isDelivery && fulfillmentPrice > 0 && (
            <div className="flex justify-between text-sm text-text/60">
              <span>رسوم التوصيل</span>
              <span>{formatPrice(fulfillmentPrice)}</span>
            </div>
          )}
          <div className="border-t border-beige pt-2 flex justify-between font-bold">
            <span>{t("total", locale)}</span>
            <span className="text-accent">{formatPrice(total)}</span>
          </div>
        </div>

        {error && <p className="text-red-500 text-sm">{error}</p>}

        <Button type="submit" variant="accent" size="lg" className="w-full" loading={loading}>
          {t("orderViaWhatsapp", locale)}
        </Button>
      </form>
    </>
  );
}
