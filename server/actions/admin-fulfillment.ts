"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { fulfillmentMethodSchema } from "@/lib/validations";

async function guard() {
  const session = await requireAdmin();
  if (!session) throw new Error("غير مصرح");
}

export async function createFulfillmentMethod(formData: FormData) {
  await guard();

  const raw = {
    name: formData.get("name"),
    type: formData.get("type"),
    price: formData.get("price") ?? 0,
    active: formData.getAll("active").includes("true"),
    sortOrder: formData.get("sortOrder") ?? 0,
  };

  const parsed = fulfillmentMethodSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: "بيانات طريقة الاستلام غير صالحة" };
  }

  await prisma.fulfillmentMethod.create({ data: { ...parsed.data, id: crypto.randomUUID() } });
  revalidatePath("/");
  revalidatePath("/admin/fulfillment");
  return { success: true };
}

export async function updateFulfillmentMethod(id: string, formData: FormData) {
  await guard();

  const existing = await prisma.fulfillmentMethod.findUnique({ where: { id } });
  if (!existing) return { success: false, error: "الطريقة غير موجودة" };

  const raw = {
    name: formData.get("name"),
    type: formData.get("type"),
    price: formData.get("price") ?? 0,
    active: formData.getAll("active").includes("true"),
    sortOrder: formData.get("sortOrder") ?? 0,
  };

  const parsed = fulfillmentMethodSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: "بيانات طريقة الاستلام غير صالحة" };
  }

  await prisma.fulfillmentMethod.update({ where: { id }, data: parsed.data });
  revalidatePath("/");
  revalidatePath("/admin/fulfillment");
  return { success: true };
}

export async function deleteFulfillmentMethod(id: string) {
  await guard();

  await prisma.fulfillmentMethod.delete({ where: { id } });
  revalidatePath("/");
  revalidatePath("/admin/fulfillment");
  return { success: true };
}
