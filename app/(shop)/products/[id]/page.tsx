import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  getProductById,
  getRelatedProducts,
} from "@/server/queries";
import { ProductDetailClient } from "./ProductDetailClient";
import { ProductReviews } from "./ProductReviews";
import { ProductCard } from "@/components/products/ProductCard";
import { trackEvent } from "@/server/analytics";

// ==================== إضافة جديدة: عنوان ووصف مخصص لكل منتج (SEO) ====================
export async function generateMetadata({
  params,
}: {
  params: { id: string };
}): Promise<Metadata> {
  const product = await getProductById(params.id);
  if (!product) return {};

  const description = product.description.slice(0, 160);
  const image = product.images[0]?.url;

  return {
    title: product.name,
    description,
    openGraph: {
      title: product.name,
      description,
      images: image ? [{ url: image }] : undefined,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: product.name,
      description,
    },
  };
}

export default async function ProductDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const product = await getProductById(params.id);
  if (!product) notFound();

  await trackEvent("PRODUCT_VIEW", `/products/${params.id}`, product.id);

  const related = await getRelatedProducts(
    product.categoryId,
    product.id,
    4
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      <ProductDetailClient product={product} />

      <ProductReviews productId={product.id} />

      {related.length > 0 && (
        <section className="mt-20">
          <h2 className="mb-8 font-display text-2xl font-bold text-text">
            قد يعجبك أيضاً
          </h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
