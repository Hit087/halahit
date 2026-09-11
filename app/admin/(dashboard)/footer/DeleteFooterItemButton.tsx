"use client";

import { deleteFooterItem } from "@/server/actions/admin-footer";
import { useRouter } from "next/navigation";

export function DeleteFooterItemButton({ id }: { id: string }) {
  const router = useRouter();
  return (
    <button
      type="button"
      className="mt-2 text-xs text-red-500 hover:underline"
      onClick={async () => {
        if (!confirm("حذف هذا العنصر؟")) return;
        const result = await deleteFooterItem(id);
        if (!result.success) alert(result.error);
        router.refresh();
      }}
    >
      حذف
    </button>
  );
}
