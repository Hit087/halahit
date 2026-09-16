"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

async function guard() {
  const session = await requireAdmin();
  if (!session) throw new Error("غير مصرح");
}

export async function approveReview(id: string) {
  await guard();
  const review = await prisma.review.update({
    where: { id },
    data: { approved: true },
  });
  revalidatePath("/admin/reviews");
  revalidatePath(`/products/${review.productId}`);
  return { success: true };
}

// ==================== إضافة جديدة: إخفاء تقييم منشور بأي وقت ====================
export async function unapproveReview(id: string) {
  await guard();
  const review = await prisma.review.update({
    where: { id },
    data: { approved: false },
  });
  revalidatePath("/admin/reviews");
  revalidatePath(`/products/${review.productId}`);
  return { success: true };
}

export async function deleteReview(id: string) {
  await guard();
  const review = await prisma.review.delete({ where: { id } });
  revalidatePath("/admin/reviews");
  revalidatePath(`/products/${review.productId}`);
  return { success: true };
}
