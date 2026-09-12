"use client";

import { useState } from "react";
import Image from "next/image";
import { subscribeNewsletter } from "@/server/actions/newsletter";

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
};

// ==== مقاس أيقونة موحّد: الصورة تملأ المربع بالكامل بدون أي فراغ ====
function ItemIcon({ item }: { item: FooterItem }) {
  const content = (
    <div className="relative h-14 w-14 flex-shrink-0 overflow-hidden rounded-luxury bg-white shadow-sm">
      <Image
        src={item.image}
        alt={item.label ?? ""}
        fill
        className="object-cover"
      />
    </div>
  );
  if (!item.link) return content;
  return (
    <a href={item.link} target="_blank" rel="noopener noreferrer" className="transition hover:scale-105">
      {content}
    </a>
  );
}

export function Footer({
  storeName,
  tagline,
  pages = [],
  footerItems = [],
}: FooterProps) {
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

        {social.length > 0 && (
          <div className="mb-8 flex flex-wrap justify-center gap-4">
            {social.map((item) => (
              <ItemIcon key={item.id} item={item} />
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

          {delivery.length > 0 && (
            <div>
              <h4 className="mb-4 font-semibold">تطبيقات التوصيل</h4>
              <div className="flex flex-wrap gap-3">
                {delivery.map((item) => (
                  <ItemIcon key={item.id} item={item} />
                ))}
              </div>
            </div>
          )}

          {contact.length > 0 && (
            <div>
              <h4 className="mb-4 font-semibold">تواصل معنا</h4>
              <div className="flex flex-wrap gap-3">
                {contact.map((item) => (
                  <div key={item.id} className="flex flex-col items-center gap-1.5">
                    <ItemIcon item={item} />
                    {item.label && (
                      <span className="text-xs text-cream/70">{item.label}</span>
                    )}
                  </div>
                ))}
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

        {trust.length > 0 && (
          <div className="mt-6 flex flex-wrap items-center justify-center gap-4 border-t border-cream/20 pt-6">
            {trust.map((item) => (
              <div key={item.id} className="flex flex-col items-center gap-1.5">
                <ItemIcon item={item} />
                {item.label && <span className="text-xs text-cream/70">{item.label}</span>}
              </div>
            ))}
          </div>
        )}

        <div className="mt-6 text-center text-sm text-cream/60">
          © {new Date().getFullYear()} {storeName}. All rights reserved.
        </div>

        {payment.length > 0 && (
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            {payment.map((item) => (
              <ItemIcon key={item.id} item={item} />
            ))}
          </div>
        )}
      </div>
    </footer>
  );
}
