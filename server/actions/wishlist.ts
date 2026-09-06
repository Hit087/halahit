"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireCustomer } from "@/lib/auth";

export async function toggleWishlist(productId: string) {
  const session = await requireCustomer();
  if (!session?.user?.id) {
    return { success: false, error: "الرجاء تسجيل الدخول أولاً", inWishlist: false };
  }

  const existing = await prisma.wishlistItem.findUnique({
    where: { userId_productId: { userId: session.user.id, productId } },
  });

  if (existing) {
    await prisma.wishlistItem.delete({ where: { id: existing.id } });
    revalidatePath("/account/wishlist");
    return { success: true, error: undefined as string | undefined, inWishlist: false };
  }

  await prisma.wishlistItem.create({
    data: { userId: session.user.id, productId },
  });
  revalidatePath("/account/wishlist");
  return { success: true, error: undefined as string | undefined, inWishlist: true };
}

export async function getWishlistProductIds() {
  const session = await requireCustomer();
  if (!session?.user?.id) return [];
  const items = await prisma.wishlistItem.findMany({
    where: { userId: session.user.id },
    select: { productId: true },
  });
  return items.map((i) => i.productId);
}
