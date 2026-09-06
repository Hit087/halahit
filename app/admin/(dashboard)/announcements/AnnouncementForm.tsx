"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { createAnnouncement, updateAnnouncement } from "@/server/actions/admin-announcements";
import type { AnnouncementBar } from "@prisma/client";

export function AnnouncementForm({
  announcement,
  compact,
}: {
  announcement?: AnnouncementBar;
  compact?: boolean;
}) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const formData = new FormData(e.currentTarget);

    const result = announcement
      ? await updateAnnouncement(announcement.id, formData)
      : await createAnnouncement(formData);

    setLoading(false);
    if (!result.success) {
      setError(result.error ?? "حدث خطأ");
      return;
    }
    router.refresh();
    if (!announcement) (e.target as HTMLFormElement).reset();
  };

  const form = (
    <form onSubmit={handleSubmit} className="space-y-3">
      <Input name="message" label="نص الرسالة" defaultValue={announcement?.message} required />
      <Input
        name="sortOrder"
        type="number"
        label="الترتيب"
        defaultValue={announcement?.sortOrder ?? 0}
      />
      <label className="flex items-center gap-2 text-sm">
        <input type="hidden" name="active" value="false" />
        <input
          type="checkbox"
          name="active"
          value="true"
          defaultChecked={announcement?.active ?? true}
        />
        نشطة (تظهر بالموقع)
      </label>
      {error && <p className="text-red-500 text-xs">{error}</p>}
      <Button
        type="submit"
        variant={compact ? "outline" : "accent"}
        size="sm"
        loading={loading}
      >
        {announcement ? "تحديث" : "إضافة"}
      </Button>
    </form>
  );

  if (compact) return form;
  return <Card>{form}</Card>;
}
