"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import {
  createPaymentMethod,
  updatePaymentMethod,
} from "@/server/actions/admin-payment-methods";
import type { PaymentMethod } from "@prisma/client";

export function PaymentMethodForm({
  method,
  compact,
}: {
  method?: PaymentMethod;
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

    const result = method
      ? await updatePaymentMethod(method.id, formData)
      : await createPaymentMethod(formData);

    setLoading(false);
    if (!result.success) {
      setError(result.error ?? "حدث خطأ");
      return;
    }
    router.refresh();
    if (!method) (e.target as HTMLFormElement).reset();
  };

  const form = (
    <form onSubmit={handleSubmit} className="space-y-3">
      <Input name="name" label="اسم طريقة الدفع" defaultValue={method?.name} required />

      <label className="block text-sm">
        <span className="mb-1 block text-text/70">النوع</span>
        <select
          name="type"
          defaultValue={method?.type ?? "CASH"}
          className="w-full rounded-luxury border border-beige bg-white px-4 py-2.5 text-sm"
          required
        >
          <option value="CASH">الدفع عند الاستلام (واتساب)</option>
          <option value="GATEWAY">بوابة دفع إلكتروني</option>
        </select>
      </label>

      <Input
        name="sortOrder"
        type="number"
        label="الترتيب"
        defaultValue={method?.sortOrder ?? 0}
      />
      <label className="flex items-center gap-2 text-sm">
        <input type="hidden" name="active" value="false" />
        <input
          type="checkbox"
          name="active"
          value="true"
          defaultChecked={method?.active ?? true}
        />
        نشط (يظهر للعميل بصفحة الدفع)
      </label>
      {error && <p className="text-red-500 text-xs">{error}</p>}
      <Button
        type="submit"
        variant={compact ? "outline" : "accent"}
        size="sm"
        loading={loading}
      >
        {method ? "تحديث" : "إضافة"}
      </Button>
    </form>
  );

  if (compact) return form;
  return <Card>{form}</Card>;
}
