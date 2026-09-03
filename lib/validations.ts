import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const productSchema = z.object({
  name: z.string().min(1).max(200),
  nameEn: z.string().min(1).max(200),
  description: z.string().min(1),
  descriptionEn: z.string().optional(),
  price: z.preprocess(
    (val) => (val === "" || val === null || val === undefined ? undefined : Number(val)),
    z.number().min(0).optional()
  ),
  categoryId: z.string().min(1),
  active: z.coerce.boolean(),
  featured: z.coerce.boolean(),
});

export const categorySchema = z.object({
  name: z.string().min(1).max(100),
  nameEn: z.string().min(1).max(100),
  slug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/),
  image: z.string().optional(),
  active: z.coerce.boolean(),
  sortOrder: z.coerce.number().int().min(0),
});

export const couponSchema = z.object({
  code: z.string().min(2).max(30).transform((s) => s.toUpperCase()),
  type: z.enum(["PERCENTAGE", "FIXED"]),
  value: z.coerce.number().positive(),
  expiresAt: z.string().optional().nullable(),
  active: z.coerce.boolean(),
});

export const settingsSchema = z.object({
  storeName: z.string().min(1).max(200),
  tagline: z.string().max(300),
  whatsappNumber: z.string().min(8).max(20).regex(/^\d+$/),
  logo: z.string().optional(),
  mapLink: z.string().url().optional().or(z.literal("")),
  jahezLink: z.string().url().optional().or(z.literal("")),
  hungerStationLink: z.string().url().optional().or(z.literal("")),
  toYouLink: z.string().url().optional().or(z.literal("")),
  tiktokLink: z.string().url().optional().or(z.literal("")),
  instagramLink: z.string().url().optional().or(z.literal("")),
  snapchatLink: z.string().url().optional().or(z.literal("")),
  kitalink: z.string().url().optional().or(z.literal("")),
  theChefzLink: z.string().url().optional().or(z.literal("")),
});

export const adminPasswordSchema = z
  .object({
    newPassword: z.string().min(6).max(100),
    confirmPassword: z.string().min(6).max(100),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "كلمتا المرور غير متطابقتين",
    path: ["confirmPassword"],
  });

export const heroSlideSchema = z.object({
  id: z.string(),
  title: z.string().min(1),
  titleEn: z.string().min(1),
  subtitle: z.string().optional(),
  subtitleEn: z.string().optional(),
  image: z.string().min(1),
  ctaText: z.string().optional(),
  ctaLink: z.string().optional(),
  active: z.boolean(),
});

export const checkoutSchema = z.object({
  customerName: z.string().min(2).max(100),
  customerPhone: z.string().min(8).max(20),
  couponCode: z.string().optional(),
  items: z.array(
    z.object({
      productId: z.string(),
      name: z.string(),
      nameEn: z.string().optional(),
      price: z.number().positive(),
      quantity: z.number().int().positive(),
    })
  ).min(1),
});

export const couponApplySchema = z.object({
  code: z.string().min(2).max(30),
  subtotal: z.number().nonnegative(),
});

// ==================== طرق الاستلام والتوصيل ====================
export const fulfillmentMethodSchema = z.object({
  name: z.string().min(1).max(100),
  type: z.enum(["PICKUP", "DELIVERY"]),
  price: z.coerce.number().min(0),
  active: z.coerce.boolean(),
  sortOrder: z.coerce.number().int().min(0),
});

// ==================== إضافة جديدة: طرق الدفع ====================
export const paymentMethodSchema = z.object({
  name: z.string().min(1).max(100),
  type: z.enum(["CASH", "GATEWAY"]),
  active: z.coerce.boolean(),
  sortOrder: z.coerce.number().int().min(0),
});
