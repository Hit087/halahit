"use client";

import { deletePaymentMethod } from "@/server/actions/admin-payment-methods";
import { useRouter } from "next/navigation";

export function DeletePaymentMethodButton({ id }: { id: string }) {
  const router = useRouter();
  return (
    <button
      type="button"
      className="mt-2 text-xs text-red-500 hover:underline"
      onClick={async () => {
        if (!confirm("حذف طريقة الدفع؟")) return;
        const result = await deletePaymentMethod(id);
        if (!result.success) alert(result.error);
        router.refresh();
      }}
    >
      حذف
    </button>
  );
}
