"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { formatPrice } from "@/lib/utils";
import { useLocaleStore } from "@/store/locale-store";
import { localizedName, t } from "@/lib/i18n";
import { useCartStore } from "@/store/cart-store";
import type { ProductWithImages } from "@/types";

export function ProductCard({ product }: { product: ProductWithImages }) {
  const locale = useLocaleStore((s) => s.locale);
  const addItem = useCartStore((s) => s.addItem);
  const image = product.images[0]?.url ?? "/uploads/placeholder.svg";

  // ==== إضافة جديدة: نفدت الكمية فقط إذا كان المخزون متتبَّعًا (رقم) وصفر أو أقل ====
  const isOutOfStock = product.stock !== null && product.stock <= 0;

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    if (isOutOfStock) return;
    addItem({
      productId: product.id,
      name: product.name,
      nameEn: product.nameEn,
      price: product.price ?? 0,
      image,
    });
  };

  return (
    <motion.article
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4 }}
      className="group overflow-hidden rounded-[20px] bg-white shadow-[0_4px_16px_rgba(0,0,0,0.07)] transition hover:shadow-[0_8px_24px_rgba(0,0,0,0.12)]"
    >
      <Link href={`/products/${product.id}`}>
        <div className="relative aspect-square overflow-hidden bg-[#fdf6f0]">
          <Image
            src={image}
            alt={product.name}
            fill
            className={`object-cover transition duration-500 group-hover:scale-105 ${
              isOutOfStock ? "opacity-50 grayscale" : ""
            }`}
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          />
          {isOutOfStock && (
            <span className="absolute top-2 right-2 rounded-full bg-[#3E2723] px-3 py-1 text-xs font-bold text-white">
              {locale === "ar" ? "نفذت الكمية" : "Out of stock"}
            </span>
          )}
        </div>
      </Link>

      <div className="p-4">
        <Link href={`/products/${product.id}`}>
          <h3 className="text-sm sm:text-base font-semibold text-[#3E2723] line-clamp-2 leading-snug transition hover:text-[#E91E63]">
            {localizedName(product.name, product.nameEn, locale)}
          </h3>
        </Link>

        <p className="mt-1.5 text-base font-bold text-[#E91E63]">
          {product.price
            ? formatPrice(product.price, locale === "ar" ? "ar-SA" : "en-SA")
            : locale === "ar" ? "السعر حسب الطلب" : "Price on request"}
        </p>

        {isOutOfStock ? (
          <button
            disabled
            className="mt-3 w-full cursor-not-allowed rounded-full bg-gray-300 py-2.5 text-sm font-semibold text-gray-500"
          >
            {locale === "ar" ? "نفذت الكمية" : "Out of stock"}
          </button>
        ) : product.price ? (
          <button
            onClick={handleAdd}
            className="mt-3 w-full rounded-full bg-[#F4A6C1] py-2.5 text-sm font-semibold text-white transition hover:bg-[#e392b0] active:scale-95"
          >
            {t("addToCart", locale)}
          </button>
        ) : (
          <Link href={`/products/${product.id}`}>
            <button className="mt-3 w-full rounded-full border-2 border-[#F4A6C1] py-2.5 text-sm font-semibold text-[#F4A6C1] transition hover:bg-[#F4A6C1] hover:text-white">
              {locale === "ar" ? "تواصل معنا" : "Contact us"}
            </button>
          </Link>
        )}
      </div>
    </motion.article>
  );
}
