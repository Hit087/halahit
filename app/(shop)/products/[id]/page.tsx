import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  getProductById,
  getRelatedProducts,
  getSettings,
} from "@/server/queries";
import { ProductDetailClient } from "./ProductDetailClient";
import { ProductReviews } from "./ProductReviews";
import { ProductCard } from "@/components/products/ProductCard";
import { trackEvent } from "@/server/analytics";

// يقص الوصف عند آخر كلمة كاملة بدل ما ينقطع بنص الكلمة
function makeDescription(text: string, max = 155) {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max);
  const lastSpace = cut.lastIndexOf(" ");
  return `${cut.slice(0, lastSpace > 100 ? lastSpace : max).trim()}…`;
}

// ==================== عنوان ووصف وcanonical مخصص لكل منتج (SEO) ====================
export async function generateMetadata({
  params,
}: {
  params: { id: string };
}): Promise<Metadata> {
  const product = await getProductById(params.id);
  if (!product) return {};

  const description = makeDescription(product.description);
  const image = product.images[0]?.url;
  const canonical = `/products/${product.id}`;

  return {
    title: product.name,
    description,
    alternates: { canonical },
    openGraph: {
      title: product.name,
      description,
      url: canonical,
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

  const [related, settings] = await Promise.all([
    getRelatedProducts(product.categoryId, product.id, 4),
    getSettings(),
  ]);

  // بيانات هيكلية للمنتج (تساعد قوقل يعرض السعر والصورة بنتائج البحث)
  const hasPrice = typeof product.price === "number" && product.price > 0;
  const productJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: makeDescription(product.description, 300),
    sku: product.id,
    image: product.images.map((i) => i.url),
    brand: { "@type": "Brand", name: "هيت" },
    ...(hasPrice
      ? {
          offers: {
            "@type": "Offer",
            price: product.price,
            priceCurrency: "SAR",
            availability: "https://schema.org/InStock",
            url: `https://halahit.onrender.com/products/${product.id}`,
          },
        }
      : {}),
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
      />

      <ProductDetailClient
        product={product}
        whatsappNumber={settings?.whatsappNumber ?? null}
      />

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
