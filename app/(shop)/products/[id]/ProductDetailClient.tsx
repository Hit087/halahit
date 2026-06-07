"use client";

import { useState } from "react";
import { ProductGallery } from "@/components/products/ProductGallery";
import { Button } from "@/components/ui/Button";
import { formatPrice } from "@/lib/utils";
import { useLocaleStore } from "@/store/locale-store";
import { localizedName, localizedDescription, t } from "@/lib/i18n";
import { useCartStore } from "@/store/cart-store";
import type { ProductWithImages } from "@/types";

export function ProductDetailClient({ product }: { product: ProductWithImages }) {
  const locale = useLocaleStore((s) => s.locale);
  const addItem = useCartStore((s) => s.addItem);
  const [qty, setQty] = useState(1);
  const image = product.images[0]?.url ?? "/uploads/placeholder.svg";

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

  return (
    <div className="grid gap-12 lg:grid-cols-2">
      <ProductGallery images={product.images} />
      <div>
        {product.category && (
          <p className="text-sm font-medium text-accent">
            {localizedName(product.category.name, product.category.nameEn, locale)}
          </p>
        )}
        <h1 className="mt-2 font-display text-4xl font-bold text-text">
          {localizedName(product.name, product.nameEn, locale)}
        </h1>

        {product.price != null && product.price > 0 && (
          <p className="mt-4 text-3xl font-bold text-accent">
            {formatPrice(product.price, locale === "ar" ? "ar-SA" : "en-SA")}
          </p>
        )}

        <p className="mt-6 leading-relaxed text-text/80">
          {localizedDescription(product.description, product.descriptionEn, locale)}
        </p>

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
      </div>
    </div>
  );
}
