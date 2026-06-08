import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getProductAdmin } from "@/server/queries";
import { ProductForm } from "../../ProductForm";
import { decimalToNumber } from "@/lib/utils";

export default async function EditProductPage({
  params,
}: {
  params: { id: string };
}) {
  const [product, categories] = await Promise.all([
    getProductAdmin(params.id),
    prisma.category.findMany({ orderBy: { sortOrder: "asc" } }),
  ]);

  if (!product) notFound();

  return (
    <div>
      <h1 className="font-display text-3xl font-bold mb-8">تعديل منتج</h1>
      <ProductForm
        categories={categories}
        product={{
          id: product.id,
          name: product.name,
          nameEn: product.nameEn,
          description: product.description,
          descriptionEn: product.descriptionEn ?? "",
          price: product.price ? decimalToNumber(product.price) : 0,
          categoryId: product.categoryId,
          active: product.active,
          featured: product.featured,
          images: product.images.map((i) => i.url),
        }}
      />
    </div>
  );
}
