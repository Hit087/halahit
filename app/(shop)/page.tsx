import Link from "next/link";
import { HeroCarousel } from "@/components/home/HeroCarousel";
import { ProductCard } from "@/components/products/ProductCard";
import {
  getSettings,
  parseHeroSlides,
  getFeaturedProducts,
  getCategoriesWithProducts,
} from "@/server/queries";

export default async function HomePage() {
  const [settings, featured, categoriesWithProducts] = await Promise.all([
    getSettings(),
    getFeaturedProducts(6),
    getCategoriesWithProducts(),
  ]);

  const heroSlides = parseHeroSlides(settings?.heroSlides);

  return (
    <>
      <HeroCarousel slides={heroSlides} />

      {/* منتجات مميزة */}
      <section className="mx-auto max-w-7xl px-4 pt-6 pb-10 sm:px-6">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-xl sm:text-2xl font-bold text-text">
            منتجات مميزة
          </h2>
          <Link
            href="/products"
            className="text-sm font-medium text-accent transition hover:underline"
          >
            عرض الكل ←
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {featured.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
        {featured.length === 0 && (
          <p className="text-center text-text/50 py-8">لا توجد منتجات مميزة حالياً</p>
        )}
      </section>

      {/* الأقسام */}
      {categoriesWithProducts.map((category, idx) => (
        <section
          key={category.id}
          className={`py-8 ${idx % 2 === 0 ? "bg-canvas" : "bg-white"}`}
        >
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-text">
                  {category.name}
                </h2>
                <p className="mt-0.5 text-xs text-text/50">{category.nameEn}</p>
              </div>
              <Link
                href={`/products?category=${category.slug}`}
                className="text-sm font-medium text-accent transition hover:underline"
              >
                عرض الكل ←
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {category.products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        </section>
      ))}

      {/* تاغلاين */}
      <section className="bg-canvas py-12 text-center">
        <p className="font-display text-xl text-text/70 md:text-2xl">
          {settings?.tagline ?? "لكل قطعة ذكرى"}
        </p>
      </section>
    </>
  );
}
