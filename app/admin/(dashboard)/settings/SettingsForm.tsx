"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { updateSettings } from "@/server/actions/admin-settings";
import type { Settings } from "@prisma/client";

export function SettingsForm({ settings }: { settings: Settings | null }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const result = await updateSettings(new FormData(e.currentTarget));
    setLoading(false);
    if (!result.success) {
      setError(result.error ?? "حدث خطأ");
      return;
    }
    setError("");
    router.refresh();
  };

  return (
    <Card className="max-w-2xl">
      <h2 className="font-semibold text-lg mb-4">إعدادات المتجر</h2>
      <form onSubmit={handleSubmit} className="space-y-4" encType="multipart/form-data">
        <Input name="storeName" label="اسم المتجر" defaultValue={settings?.storeName} required />
        <Input name="tagline" label="الشعار" defaultValue={settings?.tagline} />
        <Input
          name="whatsappNumber"
          label="رقم واتساب (بدون +)"
          defaultValue={settings?.whatsappNumber}
          required
          placeholder="966500000000"
        />
        <div>
          <label className="text-sm font-medium">الشعار (Logo)</label>
          {settings?.logo && (
            <div className="relative h-16 w-16 my-2 rounded-full overflow-hidden">
              <Image src={settings.logo} alt="Logo" fill className="object-cover" />
            </div>
          )}
          <input type="file" name="logo" accept="image/*" className="mt-1 w-full text-sm" />
        </div>
        <Input name="mapLink" label="رابط الخريطة" defaultValue={settings?.mapLink ?? ""} />
        <Input name="jahezLink" label="رابط جاهز" defaultValue={settings?.jahezLink ?? ""} />
        <Input
          name="hungerStationLink"
          label="رابط هنقرستيشن"
          defaultValue={settings?.hungerStationLink ?? ""}
        />
        <Input name="toYouLink" label="رابط ToYou" defaultValue={settings?.toYouLink ?? ""} />
        <Input name="tiktokLink" label="رابط تيك توك" defaultValue={settings?.tiktokLink ?? ""} />
        <Input
          name="instagramLink"
          label="رابط إنستقرام"
          defaultValue={settings?.instagramLink ?? ""}
        />
        <Input
          name="snapchatLink"
          label="رابط سناب شات"
          defaultValue={settings?.snapchatLink ?? ""}
        />
        <Input name="kitalink" label="رابط كيتا" defaultValue={settings?.kitalink ?? ""} />
        <Input
          name="theChefzLink"
          label="رابط ذا شيفز"
          defaultValue={settings?.theChefzLink ?? ""}
        />

        <div className="border-t border-beige pt-4 mt-6">
          <h3 className="font-semibold mb-3">تغيير كلمة المرور</h3>
          <p className="text-sm text-text/60 mb-3">اترك الحقول فارغة إذا لم تريد تغيير كلمة المرور</p>
          <div className="space-y-4">
            <Input
              name="newPassword"
              label="كلمة المرور الجديدة"
              type="password"
              autoComplete="new-password"
            />
            <Input
              name="confirmPassword"
              label="تأكيد كلمة المرور"
              type="password"
              autoComplete="new-password"
            />
          </div>
        </div>

        {error && <p className="text-red-500 text-sm">{error}</p>}
        <Button type="submit" variant="accent" loading={loading}>
          حفظ الإعدادات
        </Button>
      </form>
    </Card>
  );
}
