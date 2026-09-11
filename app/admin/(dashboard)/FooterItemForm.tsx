"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { createFooterItem, updateFooterItem } from "@/server/actions/admin-footer";
import type { FooterItem } from "@prisma/client";

export function FooterItemForm({
  section,
  item,
  compact,
}: {
  section: string;
  item?: FooterItem;
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
    formData.set("section", section);

    const result = item
      ? await updateFooterItem(item.id, formData)
      : await createFooterItem(formData);

    setLoading(false);
    if (!result.success) {
      setError(result.error ?? "حدث خطأ");
      return;
    }
    router.refresh();
    if (!item) (e.target as HTMLFormElement).reset();
  };

  const form = (
    <form onSubmit={handleSubmit} className="space-y-3" encType="multipart/form-data">
      <Input name="label" label="نص (اختياري)" defaultValue={item?.label ?? ""} />
      <Input name="link" label="الرابط (اختياري)" defaultValue={item?.link ?? ""} placeholder="https://..." />

      {item?.image && (
        <div className="relative h-12 w-12 rounded-luxury overflow-hidden bg-cream">
          <Image src={item.image} alt="" fill className="object-contain" />
        </div>
      )}
      <div>
        <label className="mb-1 block text-sm text-text/70">
          {item ? "استبدال الصورة (اختياري)" : "الصورة"}
        </label>
        <input type="file" name="image" accept="image/*" required={!item} className="w-full text-sm" />
      </div>

      <Input
        name="sortOrder"
        type="number"
        label="الترتيب"
        defaultValue={item?.sortOrder ?? 0}
      />
      <label className="flex items-center gap-2 text-sm">
        <input type="hidden" name="active" value="false" />
        <input type="checkbox" name="active" value="true" defaultChecked={item?.active ?? true} />
        نشط
      </label>
      {error && <p className="text-red-500 text-xs">{error}</p>}
      <Button type="submit" variant={compact ? "outline" : "accent"} size="sm" loading={loading}>
        {item ? "تحديث" : "إضافة"}
      </Button>
    </form>
  );

  return form;
}
