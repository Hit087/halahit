"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { createProduct, updateProduct } from "@/server/actions/admin-products";
import type { Category } from "@prisma/client";

type ProductFormProps = {
  categories: Category[];
  product?: {
    id: string;
    name: string;
    nameEn: string;
    description: string;
    descriptionEn: string;
    price: number;
    stock: number | null;
    categoryId: string;
    active: boolean;
    featured: boolean;
    images: string[];
  };
};

export function ProductForm({ categories, product }: ProductFormProps) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [keepImages, setKeepImages] = useState<string[]>(product?.images ?? []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    formData.set("keepImages", keepImages.join(","));

    const result = product
      ? await updateProduct(product.id, formData)
      : await createProduct(formData);

    setLoading(false);

    if (!result.success) {
      setError(result.error ?? "حدث خطأ");
      return;
    }

    router.push("/admin/products");
    router.refresh();
  };

  return (
    <Card className="max-w-2xl">
      <form onSubmit={handleSubmit} className="space-y-4" encType="multipart/form-data">
        <Input id="name" name="name" label="الاسم (عربي)" defaultValue={product?.name} required />
        <Input id="nameEn" name="nameEn" label="الاسم (إنجليزي)" defaultValue={product?.nameEn} required />
        <div>
          <label className="mb-1.5 block text-sm font-medium">الوصف (عربي)</label>
          <textarea
            name="description"
            defaultValue={product?.description}
            required
            rows={4}
            className="w-full rounded-luxury border border-beige px-4 py-3"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium">الوصف (إنجليزي)</label>
          <textarea
            name="descriptionEn"
            defaultValue={product?.descriptionEn}
            rows={3}
            className="w-full rounded-luxury border border-beige px-4 py-3"
          />
        </div>
        <Input
          id="price"
          name="price"
          type="number"
          step="0.01"
          label="السعر (ر.س)"
          defaultValue={product?.price}
        />

        {/* ==== إضافة جديدة: الكمية المتوفرة ==== */}
        <Input
          id="stock"
          name="stock"
          type="number"
          step="1"
          min="0"
          label="الكمية المتوفرة (اتركه فارغًا إذا لا تريد تتبّع المخزون)"
          defaultValue={product?.stock ?? ""}
        />

        <div>
          <label className="mb-1.5 block text-sm font-medium">التصنيف</label>
          <select
            name="categoryId"
            defaultValue={product?.categoryId}
            required
            className="w-full rounded-luxury border border-beige px-4 py-3"
          >
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div className="flex gap-6">
          <label className="flex items-center gap-2">
            <input type="hidden" name="active" value="false" />
            <input
              type="checkbox"
              name="active"
              value="true"
              defaultChecked={product?.active ?? true}
            />
            نشط
          </label>
          <label className="flex items-center gap-2">
            <input type="hidden" name="featured" value="false" />
            <input
              type="checkbox"
              name="featured"
              value="true"
              defaultChecked={product?.featured ?? false}
            />
            مميز
          </label>
        </div>

        {keepImages.length > 0 && (
          <div>
            <p className="text-sm font-medium mb-2">الصور الحالية</p>
            <div className="flex flex-wrap gap-3">
              {keepImages.map((url) => (
                <div key={url} className="relative h-20 w-20 rounded-luxury overflow-hidden">
                  <Image src={url} alt="" fill className="object-cover" />
                  <button
                    type="button"
                    onClick={() => setKeepImages((imgs) => imgs.filter((u) => u !== url))}
                    className="absolute top-0 right-0 bg-red-500 text-white text-xs px-1 rounded-bl"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div>
          <label className="mb-1.5 block text-sm font-medium">صور جديدة</label>
          <input
            type="file"
            name="images"
            accept="image/*"
            multiple
            className="w-full text-sm"
          />
        </div>

        {error && <p className="text-red-500 text-sm">{error}</p>}

        <div className="flex gap-3">
          <Button type="submit" variant="accent" loading={loading}>
            {product ? "حفظ التعديلات" : "إضافة المنتج"}
          </Button>
          <Button type="button" variant="ghost" onClick={() => router.back()}>
            إلغاء
          </Button>
        </div>
      </form>
    </Card>
  );
}
