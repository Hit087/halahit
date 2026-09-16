"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireCustomer } from "@/lib/auth";
import { reviewSchema } from "@/lib/validations";

export async function createReview(formData: FormData) {
  const session = await requireCustomer();
  if (!session?.user?.id) {
    return { success: false, error: "الرجاء تسجيل الدخول لإضافة تقييم" };
  }

  const raw = {
    productId: formData.get("productId"),
    rating: formData.get("rating"),
    comment: formData.get("comment") || undefined,
  };

  const parsed = reviewSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: "بيانات التقييم غير صالحة" };
  }

  const existing = await prisma.review.findUnique({
    where: {
      userId_productId: {
        userId: session.user.id,
        productId: parsed.data.productId,
      },
    },
  });
  if (existing) {
    return { success: false, error: "لقد قيّمت هذا المنتج من قبل" };
  }

  await prisma.review.create({
    data: {
      productId: parsed.data.productId,
      userId: session.user.id,
      customerName: session.user.name || session.user.email || "عميل",
      customerEmail: session.user.email ?? null,
      rating: parsed.data.rating,
      comment: parsed.data.comment,
      approved: false,
    },
  });

  revalidatePath(`/products/${parsed.data.productId}`);
  return { success: true, error: undefined as string | undefined };
}
