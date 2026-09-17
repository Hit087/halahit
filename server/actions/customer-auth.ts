"use server";

import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { registerSchema, forgotPasswordSchema, resetPasswordSchema } from "@/lib/validations";
import { sendWelcomeEmail, sendPasswordResetEmail } from "@/lib/email";

export async function registerCustomer(formData: FormData) {
  const raw = {
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  };

  const parsed = registerSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "بيانات غير صالحة",
    };
  }

  const email = parsed.data.email.toLowerCase();

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return { success: false, error: "هذا البريد مسجّل بالفعل" };
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 12);

  await prisma.user.create({
    data: {
      email,
      name: parsed.data.name,
      passwordHash,
      role: "CUSTOMER",
    },
  });

  await sendWelcomeEmail(email, parsed.data.name);

  return { success: true, error: undefined as string | undefined };
}

// ==================== إضافة جديدة: طلب استرجاع كلمة المرور ====================
export async function requestPasswordReset(formData: FormData) {
  const raw = { email: formData.get("email") };
  const parsed = forgotPasswordSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: "بريد إلكتروني غير صالح" };
  }

  const email = parsed.data.email.toLowerCase();
  const user = await prisma.user.findUnique({ where: { email } });

  // لا نكشف هل البريد مسجّل أو لا (حماية خصوصية) — نرجّع نجاح دايمًا
  if (!user) {
    return { success: true, error: undefined as string | undefined };
  }

  const resetToken = crypto.randomUUID();
  const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // ساعة وحدة

  await prisma.user.update({
    where: { id: user.id },
    data: { resetToken, resetTokenExpiry },
  });

  const resetLink = `https://halahit.onrender.com/account/reset-password/${resetToken}`;
  await sendPasswordResetEmail(email, resetLink);

  return { success: true, error: undefined as string | undefined };
}

// ==================== إضافة جديدة: تنفيذ إعادة تعيين كلمة المرور ====================
export async function resetPassword(formData: FormData) {
  const raw = {
    token: formData.get("token"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  };

  const parsed = resetPasswordSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "بيانات غير صالحة",
    };
  }

  const user = await prisma.user.findUnique({
    where: { resetToken: parsed.data.token },
  });

  if (!user || !user.resetTokenExpiry || user.resetTokenExpiry < new Date()) {
    return { success: false, error: "الرابط غير صالح أو منتهي الصلاحية، الرجاء طلب رابط جديد" };
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 12);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash,
      resetToken: null,
      resetTokenExpiry: null,
    },
  });

  return { success: true, error: undefined as string | undefined };
}
