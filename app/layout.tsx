import type { Metadata, Viewport } from "next";
import { Noto_Sans_Arabic, Playfair_Display } from "next/font/google";
import { Providers } from "@/components/providers/Providers";
import { PageViewTracker } from "@/components/analytics/PageViewTracker";
import { getSettings } from "@/server/queries";
import "./globals.css";

export const dynamic = "force-dynamic";

const arabic = Noto_Sans_Arabic({
  subsets: ["arabic"],
  variable: "--font-arabic",
  display: "swap",
});

const display = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

async function safeGetSettings() {
  try {
    const settings = await getSettings();
    return (
      settings ?? {
        storeName: "Hit | هيت",
        tagline: "لكل قطعة ذكرى",
        logo: null as string | null,
      }
    );
  } catch (e) {
    return {
      storeName: "Hit | هيت",
      tagline: "لكل قطعة ذكرى",
      logo: null as string | null,
    };
  }
}

const SITE_URL = "https://halahit.onrender.com";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await safeGetSettings();

  // ملاحظة: الـcanonical ما نحطه هنا. كل صفحة تحدد الـcanonical الخاص فيها،
  // لأن وضعه هنا كان يخلي كل الصفحات تشير للصفحة الرئيسية.
  return {
    metadataBase: new URL(SITE_URL),
    title: {
      default: `${settings.storeName} — حلويات وبوكسات هدايا وتجمعات في الرياض`,
      template: `%s | ${settings.storeName}`,
    },
    description: `${settings.tagline} — متجر هيت لحلويات وقهوة وبوكسات تجمعات وهدايا فاخرة في الرياض، استلام من الفرع أو توصيل عبر تطبيقات التوصيل.`,
    // ==== تعديل: كلمات مفتاحية أوسع ومستهدفة جغرافيًا (الرياض) ====
    keywords: [
      "هيت",
      "Hit",
      "حلويات الرياض",
      "بوكسات حلى",
      "بوكس تجمعات",
      "بوكسات هدايا الرياض",
      "توصيل حلويات الرياض",
      "قهوة مختصة الرياض",
      "بوكس قهوة",
      "هدايا تخرج",
      "تعبئة صحون حلى",
      "مكعبات جبن حلى",
      "ورد السميد",
      "حلى فاخر توصيل",
    ],
    manifest: "/manifest.json",
    appleWebApp: {
      capable: true,
      statusBarStyle: "default",
      title: settings.storeName,
    },
    robots: {
      index: true,
      follow: true,
    },
    openGraph: {
      type: "website",
      locale: "ar_SA",
      siteName: settings.storeName,
      title: `${settings.storeName} — حلويات وبوكسات هدايا في الرياض`,
      description: settings.tagline,
      images: settings.logo ? [{ url: settings.logo }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: settings.storeName,
      description: settings.tagline,
    },
  };
}

export const viewport: Viewport = {
  themeColor: "#7A3B41",
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const settings = await safeGetSettings();

  // ==== إضافة جديدة: بيانات هيكلية (JSON-LD) تساعد قوقل يفهم نشاطك التجاري ====
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Store",
    name: settings.storeName,
    description: settings.tagline,
    url: SITE_URL,
    image: settings.logo ?? undefined,
    address: {
      "@type": "PostalAddress",
      addressLocality: "الرياض",
      addressCountry: "SA",
    },
    areaServed: "الرياض",
  };

  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className={`${arabic.variable} ${display.variable} font-arabic`}>
        <Providers>
          <PageViewTracker />
          {children}
        </Providers>
      </body>
    </html>
  );
}
