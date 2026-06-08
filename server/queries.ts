import { prisma } from "@/lib/prisma";
import { decimalToNumber } from "@/lib/utils";
import type { HeroSlide, ProductWithImages } from "@/types";

export async function getSettings() {
  try {
    return await prisma.settings.findFirst();
  } catch (e) {
    return {
      id: "default",
      storeName: "Hit | هيت",
      tagline: "أكل قلبية ذكرى",
      whatsappNumber: "",
      logo: null,
      mapLink: null,
      jahezLink: null,
      hungerStationLink: null,
      toYouLink: null,
      tiktokLink: null,
      instagramLink: null,
      snapchatLink: null,
      kitalink: null,
      theChefzLink: null,
      adminPassword: null,
      heroSlides: [],
    };
  }
}

export function parseHeroSlides(heroSlides: unknown): HeroSlide[] {
  if (!Array.isArray(heroSlides)) return [];
  return heroSlides.filter(
    (s): s is HeroSlide =>
      typeof s === "object" &&
      s !== null &&
      "id" in s &&
      "title" in s &&
      "image" in s
  );
}

type ProductRecord = {
  id: string;
  name: string;
  nameEn: string;
  description: string;
  descriptionEn: string | null;
  price: { toNumber(): number } | number | null;
  active: boolean;
  featured: boolean;
  categoryId: string;
  category?: { name: string; nameEn: string; slug: string } | null;
  images: { id: string; url: string; sortOrder: number }[];
};

function mapProduct(p: ProductRecord): ProductWithImages {
  return {
    id: p.id,
    name: p.name,
    nameEn: p.nameEn,
    description: p.description,
    descriptionEn: p.descriptionEn,
    price: p.price ? decimalToNumber(p.price) : 0,
    active: p.active,
    featured: p.featured,
    categoryId: p.categoryId,
    category: p.category
      ? { name: p.category.name, nameEn: p.category.nameEn, slug: p.category.slug }
      : undefined,
    images: p.images,
  };
}

export async function getFeaturedProducts(limit = 6) {
  const products = await prisma.product.findMany({
    where: { active: true, featured: true },
    include: {
      images: { orderBy: { sortOrder: "asc" } },
      category: true,
    },
    take: limit,
    orderBy: { createdAt: "desc" },
  });
  return products.map(mapProduct);
}

export async function getActiveCategories() {
  return prisma.category.findMany({
    where: { active: true },
    orderBy: { sortOrder: "asc" },
  });
}

export async function getCategoriesWithProducts() {
  const categories = await prisma.category.findMany({
    where: { active: true },
    orderBy: { sortOrder: "asc" },
    include: {
      products: {
        where: { active: true },
        include: {
          images: { orderBy: { sortOrder: "asc" } },
          category: true,
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });
  return categories
    .map((cat) => ({
      ...cat,
      products: cat.products.map(mapProduct),
    }))
    .filter((cat) => cat.products.length >= 0);
}

export async function getProducts(filters?: {
  categorySlug?: string;
  search?: string;
}) {
  const products = await prisma.product.findMany({
    where: {
      active: true,
      ...(filters?.categorySlug && {
        category: { slug: filters.categorySlug },
      }),
      ...(filters?.search && {
        OR: [
          { name: { contains: filters.search, mode: "insensitive" } },
          { nameEn: { contains: filters.search, mode: "insensitive" } },
        ],
      }),
    },
    include: {
      images: { orderBy: { sortOrder: "asc" } },
      category: true,
    },
    orderBy: { createdAt: "desc" },
  });
  return products.map(mapProduct);
}

export async function getProductById(id: string) {
  const product = await prisma.product.findFirst({
    where: { id, active: true },
    include: {
      images: { orderBy: { sortOrder: "asc" } },
      category: true,
    },
  });
  if (!product) return null;
  return mapProduct(product);
}

export async function getRelatedProducts(
  categoryId: string,
  excludeId: string,
  limit = 4
) {
  const products = await prisma.product.findMany({
    where: {
      active: true,
      categoryId,
      id: { not: excludeId },
    },
    include: {
      images: { orderBy: { sortOrder: "asc" } },
      category: true,
    },
    take: limit,
  });
  return products.map(mapProduct);
}

export async function getAllProductsAdmin() {
  return prisma.product.findMany({
    include: {
      images: { orderBy: { sortOrder: "asc" } },
      category: true,
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getProductAdmin(id: string) {
  return prisma.product.findUnique({
    where: { id },
    include: {
      images: { orderBy: { sortOrder: "asc" } },
      category: true,
    },
  });
}

export async function getOrdersAdmin() {
  return prisma.order.findMany({
    include: { items: true },
    orderBy: { createdAt: "desc" },
  });
}

export async function getOrderAdmin(id: string) {
  return prisma.order.findUnique({
    where: { id },
    include: { items: { include: { product: true } } },
  });
}
