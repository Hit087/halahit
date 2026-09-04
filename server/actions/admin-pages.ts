"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { pageSchema } from "@/lib/validations";

async function guard() {
  const session = await requireAdmin();
  if (!session) throw new Error("غير مصرح");
}

export async function createPage(formData: FormData) {
  await guard();

  const raw = {
    slug: formData.get("slug"),
    title: formData.get("title"),
    content: formData.get("content"),
    active: formData.getAll("active").includes("true"),
    sortOrder: formData.get("sortOrder") ?? 0,
  };

  const parsed = pageSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "بيانات الصفحة غير صالحة" };
  }

  const existing = await prisma.page.findUnique({ where: { slug: parsed.data.slug } });
  if (existing) {
    return { success: false, error: "المسار مستخدم بالفعل لصفحة أخرى" };
  }

  await prisma.page.create({ data: { ...parsed.data, id: crypto.randomUUID() } });
  revalidatePath("/");
  revalidatePath("/admin/pages");
  return { success: true, error: undefined as string | undefined };
}

export async function updatePage(id: string, formData: FormData) {
  await guard();

  const existing = await prisma.page.findUnique({ where: { id } });
  if (!existing) return { success: false, error: "الصفحة غير موجودة" };

  const raw = {
    slug: formData.get("slug"),
    title: formData.get("title"),
    content: formData.get("content"),
    active: formData.getAll("active").includes("true"),
    sortOrder: formData.get("sortOrder") ?? 0,
  };

  const parsed = pageSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "بيانات الصفحة غير صالحة" };
  }

  const slugTaken = await prisma.page.findFirst({
    where: { slug: parsed.data.slug, NOT: { id } },
  });
  if (slugTaken) {
    return { success: false, error: "المسار مستخدم بالفعل لصفحة أخرى" };
  }

  await prisma.page.update({ where: { id }, data: parsed.data });
  revalidatePath("/");
  revalidatePath("/admin/pages");
  revalidatePath(`/pages/${parsed.data.slug}`);
  return { success: true, error: undefined as string | undefined };
}

export async function deletePage(id: string) {
  await guard();

  try {
    await prisma.page.delete({ where: { id } });
  } catch {
    return { success: false, error: "تعذّر حذف الصفحة" };
  }

  revalidatePath("/");
  revalidatePath("/admin/pages");
  return { success: true, error: undefined as string | undefined };
}
