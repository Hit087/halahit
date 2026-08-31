"use client";

import { deleteFulfillmentMethod } from "@/server/actions/admin-fulfillment";
import { useRouter } from "next/navigation";

export function DeleteFulfillmentMethodButton({ id }: { id: string }) {
  const router = useRouter();
  return (
    <button
      type="button"
      className="mt-2 text-xs text-red-500 hover:underline"
      onClick={async () => {
        if (!confirm("حذف طريقة الاستلام/التوصيل؟")) return;
        const result = await deleteFulfillmentMethod(id);
        if (!result.success) alert(result.error);
        router.refresh();
      }}
    >
      حذف
    </button>
  );
}
