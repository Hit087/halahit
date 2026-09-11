"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { footerItemSchema } from "@/lib/validations";
import { saveUploadedFile } from "@/server/upload";

async function guard() {
  const session = await requireAdmin();
  if (!session) throw new Error("غير مصرح");
}

export async function createFooterItem(formData: FormData) {
  await guard();

  const raw = {
    section: formData.get("section"),
    label: formData.get("label") || undefined,
    link: formData.get("link") || undefined,
    active: formData.getAll("active").includes("true"),
    sortOrder: formData.get("sortOrder") ?? 0,
  };

  const parsed = footerItemSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: "بيانات غير صالحة" };
  }

  const file = formData.get("image");
  if (!(file instanceof File) || file.size === 0) {
    return { success: false, error: "الرجاء رفع صورة" };
  }
  const image = await saveUploadedFile(file);

  await prisma.footerItem.create({
    data: { ...parsed.data, image, id: crypto.randomUUID() },
  });

  revalidatePath("/");
  revalidatePath("/admin/footer");
  return { success: true, error: undefined as string | undefined };
}

export async function updateFooterItem(id: string, formData: FormData) {
  await guard();

  const existing = await prisma.footerItem.findUnique({ where: { id } });
  if (!existing) return { success: false, error: "العنصر غير موجود" };

  const raw = {
    section: formData.get("section"),
    label: formData.get("label") || undefined,
    link: formData.get("link") || undefined,
    active: formData.getAll("active").includes("true"),
    sortOrder: formData.get("sortOrder") ?? 0,
  };

  const parsed = footerItemSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: "بيانات غير صالحة" };
  }

  const file = formData.get("image");
  let image = existing.image;
  if (file instanceof File && file.size > 0) {
    image = await saveUploadedFile(file);
  }

  await prisma.footerItem.update({
    where: { id },
    data: { ...parsed.data, image },
  });

  revalidatePath("/");
  revalidatePath("/admin/footer");
  return { success: true, error: undefined as string | undefined };
}

export async function deleteFooterItem(id: string) {
  await guard();
  try {
    await prisma.footerItem.delete({ where: { id } });
  } catch {
    return { success: false, error: "تعذّر الحذف" };
  }
  revalidatePath("/");
  revalidatePath("/admin/footer");
  return { success: true, error: undefined as string | undefined };
}
