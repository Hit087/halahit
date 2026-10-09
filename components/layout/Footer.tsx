"use client";

import { useState } from "react";
import Image from "next/image";
import { subscribeNewsletter } from "@/server/actions/newsletter";
import { useLocaleStore } from "@/store/locale-store";

type FooterItem = {
  id: string;
  section: string;
  label: string | null;
  image: string;
  link: string | null;
};

type FooterProps = {
  storeName: string;
  tagline: string;
  pages?: { slug: string; title: string }[];
  footerItems?: FooterItem[];
  commercialRegNumber?: string | null;
  commercialLicenseNumber?: string | null;
};

// يصلّح الروابط اللي انكتبت بدون بروتوكول: إيميل -> mailto، رقم -> tel، دومين -> https
function normalizeHref(raw: string): string {
  const link = raw.trim();
  if (/^(https?:|mailto:|tel:|sms:|#|\/)/i.test(link)) return link;
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(link)) return `mailto:${link}`;
  if (/^\+?[\d\s()-]{7,}$/.test(link)) return `tel:${link.replace(/[\s()-]/g, "")}`;
  if (/^[^\s/]+\.[a-z]{2,}(\/.*)?$/i.test(link)) return `https://${link}`;
  return link;
}

function isExternal(href: string): boolean {
  return /^https?:/i.test(href);
}

// وصف للصورة: العنوان إن وجد، وإلا اسم المنصة من الرابط
function altFor(item: FooterItem): string {
  if (item.label) return item.label;
  if (item.link) {
    const l = item.link.toLowerCase();
    if (l.includes("tiktok")) return "TikTok";
    if (l.includes("instagram")) return "Instagram";
    if (l.includes("snapchat")) return "Snapchat";
    if (l.includes("wa.me") || l.includes("whatsapp")) return "WhatsApp";
    if (l.includes("x.com") || l.includes("twitter")) return "X";
  }
  return "";
}

// ==== كل قسم له حجمه الأصلي، والصورة تملأه بالكامل بدون فراغ (object-cover) ====
function ItemIcon({ item, className }: { item: FooterItem; className: string }) {
  const content = (
    <div className={`relative flex-shrink-0 overflow-hidden bg-white ${className}`}>
      <Image src={item.image} alt={altFor(item)} fill className="object-cover" />
    </div>
  );

  if (!item.link) return content;

  const href = normalizeHref(item.link);
  const external = isExternal(href);

  return (
    <a
      href={href}
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      aria-label={altFor(item) || undefined}
      className="transition hover:scale-105"
    >
      {content}
    </a>
  );
}

export function Footer({
  storeName,
  tagline,
  pages = [],
  footerItems = [],
  commercialRegNumber = null,
  commercialLicenseNumber = null,
}: FooterProps) {
  const locale = useLocaleStore((s) => s.locale);
  const isAr = locale === "ar";

  const [newsletterStatus, setNewsletterStatus] = useState<"idle" | "loading" | "done">("idle");

  const bySection = (section: string) => footerItems.filter((i) => i.section === section);
  const social = bySection("SOCIAL");
  const contact = bySection("CONTACT");
  const trust = bySection("TRUST");
  const payment = bySection("PAYMENT");
  const delivery = bySection("DELIVERY");

  const handleNewsletterSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setNewsletterStatus("loading");
    await subscribeNewsletter(new FormData(e.currentTarget));
    setNewsletterStatus("done");
    (e.target as HTMLFormElement).reset();
  };

  return (
    <footer className="mt-auto border-t border-beige bg-text text-cream">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        {/* ==== التواصل الاجتماعي: دائرة صغيرة 40px ==== */}
        {social.length > 0 && (
          <div className="mb-8 flex flex-wrap justify-center gap-4">
            {social.map((item) => (
              <ItemIcon key={item.id} item={item} className="h-10 w-10 rounded-full" />
            ))}
          </div>
        )}

        <div className="grid gap-8 md:grid-cols-3">
          <div>
            <h3 className="font-display text-2xl font-semibold">{storeName}</h3>
            <p className="mt-2 text-cream/80">{tagline}</p>

            <div className="mt-5">
              <p className="mb-2 text-sm font-medium">اشترك في نشرتنا البريدية</p>
              {newsletterStatus === "done" ? (
                <p className="text-sm text-primary">تم الاشتراك بنجاح 🎉</p>
              ) : (
                <form onSubmit={handleNewsletterSubmit} className="flex gap-2">
                  <input
                    type="email"
                    name="email"
                    required
                    placeholder="بريدك الإلكتروني"
                    className="min-w-0 flex-1 rounded-full bg-cream/10 px-4 py-2 text-sm text-white placeholder:text-cream/50 outline-none"
                  />
                  <button
                    type="submit"
                    disabled={newsletterStatus === "loading"}
                    className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-text"
                  >
                    اشتراك
                  </button>
                </form>
              )}
            </div>
          </div>

          {/* ==== تطبيقات التوصيل: مستطيل 40×80px ==== */}
          {delivery.length > 0 && (
            <div>
              <h4 className="mb-4 font-semibold">تطبيقات التوصيل</h4>
              <div className="flex flex-wrap gap-3">
                {delivery.map((item) => (
                  <ItemIcon key={item.id} item={item} className="h-10 w-20 rounded-luxury" />
                ))}
              </div>
            </div>
          )}

          {/* ==== معلومات التواصل: أيقونة صغيرة 24px بجنب النص ==== */}
          {contact.length > 0 && (
            <div>
              <h4 className="mb-4 font-semibold">تواصل معنا</h4>
              <div className="space-y-3">
                {contact.map((item) => {
                  const href = item.link ? normalizeHref(item.link) : null;
                  return (
                    <div key={item.id} className="flex items-center gap-3">
                      <ItemIcon item={item} className="h-6 w-6 rounded" />
                      {href ? (
                        <a
                          href={href}
                          {...(isExternal(href)
                            ? { target: "_blank", rel: "noopener noreferrer" }
                            : {})}
                          className="text-sm text-cream/80 hover:text-primary"
                        >
                          {item.label}
                        </a>
                      ) : (
                        <span className="text-sm text-cream/80">{item.label}</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {pages.length > 0 && (
          <div className="mt-8 flex flex-wrap justify-center gap-x-6 gap-y-2 border-t border-cream/20 pt-6 text-sm">
            {pages.map((p) => (
              <a
                key={p.slug}
                href={`/pages/${p.slug}`}
                className="text-cream/70 transition hover:text-primary hover:underline"
              >
                {p.title}
              </a>
            ))}
          </div>
        )}

        {/* ==== شعارات الثقة: مربع 40px ==== */}
        {trust.length > 0 && (
          <div className="mt-6 flex flex-wrap items-center justify-center gap-6 border-t border-cream/20 pt-6">
            {trust.map((item) => (
              <div key={item.id} className="flex items-center gap-2">
                <ItemIcon item={item} className="h-10 w-10 rounded" />
                {item.label && <span className="text-xs text-cream/70">{item.label}</span>}
              </div>
            ))}
          </div>
        )}

        <div className="mt-6 text-center text-sm text-cream/60">
          {isAr
            ? `© ${new Date().getFullYear()} ${storeName}. جميع الحقوق محفوظة.`
            : `© ${new Date().getFullYear()} ${storeName}. All rights reserved.`}
        </div>

        {/* ==== السجل التجاري (يظهر فقط إذا فعّلته من الإعدادات وكتبت الرقم) ==== */}
        {(commercialRegNumber || commercialLicenseNumber) && (
          <div className="mt-2 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs text-cream/50">
            {commercialRegNumber && (
              <span>
                {isAr ? "السجل التجاري" : "Commercial Reg."}: {commercialRegNumber}
              </span>
            )}
            {commercialLicenseNumber && (
              <span>
                {isAr ? "رقم الترخيص" : "License No."}: {commercialLicenseNumber}
              </span>
            )}
          </div>
        )}

        {/* ==== طرق الدفع: مستطيل 32×56px ==== */}
        {payment.length > 0 && (
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            {payment.map((item) => (
              <ItemIcon key={item.id} item={item} className="h-8 w-14 rounded" />
            ))}
          </div>
        )}
      </div>
    </footer>
  );
}
