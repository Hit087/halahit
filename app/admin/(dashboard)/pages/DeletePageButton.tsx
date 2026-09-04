"use client";

import { deletePage } from "@/server/actions/admin-pages";
import { useRouter } from "next/navigation";

export function DeletePageButton({ id }: { id: string }) {
  const router = useRouter();
  return (
    <button
      type="button"
      className="mt-2 text-xs text-red-500 hover:underline"
      onClick={async () => {
        if (!confirm("حذف الصفحة؟")) return;
        const result = await deletePage(id);
        if (!result.success) alert(result.error);
        router.refresh();
      }}
    >
      حذف
    </button>
  );
}
