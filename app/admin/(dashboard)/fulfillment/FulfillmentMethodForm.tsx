"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import {
  createFulfillmentMethod,
  updateFulfillmentMethod,
} from "@/server/actions/admin-fulfillment";
import type { FulfillmentMethod } from "@prisma/client";

export function FulfillmentMethodForm({
  method,
  compact,
}: {
  method?: FulfillmentMethod;
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
      ? await updateFulfillmentMethod(method.id, formData)
      : await createFulfillmentMethod(formData);

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
      <Input name="name" label="اسم الطريقة" defaultValue={method?.name} required />

      <label className="block text-sm">
        <span className="mb-1 block text-text/70">النوع</span>
        <select
          name="type"
          defaultValue={method?.type ?? "PICKUP"}
          className="w-full rounded-luxury border border-beige bg-white px-4 py-2.5 text-sm"
          required
        >
          <option value="PICKUP">استلام من الفرع</option>
          <option value="DELIVERY">توصيل</option>
        </select>
      </label>

      <Input
        name="price"
        type="number"
        step="0.01"
        label="السعر (ريال)"
        defaultValue={method ? Number(method.price) : 0}
      />
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
