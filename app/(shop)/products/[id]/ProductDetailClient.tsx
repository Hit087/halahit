"use client";

import { useState } from "react";
import { ProductGallery } from "@/components/products/ProductGallery";
import { Button } from "@/components/ui/Button";
import { formatPrice } from "@/lib/utils";
import { useLocaleStore } from "@/store/locale-store";
import { localizedName, localizedDescription, t } from "@/lib/i18n";
import { useCartStore } from "@/store/cart-store";
import type { ProductWithImages } from "@/types";

export function ProductDetailClient({
  product,
  whatsappNumber = null,
}: {
  product: ProductWithImages;
  whatsappNumber?: string | null;
}) {
  const locale = useLocaleStore((s) => s.locale);
  const addItem = useCartStore((s) => s.addItem);
  const [qty, setQty] = useState(1);

  const image = product.images[0]?.url ?? "/uploads/placeholder.svg";
  const displayName = localizedName(product.name, product.nameEn, locale);
  const hasPrice = product.price != null && product.price > 0;

  const handleAdd = () => {
    addItem(
      {
        productId: product.id,
        name: product.name,
        nameEn: product.nameEn,
        price: product.price ?? 0,
        image,
      },
      qty
    );
  };

  // منتج بدون سعر (السعر حسب الطلب): نوجّه العميل للتواصل بدل إضافته للسلة بسعر صفر
  const waDigits = whatsappNumber ? whatsappNumber.replace(/\D/g, "") : "";
  const waText =
    locale === "ar"
      ? `السلام عليكم، أبغى أستفسر عن: ${displayName}`
      : `Hello, I would like to ask about: ${displayName}`;
  const waHref = waDigits
    ? `https://wa.me/${waDigits}?text=${encodeURIComponent(waText)}`
    : null;

  return (
    <div className="grid gap-12 lg:grid-cols-2">
      <ProductGallery images={product.images} alt={displayName} />

      <div>
        {product.category && (
          <p className="text-sm font-medium text-accent">
            {localizedName(product.category.name, product.category.nameEn, locale)}
          </p>
        )}

        <h1 className="mt-2 font-display text-4xl font-bold text-text">
          {displayName}
        </h1>

        {hasPrice ? (
          <p className="mt-4 text-3xl font-bold text-accent">
            {formatPrice(product.price as number, locale === "ar" ? "ar-SA" : "en-SA")}
          </p>
        ) : (
          <p className="mt-4 text-xl font-semibold text-accent">
            {locale === "ar" ? "السعر حسب الطلب" : "Price on request"}
          </p>
        )}

        <p className="mt-6 leading-relaxed text-text/80">
          {localizedDescription(product.description, product.descriptionEn, locale)}
        </p>

        {hasPrice ? (
          <div className="mt-8 flex items-center gap-4">
            <div className="flex items-center rounded-luxury border border-beige">
              <button
                type="button"
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                className="px-4 py-3 text-lg hover:bg-beige/50"
              >
                -
              </button>
              <span className="min-w-[3rem] text-center font-medium">{qty}</span>
              <button
                type="button"
                onClick={() => setQty((q) => q + 1)}
                className="px-4 py-3 text-lg hover:bg-beige/50"
              >
                +
              </button>
            </div>

            <Button variant="accent" size="lg" onClick={handleAdd} className="flex-1">
              {t("addToCart", locale)}
            </Button>
          </div>
        ) : (
          waHref && (
            <div className="mt-8">
              <a
                href={waHref}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex w-full items-center justify-center rounded-luxury bg-accent px-6 py-3.5 text-base font-medium text-white transition hover:opacity-90 sm:w-auto"
              >
                {locale === "ar" ? "تواصل معنا عبر واتساب" : "Contact us on WhatsApp"}
              </a>
            </div>
          )
        )}
      </div>
    </div>
  );
}
