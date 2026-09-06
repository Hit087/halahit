import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/Badge";
import { AnnouncementForm } from "./AnnouncementForm";
import { DeleteAnnouncementButton } from "./DeleteAnnouncementButton";
import { AnnouncementModeToggle } from "./AnnouncementModeToggle";

export default async function AdminAnnouncementsPage() {
  const [announcements, settings] = await Promise.all([
    prisma.announcementBar.findMany({ orderBy: { sortOrder: "asc" } }),
    prisma.settings.findUnique({ where: { id: "default" } }),
  ]);

  return (
    <div>
      <h1 className="font-display text-3xl font-bold mb-8">شريط الإعلانات العلوي</h1>

      <div className="mb-8">
        <AnnouncementModeToggle scrolling={settings?.announcementScrolling ?? true} />
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <div>
          <h2 className="text-lg font-semibold mb-4">إضافة رسالة جديدة</h2>
          <AnnouncementForm />
        </div>

        <div className="space-y-4">
          <h2 className="text-lg font-semibold">الرسائل الحالية</h2>
          {announcements.map((a) => (
            <div key={a.id} className="rounded-luxury-lg bg-white p-4 shadow-soft">
              <div className="flex items-center gap-2">
                <p className="font-medium">{a.message}</p>
                <Badge variant={a.active ? "success" : "muted"}>
                  {a.active ? "نشطة" : "معطّلة"}
                </Badge>
              </div>
              <AnnouncementForm announcement={a} compact />
              <DeleteAnnouncementButton id={a.id} />
            </div>
          ))}
          {announcements.length === 0 && (
            <p className="text-center text-text/50 py-12">لا توجد رسائل مضافة بعد</p>
          )}
        </div>
      </div>
    </div>
  );
}
