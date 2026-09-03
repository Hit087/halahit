"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { paymentMethodSchema } from "@/lib/validations";

async function guard() {
  const session = await requireAdmin();
  if (!session) throw new Error("غير مصرح");
}

export async function createPaymentMethod(formData: FormData) {
  await guard();

  const raw = {
    name: formData.get("name"),
    type: formData.get("type"),
    active: formData.getAll("active").includes("true"),
    sortOrder: formData.get("sortOrder") ?? 0,
  };

  const parsed = paymentMethodSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: "بيانات طريقة الدفع غير صالحة" };
  }

  await prisma.paymentMethod.create({ data: { ...parsed.data, id: crypto.randomUUID() } });
  revalidatePath("/");
  revalidatePath("/admin/payment-methods");
  return { success: true, error: undefined as string | undefined };
}

export async function updatePaymentMethod(id: string, formData: FormData) {
  await guard();

  const existing = await prisma.paymentMethod.findUnique({ where: { id } });
  if (!existing) return { success: false, error: "الطريقة غير موجودة" };

  const raw = {
    name: formData.get("name"),
    type: formData.get("type"),
    active: formData.getAll("active").includes("true"),
    sortOrder: formData.get("sortOrder") ?? 0,
  };

  const parsed = paymentMethodSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: "بيانات طريقة الدفع غير صالحة" };
  }

  await prisma.paymentMethod.update({ where: { id }, data: parsed.data });
  revalidatePath("/");
  revalidatePath("/admin/payment-methods");
  return { success: true, error: undefined as string | undefined };
}

export async function deletePaymentMethod(id: string) {
  await guard();

  try {
    await prisma.paymentMethod.delete({ where: { id } });
  } catch {
    return { success: false, error: "تعذّر حذف الطريقة" };
  }

  revalidatePath("/");
  revalidatePath("/admin/payment-methods");
  return { success: true, error: undefined as string | undefined };
}
