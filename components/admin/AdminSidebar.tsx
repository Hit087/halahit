"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { cn } from "@/lib/utils";
import { useState } from "react";

const links = [
  { href: "/admin", label: "لوحة التحكم" },
  { href: "/admin/products", label: "المنتجات" },
  { href: "/admin/categories", label: "التصنيفات" },
  { href: "/admin/coupons", label: "الكوبونات" },
  { href: "/admin/fulfillment", label: "الاستلام والتوصيل" },
  { href: "/admin/payment-methods", label: "طرق الدفع" },
  { href: "/admin/orders", label: "الطلبات" },
  { href: "/admin/settings", label: "الإعدادات" },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* زر الجوال */}
      <div className="md:hidden flex items-center justify-between bg-white border-b border-beige px-4 py-3">
        <Link href="/admin" className="font-display text-xl font-bold text-accent">
          Hit Admin
        </Link>
        <button
          onClick={() => setOpen(!open)}
          className="text-2xl font-bold text-accent"
        >
          {open ? "✕" : "☰"}
        </button>
      </div>

      {/* القائمة على الجوال */}
      {open && (
        <div className="md:hidden bg-white border-b border-beige px-4 py-3 space-y-1">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className={cn(
                "block rounded-luxury px-4 py-2.5 text-sm transition",
                pathname === link.href
                  ? "bg-primary text-text font-medium"
                  : "text-text/70 hover:bg-cream"
              )}
            >
              {link.label}
            </Link>
          ))}
          <div className="border-t border-beige pt-3">
            <Link href="/" target="_blank" className="block px-4 py-2 text-sm text-text/60 hover:text-accent">
              ↗ عرض المتجر
            </Link>
            <button
              type="button"
              onClick={() => signOut({ callbackUrl: "/admin/login" })}
              className="mt-2 w-full rounded-luxury px-4 py-2 text-start text-sm text-red-500 hover:bg-red-50"
            >
              تسجيل الخروج
            </button>
          </div>
        </div>
      )}

      {/* السايدبار على الكمبيوتر */}
      <aside className="hidden md:flex w-64 flex-shrink-0 flex-col border-l border-beige bg-white p-6">
        <Link href="/admin" className="block font-display text-xl font-bold text-accent">
          Hit Admin
        </Link>
        <nav className="mt-8 space-y-1">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "block rounded-luxury px-4 py-2.5 text-sm transition",
                pathname === link.href
                  ? "bg-primary text-text font-medium"
                  : "text-text/70 hover:bg-cream"
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="mt-8 border-t border-beige pt-4">
          <Link href="/" target="_blank" className="block px-4 py-2 text-sm text-text/60 hover:text-accent">
            ↗ عرض المتجر
          </Link>
          <button
            type="button"
            onClick={() => signOut({ callbackUrl: "/admin/login" })}
            className="mt-2 w-full rounded-luxury px-4 py-2 text-start text-sm text-red-500 hover:bg-red-50"
          >
            تسجيل الخروج
          </button>
        </div>
      </aside>
    </>
  );
}
