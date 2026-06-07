export type HeroSlide = {
  id: string;
  title: string;
  titleEn: string;
  subtitle?: string;
  subtitleEn?: string;
  image: string;
  ctaText?: string;
  ctaLink?: string;
  active: boolean;
};

export type CartItem = {
  productId: string;
  name: string;
  nameEn: string;
  price: number;
  image: string;
  quantity: number;
};

export type Locale = "ar" | "en";

export type ProductWithImages = {
  id: string;
  name: string;
  nameEn: string;
  description: string;
  descriptionEn: string | null;
  price: number | null;
  active: boolean;
  featured: boolean;
  categoryId: string;
  category?: { name: string; nameEn: string; slug: string };
  images: { id: string; url: string; sortOrder: number }[];
};
