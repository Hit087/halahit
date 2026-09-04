"use client";

import { useLocaleStore } from "@/store/locale-store";
import { t } from "@/lib/i18n";

type FooterProps = {
  storeName: string;
  tagline: string;
  mapLink?: string | null;
  jahezLink?: string | null;
  hungerStationLink?: string | null;
  toYouLink?: string | null;
  instagramLink?: string | null;
  snapchatLink?: string | null;
  tiktokLink?: string | null;
  kitalink?: string | null;
  theChefzLink?: string | null;
  pages?: { slug: string; title: string }[];
};

export function Footer({
  storeName,
  tagline,
  mapLink,
  jahezLink,
  hungerStationLink,
  toYouLink,
  instagramLink,
  snapchatLink,
  tiktokLink,
  kitalink,
  theChefzLink,
  pages = [],
}: FooterProps) {
  const locale = useLocaleStore((s) => s.locale);

  const deliveryLinks = [
    { href: jahezLink, label: "Jahez" },
    { href: hungerStationLink, label: "HungerStation" },
    { href: toYouLink, label: "ToYou" },
    { href: kitalink, label: "Kita" },
    { href: theChefzLink, label: "TheChefz" },
  ].filter((l) => l.href);

  const socialLinks = [
    { href: instagramLink, label: "Instagram" },
    { href: snapchatLink, label: "Snapchat" },
    { href: tiktokLink, label: "TikTok" },
  ].filter((l) => l.href);

  return (
    <footer className="mt-auto border-t border-beige bg-text text-cream">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <div className="grid gap-8 md:grid-cols-3">
          <div>
            <h3 className="font-display text-2xl font-semibold">{storeName}</h3>
            <p className="mt-2 text-cream/80">{tagline}</p>
          </div>

          <div>
            <h4 className="mb-4 font-semibold">{t("deliveryApps", locale)}</h4>
            <div className="flex flex-wrap gap-3">
              {deliveryLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href!}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-luxury bg-cream/10 px-4 py-2 text-sm transition hover:bg-primary hover:text-white"
                >
                  {link.label}
                </a>
              ))}
              {deliveryLinks.length === 0 && (
                <p className="text-sm text-cream/60">-</p>
              )}
            </div>
          </div>

          <div>
            <h4 className="mb-4 font-semibold">{t("location", locale)}</h4>
            {mapLink ? (
              <a
                href={mapLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-primary transition hover:underline"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Google Maps
              </a>
            ) : (
              <p className="text-sm text-cream/60">-</p>
            )}

            {socialLinks.length > 0 && (
              <div className="mt-4">
                <h4 className="mb-3 font-semibold">تابعونا</h4>
                <div className="flex flex-wrap gap-3">
                  {socialLinks.map((link) => (
                    <a
                      key={link.label}
                      href={link.href!}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-luxury bg-cream/10 px-4 py-2 text-sm transition hover:bg-primary hover:text-white"
                    >
                      {link.label}
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ==== إضافة جديدة: روابط الصفحات (شروط، خصوصية، إلخ) ==== */}
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

        <div className="mt-6 border-t border-cream/20 pt-6 text-center text-sm text-cream/60">
          © {new Date().getFullYear()} {storeName}. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
