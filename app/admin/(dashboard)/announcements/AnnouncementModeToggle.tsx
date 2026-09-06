"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateAnnouncementMode } from "@/server/actions/admin-announcements";

export function AnnouncementModeToggle({ scrolling }: { scrolling: boolean }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleToggle = async (value: boolean) => {
    setLoading(true);
    await updateAnnouncementMode(value);
    setLoading(false);
    router.refresh();
  };

  return (
    <div className="rounded-luxury-lg bg-white p-4 shadow-soft">
      <p className="mb-2 text-sm font-medium">طريقة عرض الشريط</p>
      <div className="flex gap-2">
        <button
          type="button"
          disabled={loading}
          onClick={() => handleToggle(true)}
          className={`rounded-full px-4 py-2 text-sm ${
            scrolling ? "bg-accent text-white" : "bg-beige text-text"
          }`}
        >
          متحرك (يمين لليسار)
        </button>
        <button
          type="button"
          disabled={loading}
          onClick={() => handleToggle(false)}
          className={`rounded-full px-4 py-2 text-sm ${
            !scrolling ? "bg-accent text-white" : "bg-beige text-text"
          }`}
        >
          ثابت
        </button>
      </div>
    </div>
  );
}
