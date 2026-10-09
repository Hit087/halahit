"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

async function guard() {
  const session = await requireAdmin();
  if (!session) throw new Error("غير مصرح");
}

const MAX_LEN = 50;

export async function updateCommercialInfo(formData: FormData) {
  await guard();

  const reg = String(formData.get("commercialRegNumber") ?? "").trim();
  const license = String(formData.get("commercialLicenseNumber") ?? "").trim();
  const visible = formData.getAll("commercialRegVisible").includes("true");

  if (reg.length > MAX_LEN || license.length > MAX_LEN) {
    return { success: false, error: "الرقم طويل جدًا" };
  }

  // ما نسمح بتفعيل الإظهار والرقمين فاضيين
  if (visible && !reg && !license) {
    return {
      success: false,
      error: "اكتب رقم السجل التجاري أو الرخصة قبل تفعيل الإظهار بالموقع",
    };
  }

  const data = {
    commercialRegNumber: reg || null,
    commercialLicenseNumber: license || null,
    commercialRegVisible: visible,
  };

  await prisma.settings.upsert({
    where: { id: "default" },
    update: data,
    create: { id: "default", ...data },
  });

  revalidatePath("/");
  revalidatePath("/admin/footer");

  return { success: true };
}
