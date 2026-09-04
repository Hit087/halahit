import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { getSettings } from "@/server/queries";
import { prisma } from "@/lib/prisma";

export default async function ShopLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const settings = await getSettings();

  const pages = await prisma.page.findMany({
    where: { active: true },
    orderBy: { sortOrder: "asc" },
    select: { slug: true, title: true },
  });

  return (
    <div className="flex min-h-screen flex-col">
      <Header
        logo={settings?.logo}
        storeName={settings?.storeName ?? "Hit | هيت"}
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
      />
    </div>
  );
}
