"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { announcementBarSchema } from "@/lib/validations";

async function guard() {
  const session = await requireAdmin();
  if (!session) throw new Error("غير مصرح");
}

export async function createAnnouncement(formData: FormData) {
  await guard();

  const raw = {
    message: formData.get("message"),
    active: formData.getAll("active").includes("true"),
    sortOrder: formData.get("sortOrder") ?? 0,
  };

  const parsed = announcementBarSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: "الرسالة غير صالحة" };
  }

  await prisma.announcementBar.create({ data: { ...parsed.data, id: crypto.randomUUID() } });
  revalidatePath("/");
  revalidatePath("/admin/announcements");
  return { success: true, error: undefined as string | undefined };
}

export async function updateAnnouncement(id: string, formData: FormData) {
  await guard();

  const raw = {
    message: formData.get("message"),
    active: formData.getAll("active").includes("true"),
    sortOrder: formData.get("sortOrder") ?? 0,
  };

  const parsed = announcementBarSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: "الرسالة غير صالحة" };
  }

  await prisma.announcementBar.update({ where: { id }, data: parsed.data });
  revalidatePath("/");
  revalidatePath("/admin/announcements");
  return { success: true, error: undefined as string | undefined };
}

export async function updateAnnouncementMode(scrolling: boolean) {
  await guard();
  await prisma.settings.upsert({
    where: { id: "default" },
    update: { announcementScrolling: scrolling },
    create: { id: "default", announcementScrolling: scrolling },
  });
  revalidatePath("/");
  revalidatePath("/admin/announcements");
  return { success: true };
}

export async function deleteAnnouncement(id: string) {
  await guard();
  try {
    await prisma.announcementBar.delete({ where: { id } });
  } catch {
    return { success: false, error: "تعذّر الحذف" };
  }
  revalidatePath("/");
  revalidatePath("/admin/announcements");
  return { success: true, error: undefined as string | undefined };
}
