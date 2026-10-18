"use server";

import bcrypt from "bcryptjs";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireCustomer } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";

type Result = { success: boolean; error?: string };

const HOUR_MS = 60 * 60 * 1000;
const NOT_LOGGED_IN: Result = { success: false, error: "الرجاء تسجيل الدخول أولًا" };
const ADMIN_BLOCKED: Result = {
  success: false,
  error: "حساب الأدمن يُدار من لوحة التحكم ولا يمكن تعديله من هنا",
};

// المستخدم الحالي دايمًا من الجلسة (ما نثق بأي معرّف يجي من المتصفح)
async function currentUser() {
  const session = await requireCustomer();
  const id = session?.user?.id;
  if (!id) return null;
  return prisma.user.findUnique({ where: { id } });
}

function normalizePhone(raw: string): { ok: true; value: string | null } | { ok: false } {
  const cleaned = raw
    .replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)))
    .replace(/[\s\-()]/g, "");

  if (cleaned === "") return { ok: true, value: null };

  // جوال سعودي: 05xxxxxxxx أو 9665xxxxxxxx أو +9665xxxxxxxx
  const saudi = /^(?:\+?966|00966|0)?(5\d{8})$/.exec(cleaned);
  if (saudi) return { ok: true, value: `0${saudi[1]}` };

  // رقم دولي
  if (/^\+?\d{8,15}$/.test(cleaned)) return { ok: true, value: cleaned };

  return { ok: false };
}

// ==================== تعديل الاسم ورقم الجوال ====================
export async function updateProfile(formData: FormData): Promise<Result> {
  const user = await currentUser();
  if (!user) return NOT_LOGGED_IN;

  if (!rateLimit(`profile:${user.id}`, 10, 10 * 60 * 1000)) {
    return { success: false, error: "محاولات كثيرة، الرجاء المحاولة بعد قليل" };
  }

  const name = String(formData.get("name") ?? "").trim();
  if (name.length < 2 || name.length > 60) {
    return { success: false, error: "الاسم لازم يكون بين حرفين و60 حرف" };
  }

  const phone = normalizePhone(String(formData.get("phone") ?? ""));
  if (!phone.ok) {
    return { success: false, error: "رقم الجوال غير صالح" };
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { name, phone: phone.value },
  });

  revalidatePath("/account");
  revalidatePath("/account/profile");
  return { success: true };
}

// ==================== تغيير البريد الإلكتروني ====================
export async function changeEmail(formData: FormData): Promise<Result> {
  const user = await currentUser();
  if (!user) return NOT_LOGGED_IN;
  if (user.role === "ADMIN") return ADMIN_BLOCKED;

  if (!rateLimit(`email:${user.id}`, 5, HOUR_MS)) {
    return { success: false, error: "محاولات كثيرة، الرجاء المحاولة لاحقًا" };
  }

  const parsed = z
    .string()
    .trim()
    .toLowerCase()
    .max(120)
    .email()
    .safeParse(String(formData.get("newEmail") ?? ""));
  if (!parsed.success) {
    return { success: false, error: "البريد الإلكتروني غير صالح" };
  }
  const newEmail = parsed.data;

  const confirm = String(formData.get("confirmEmail") ?? "").trim().toLowerCase();
  if (confirm !== newEmail) {
    return { success: false, error: "البريدان غير متطابقين" };
  }

  if (newEmail === user.email.toLowerCase()) {
    return { success: false, error: "هذا هو بريدك الحالي" };
  }

  const password = String(formData.get("currentPassword") ?? "");
  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    return { success: false, error: "كلمة المرور الحالية غير صحيحة" };
  }

  const taken = await prisma.user.findUnique({ where: { email: newEmail } });
  if (taken) {
    return { success: false, error: "هذا البريد مستخدم بحساب آخر" };
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      email: newEmail,
      resetToken: null,
      resetTokenExpiry: null,
      // يبطل كل الجلسات القديمة بكل الأجهزة
      sessionVersion: { increment: 1 },
    },
  });

  revalidatePath("/account");
  revalidatePath("/account/profile");
  return { success: true };
}

// ==================== تغيير كلمة المرور ====================
export async function changePassword(formData: FormData): Promise<Result> {
  const user = await currentUser();
  if (!user) return NOT_LOGGED_IN;
  if (user.role === "ADMIN") {
    return {
      success: false,
      error: "كلمة مرور الأدمن تتغير من صفحة الإعدادات بلوحة التحكم",
    };
  }

  if (!rateLimit(`password:${user.id}`, 5, HOUR_MS)) {
    return { success: false, error: "محاولات كثيرة، الرجاء المحاولة لاحقًا" };
  }

  const current = String(formData.get("currentPassword") ?? "");
  const next = String(formData.get("newPassword") ?? "");
  const confirm = String(formData.get("confirmPassword") ?? "");

  const valid = await bcrypt.compare(current, user.passwordHash);
  if (!valid) {
    return { success: false, error: "كلمة المرور الحالية غير صحيحة" };
  }

  if (next.length < 8) {
    return { success: false, error: "كلمة المرور الجديدة لازم تكون 8 أحرف على الأقل" };
  }
  if (next.length > 72) {
    return { success: false, error: "كلمة المرور طويلة جدًا" };
  }
  if (next !== confirm) {
    return { success: false, error: "كلمتا المرور غير متطابقتين" };
  }
  if (next === current) {
    return { success: false, error: "كلمة المرور الجديدة لازم تختلف عن الحالية" };
  }

  const passwordHash = await bcrypt.hash(next, 12);
  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash,
      resetToken: null,
      resetTokenExpiry: null,
      // يبطل كل الجلسات القديمة بكل الأجهزة (حتى لو أحد سرق جلسة قديمة)
      sessionVersion: { increment: 1 },
    },
  });

  return { success: true };
}

// ==================== تسجيل الخروج من كل الأجهزة ====================
export async function signOutEverywhere(): Promise<Result> {
  const user = await currentUser();
  if (!user) return NOT_LOGGED_IN;

  if (!rateLimit(`signout-all:${user.id}`, 5, HOUR_MS)) {
    return { success: false, error: "محاولات كثيرة، الرجاء المحاولة لاحقًا" };
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { sessionVersion: { increment: 1 } },
  });

  return { success: true };
}

// ==================== حذف الحساب ====================
// المفضلة والتقييمات تنحذف مع الحساب. الطلبات القديمة تبقى للسجلات المحاسبية
// بدون ربطها بالحساب (customerId يصير فاضي تلقائيًا).
export async function deleteAccount(formData: FormData): Promise<Result> {
  const user = await currentUser();
  if (!user) return NOT_LOGGED_IN;
  if (user.role === "ADMIN") return ADMIN_BLOCKED;

  if (!rateLimit(`delete:${user.id}`, 3, HOUR_MS)) {
    return { success: false, error: "محاولات كثيرة، الرجاء المحاولة لاحقًا" };
  }

  const confirmation = String(formData.get("confirmation") ?? "").trim();
  if (confirmation !== "حذف") {
    return { success: false, error: 'اكتب كلمة "حذف" للتأكيد' };
  }

  const password = String(formData.get("currentPassword") ?? "");
  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    return { success: false, error: "كلمة المرور غير صحيحة" };
  }

  await prisma.user.delete({ where: { id: user.id } });

  revalidatePath("/account");
  return { success: true };
}
