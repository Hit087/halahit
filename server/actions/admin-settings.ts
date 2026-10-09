"use server";

import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { requireAdmin, ADMIN_EMAIL } from "@/lib/auth";
import {
  settingsSchema,
  heroSlideSchema,
  adminPasswordSchema,
} from "@/lib/validations";
import { saveUploadedFile } from "@/server/upload";
import type { HeroSlide } from "@/types";

async function guard() {
  const session = await requireAdmin();
  if (!session) throw new Error("غير مصرح");
}

// حقول صارت تُدار من صفحة الفوتر (لا نلمسها عند حفظ الإعدادات حتى ما تنمسح)
const FOOTER_MANAGED_KEYS = [
  "jahezLink",
  "hungerStationLink",
  "toYouLink",
  "tiktokLink",
  "instagramLink",
  "snapchatLink",
  "kitalink",
  "theChefzLink",
  "commercialRegNumber",
  "commercialLicenseNumber",
  "commercialRegVisible",
] as const;

export async function updateSettings(formData: FormData) {
  await guard();

  const logoFile = formData.get("logo");
  const existing = await prisma.settings.findUnique({ where: { id: "default" } });

  let logo = existing?.logo ?? undefined;
  if (logoFile instanceof File && logoFile.size > 0) {
    logo = await saveUploadedFile(logoFile);
  }

  const raw = {
    storeName: formData.get("storeName"),
    tagline: formData.get("tagline"),
    whatsappNumber: formData.get("whatsappNumber"),
    logo,
    mapLink: formData.get("mapLink") || "",
    vatEnabled: formData.getAll("vatEnabled").includes("true"),
    onlinePaymentEnabled: formData.getAll("onlinePaymentEnabled").includes("true"),

    // قيم فارغة فقط عشان تمر من فحص الـschema، ولا تُحفظ (تُحذف قبل الحفظ تحت)
    jahezLink: "",
    hungerStationLink: "",
    toYouLink: "",
    tiktokLink: "",
    instagramLink: "",
    snapchatLink: "",
    kitalink: "",
    theChefzLink: "",
    commercialRegNumber: "",
    commercialLicenseNumber: "",
    commercialRegVisible: false,
  };

  const parsed = settingsSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: "بيانات الإعدادات غير صالحة" };
  }

  const nullableLink = (value?: string) => value || null;

  const data: Record<string, unknown> = {
    ...parsed.data,
    mapLink: nullableLink(parsed.data.mapLink),
    logo: parsed.data.logo || logo || null,
  };

  // نشيل الحقول اللي تُدار من الفوتر، عشان حفظ الإعدادات ما يمسحها
  for (const key of FOOTER_MANAGED_KEYS) {
    delete data[key];
  }

  const newPassword = formData.get("newPassword");
  const confirmPassword = formData.get("confirmPassword");
  const hasPasswordChange =
    typeof newPassword === "string" &&
    newPassword.length > 0 &&
    typeof confirmPassword === "string" &&
    confirmPassword.length > 0;

  if (hasPasswordChange) {
    const passwordParsed = adminPasswordSchema.safeParse({
      newPassword,
      confirmPassword,
    });

    if (!passwordParsed.success) {
      return {
        success: false,
        error: passwordParsed.error.issues[0]?.message ?? "كلمة المرور غير صالحة",
      };
    }

    const passwordHash = await bcrypt.hash(passwordParsed.data.newPassword, 12);
    data.adminPassword = passwordHash;

    await prisma.user.upsert({
      where: { email: ADMIN_EMAIL.toLowerCase() },
      update: { passwordHash },
      create: {
        email: ADMIN_EMAIL.toLowerCase(),
        passwordHash,
        name: "Admin",
        role: "ADMIN",
      },
    });
  }

  await prisma.settings.upsert({
    where: { id: "default" },
    update: data,
    create: { id: "default", ...data },
  });

  revalidatePath("/");
  revalidatePath("/admin/settings");

  return { success: true };
}

export async function updateHeroSlides(slidesJson: string) {
  await guard();

  let slides: unknown;
  try {
    slides = JSON.parse(slidesJson);
  } catch {
    return { success: false, error: "بيانات الشرائح غير صالحة" };
  }

  if (!Array.isArray(slides)) {
    return { success: false, error: "يجب أن تكون الشرائح مصفوفة" };
  }

  const validated: HeroSlide[] = [];
  for (const slide of slides) {
    const parsed = heroSlideSchema.safeParse(slide);
    if (!parsed.success) {
      return { success: false, error: "شريحة غير صالحة" };
    }
    validated.push(parsed.data);
  }

  await prisma.settings.upsert({
    where: { id: "default" },
    update: { heroSlides: validated },
    create: { id: "default", heroSlides: validated },
  });

  revalidatePath("/");
  revalidatePath("/admin/settings");

  return { success: true };
}

export async function uploadHeroImage(formData: FormData) {
  await guard();

  const file = formData.get("image");
  if (!(file instanceof File) || file.size === 0) {
    return { success: false, error: "لم يتم اختيار ملف" };
  }

  const url = await saveUploadedFile(file);
  return { success: true, url };
}
