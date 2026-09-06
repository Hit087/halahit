"use client";

import { deleteAnnouncement } from "@/server/actions/admin-announcements";
import { useRouter } from "next/navigation";

export function DeleteAnnouncementButton({ id }: { id: string }) {
  const router = useRouter();
  return (
    <button
      type="button"
      className="mt-2 text-xs text-red-500 hover:underline"
      onClick={async () => {
        if (!confirm("حذف الرسالة؟")) return;
        const result = await deleteAnnouncement(id);
        if (!result.success) alert(result.error);
        router.refresh();
      }}
    >
      حذف
    </button>
  );
}
