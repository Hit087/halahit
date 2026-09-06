import { ProductCard } from "@/components/products/ProductCard";
import { getProducts, getActiveCategories } from "@/server/queries";
import Link from "next/link";

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: { category?: string; q?: string; sort?: string };
}) {
  const sort = searchParams.sort === "bestselling" ? "bestselling" : "newest";

  const [products, categories] = await Promise.all([
    getProducts({
      categorySlug: searchParams.category,
      search: searchParams.q,
      sort,
    }),
    getActiveCategories(),
  ]);

  // بناء رابط يحافظ على باقي المعاملات عند تغيير معامل واحد
  const buildUrl = (overrides: Record<string, string | undefined>) => {
    const params = new URLSearchParams();
    const merged = { category: searchParams.category, q: searchParams.q, sort: searchParams.sort, ...overrides };
    Object.entries(merged).forEach(([key, value]) => {
      if (value) params.set(key, value);
    });
    const qs = params.toString();
    return `/products${qs ? `?${qs}` : ""}`;
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      <h1 className="font-display text-4xl font-bold text-text">المنتجات</h1>

      {/* ==== إضافة جديدة: صندوق البحث ==== */}
      <form action="/products" method="GET" className="mt-6 max-w-md">
        {searchParams.category && (
          <input type="hidden" name="category" value={searchParams.category} />
        )}
        {searchParams.sort && (
          <input type="hidden" name="sort" value={searchParams.sort} />
        )}
        <div className="relative">
          <input
            type="text"
            name="q"
            defaultValue={searchParams.q}
            placeholder="ابحث عن منتج..."
            className="w-full rounded-full border border-beige bg-white py-2.5 pr-4 pl-11 text-sm outline-none focus:border-accent"
          />
          <button
            type="submit"
            className="absolute left-1.5 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-accent text-white"
            aria-label="بحث"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11a6 6 0 11-12 0 6 6 0 0112 0z" />
            </svg>
          </button>
        </div>
      </form>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap gap-3">
          <Link
            href={buildUrl({ category: undefined })}
            className={`rounded-full px-5 py-2 text-sm font-medium transition ${
              !searchParams.category
                ? "bg-accent text-white"
                : "bg-beige text-text hover:bg-primary"
            }`}
          >
            الكل
          </Link>
          {categories.map((cat) => (
            <Link
              key={cat.id}
              href={buildUrl({ category: cat.slug })}
              className={`rounded-full px-5 py-2 text-sm font-medium transition ${
                searchParams.category === cat.slug
                  ? "bg-accent text-white"
                  : "bg-beige text-text hover:bg-primary"
              }`}
            >
              {cat.name}
            </Link>
          ))}
        </div>

        {/* ==== إضافة جديدة: فرز حسب الأحدث/الأكثر مبيعًا ==== */}
        <div className="flex items-center gap-2 text-sm">
          <span className="text-text/60">ترتيب:</span>
          <Link
            href={buildUrl({ sort: undefined })}
            className={`rounded-full px-4 py-1.5 font-medium transition ${
              sort === "newest" ? "bg-accent text-white" : "bg-beige text-text"
            }`}
          >
            الأحدث
          </Link>
          <Link
            href={buildUrl({ sort: "bestselling" })}
            className={`rounded-full px-4 py-1.5 font-medium transition ${
              sort === "bestselling" ? "bg-accent text-white" : "bg-beige text-text"
            }`}
          >
            الأكثر مبيعًا
          </Link>
        </div>
      </div>

      <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>

      {products.length === 0 && (
        <p className="mt-16 text-center text-text/50">لا توجد منتجات</p>
      )}
    </div>
  );
}
