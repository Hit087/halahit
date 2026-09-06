"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useCartStore } from "@/store/cart-store";
import { useLocaleStore } from "@/store/locale-store";
import { t } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export function Header({ logo, storeName }: { logo?: string | null; storeName: string }) {
  const itemCount = useCartStore((s) => s.getItemCount());
  const { locale, toggleLocale } = useLocaleStore();
  const router = useRouter();

  // ==== إضافة جديدة: صندوق بحث قابل للطي ====
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/products?q=${encodeURIComponent(query.trim())}`);
      setSearchOpen(false);
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-[#FDF6F0] border-b border-[#f0e0d6]/60 shadow-sm">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">

        {/* يسار: زر السلة + زر البحث */}
        <div className="flex items-center gap-2">
          <Link
            href="/cart"
            className={cn(
              "relative flex h-11 w-11 items-center justify-center rounded-full bg-[#F4A6C1] text-white transition hover:bg-[#e392b0]"
            )}
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
            {itemCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-[#E91E63] text-xs text-white font-bold">
                {itemCount}
              </span>
            )}
          </Link>

          <button
            type="button"
            onClick={() => setSearchOpen((v) => !v)}
            className="flex h-11 w-11 items-center justify-center rounded-full bg-[#F4A6C1] text-white transition hover:bg-[#e392b0]"
            aria-label="بحث"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11a6 6 0 11-12 0 6 6 0 0112 0z" />
            </svg>
          </button>
        </div>

        {/* وسط: اللوغو + اسم المتجر */}
        <Link href="/" className="flex flex-col items-center gap-1">
          {logo ? (
            <Image
              src={logo}
              alt={storeName}
              width={44}
              height={44}
              className="h-11 w-11 rounded-full object-cover"
            />
          ) : (
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#F4A6C1] text-lg font-bold text-white">
              ه
            </span>
          )}
          <span className="font-display text-base font-semibold text-[#3E2723] leading-none">
            {storeName}
          </span>
        </Link>

        {/* يمين: تبديل اللغة */}
        <button
          type="button"
          onClick={toggleLocale}
          className="flex h-11 items-center justify-center rounded-full bg-[#F4A6C1] px-4 text-sm font-semibold text-white transition hover:bg-[#e392b0]"
        >
          {t("language", locale)}
        </button>
      </div>

      {/* ==== إضافة جديدة: شريط البحث المنسدل ==== */}
      {searchOpen && (
        <div className="border-t border-[#f0e0d6]/60 bg-white px-4 py-3 sm:px-6">
          <form onSubmit={handleSearchSubmit} className="mx-auto flex max-w-7xl gap-2">
            <input
              type="text"
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="ابحث عن منتج..."
              className="flex-1 rounded-full border border-[#f0e0d6] px-4 py-2 text-sm outline-none focus:border-[#E91E63]"
            />
            <button
              type="submit"
              className="rounded-full bg-[#E91E63] px-5 py-2 text-sm font-semibold text-white"
            >
              بحث
            </button>
          </form>
        </div>
      )}

      {/* شريط التنقل السفلي */}
      <nav className="border-t border-[#f0e0d6]/60">
        <div className="mx-auto flex max-w-7xl items-center justify-center gap-8 px-4 py-2 sm:px-6">
          <Link href="/" className="text-sm font-medium text-[#3E2723]/70 transition hover:text-[#E91E63]">
            {t("home", locale)}
          </Link>
          <Link href="/products" className="text-sm font-medium text-[#3E2723]/70 transition hover:text-[#E91E63]">
            {t("products", locale)}
          </Link>
        </div>
      </nav>
    </header>
  );
}
