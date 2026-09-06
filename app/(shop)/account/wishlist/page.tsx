import { redirect } from "next/navigation";
import { requireCustomer } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { decimalToNumber } from "@/lib/utils";
import { ProductCard } from "@/components/products/ProductCard";

export default async function AccountWishlistPage() {
  const session = await requireCustomer();
  if (!session?.user?.id) redirect("/account/login");

  const items = await prisma.wishlistItem.findMany({
    where: { userId: session.user.id },
    include: {
      product: {
        include: {
          images: { orderBy: { sortOrder: "asc" } },
          category: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const products = items.map((i) => ({
    id: i.product.id,
    name: i.product.name,
    nameEn: i.product.nameEn,
    description: i.product.description,
    descriptionEn: i.product.descriptionEn,
    price: i.product.price ? decimalToNumber(i.product.price) : 0,
    active: i.product.active,
    featured: i.product.featured,
    categoryId: i.product.categoryId,
    stock: i.product.stock ?? null,
    category: i.product.category
      ? {
          name: i.product.category.name,
          nameEn: i.product.category.nameEn,
          slug: i.product.category.slug,
        }
      : undefined,
    images: i.product.images,
  }));

  return (
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
      <h1 className="font-display text-3xl font-bold">المفضلة</h1>

      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} initialInWishlist />
        ))}
      </div>

      {products.length === 0 && (
        <p className="mt-16 text-center text-text/50">لا توجد منتجات محفوظة بعد</p>
      )}
    </div>
  );
}
