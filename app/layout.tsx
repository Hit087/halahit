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

  return {
    metadataBase: new URL(SITE_URL),
    title: {
      default: settings.storeName,
      template: `%s | ${settings.storeName}`,
    },
    description: settings.tagline,
    keywords: [
      "هيت",
      "حلويات",
      "بوكسات هدايا",
      "قهوة",
      "تجمعات",
      "توصيل حلويات",
      "Hit",
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
      title: settings.storeName,
      description: settings.tagline,
      url: SITE_URL,
      images: settings.logo ? [{ url: settings.logo }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: settings.storeName,
      description: settings.tagline,
    },
    alternates: {
      canonical: SITE_URL,
    },
  };
}

export const viewport: Viewport = {
  themeColor: "#7A3B41",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <body className={`${arabic.variable} ${display.variable} font-arabic`}>
        <Providers>
          <PageViewTracker />
          {children}
        </Providers>
      </body>
    </html>
  );
}
