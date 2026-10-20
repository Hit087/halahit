"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireCustomer } from "@/lib/auth";
import { reviewSchema } from "@/lib/validations";
import { rateLimit } from "@/lib/rate-limit";

const MAX_COMMENT_LENGTH = 1000;

export async function createReview(formData: FormData) {
  const session = await requireCustomer();
  if (!session?.user?.id) {
    return { success: false, error: "الرجاء تسجيل الدخول لإضافة تقييم" };
  }
  const userId = session.user.id;

  // حد لعدد التقييمات بالساعة (يمنع إغراق التقييمات)
  if (!rateLimit(`review:${userId}`, 10, 60 * 60 * 1000)) {
    return { success: false, error: "محاولات كثيرة، الرجاء المحاولة لاحقًا" };
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

  if (parsed.data.comment && parsed.data.comment.length > MAX_COMMENT_LENGTH) {
    return { success: false, error: "التعليق طويل جدًا (الحد 1000 حرف)" };
  }

  // الاسم والبريد من القاعدة (الجلسة ممكن تكون قديمة بعد تعديل الاسم أو البريد)
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { name: true, email: true },
  });
  if (!user) {
    return { success: false, error: "الرجاء تسجيل الدخول لإضافة تقييم" };
  }

  // المنتج لازم يكون موجود ومتاح
  const product = await prisma.product.findFirst({
    where: { id: parsed.data.productId, active: true },
    select: { id: true },
  });
  if (!product) {
    return { success: false, error: "المنتج غير متوفر" };
  }

  const existing = await prisma.review.findUnique({
    where: {
      userId_productId: {
        userId,
        productId: product.id,
      },
    },
  });

  if (existing) {
    return { success: false, error: "لقد قيّمت هذا المنتج من قبل" };
  }

  try {
    await prisma.review.create({
      data: {
        productId: product.id,
        userId,
        // الاسم المعروض للعموم: اسم العميل فقط. ما نعرض الإيميل أبدًا
        customerName: user.name?.trim() || "عميل",
        // الإيميل يُحفظ للأدمن فقط (للرد على العميل)
        customerEmail: user.email,
        rating: parsed.data.rating,
        comment: parsed.data.comment,
        approved: false,
      },
    });
  } catch {
    // لو انرسل التقييم مرتين بنفس اللحظة (قيد التفرد بالقاعدة)
    return { success: false, error: "لقد قيّمت هذا المنتج من قبل" };
  }

  revalidatePath(`/products/${product.id}`);

  return { success: true, error: undefined as string | undefined };
}
