import { notFound } from "next/navigation";
import {
  getProductById,
  getRelatedProducts,
} from "@/server/queries";
import { ProductDetailClient } from "./ProductDetailClient";
import { ProductReviews } from "./ProductReviews";
import { ProductCard } from "@/components/products/ProductCard";
import { trackEvent } from "@/server/analytics";

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

      {/* ==== إضافة جديدة: قسم التقييمات ==== */}
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
