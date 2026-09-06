import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { AnnouncementBarDisplay } from "@/components/layout/AnnouncementBarDisplay";
import { getSettings } from "@/server/queries";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export default async function ShopLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [settings, pages, announcements, session] = await Promise.all([
    getSettings(),
    prisma.page.findMany({
      where: { active: true },
      orderBy: { sortOrder: "asc" },
      select: { slug: true, title: true },
    }),
    prisma.announcementBar.findMany({
      where: { active: true },
      orderBy: { sortOrder: "asc" },
      select: { id: true, message: true },
    }),
    getSession(),
  ]);

  return (
    <div className="flex min-h-screen flex-col">
      <AnnouncementBarDisplay
        announcements={announcements}
        scrolling={settings?.announcementScrolling ?? true}
      />
      <Header
        logo={settings?.logo}
        storeName={settings?.storeName ?? "Hit | هيت"}
        isLoggedIn={Boolean(session?.user)}
      />
      <main className="flex-1">{children}</main>
      <Footer
        storeName={settings?.storeName ?? "Hit | هيت"}
        tagline={settings?.tagline ?? "أكل قطعة ذكرى"}
        mapLink={settings?.mapLink}
        jahezLink={settings?.jahezLink}
        hungerStationLink={settings?.hungerStationLink}
        toYouLink={settings?.toYouLink}
        instagramLink={settings?.instagramLink}
        snapchatLink={settings?.snapchatLink}
        tiktokLink={settings?.tiktokLink}
        kitalink={settings?.kitalink}
        theChefzLink={settings?.theChefzLink}
        pages={pages}
        commercialRegNumber={settings?.commercialRegNumber}
        commercialLicenseNumber={settings?.commercialLicenseNumber}
        commercialRegVisible={settings?.commercialRegVisible}
      />
    </div>
  );
}
