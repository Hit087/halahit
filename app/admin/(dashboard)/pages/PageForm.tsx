"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { createPage, updatePage } from "@/server/actions/admin-pages";
import type { Page } from "@prisma/client";

export function PageForm({
  page,
  compact,
}: {
  page?: Page;
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

    const result = page
      ? await updatePage(page.id, formData)
      : await createPage(formData);

    setLoading(false);
    if (!result.success) {
      setError(result.error ?? "حدث خطأ");
      return;
    }
    router.refresh();
    if (!page) (e.target as HTMLFormElement).reset();
  };

  const form = (
    <form onSubmit={handleSubmit} className="space-y-3">
      <Input name="title" label="عنوان الصفحة" defaultValue={page?.title} required />
      <Input
        name="slug"
        label="المسار (بالإنجليزي، مثال: terms أو privacy)"
        defaultValue={page?.slug}
        placeholder="terms"
        required
      />
      <label className="block text-sm">
        <span className="mb-1 block text-text/70">المحتوى</span>
        <textarea
          name="content"
          defaultValue={page?.content}
          rows={8}
          className="w-full rounded-luxury border border-beige bg-white px-4 py-2.5 text-sm"
          required
        />
      </label>
      <Input
        name="sortOrder"
        type="number"
        label="الترتيب"
        defaultValue={page?.sortOrder ?? 0}
      />
      <label className="flex items-center gap-2 text-sm">
        <input type="hidden" name="active" value="false" />
        <input
          type="checkbox"
          name="active"
          value="true"
          defaultChecked={page?.active ?? true}
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
        {page ? "تحديث" : "إضافة"}
      </Button>
    </form>
  );

  if (compact) return form;
  return <Card>{form}</Card>;
}
