"use server";

import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { registerSchema } from "@/lib/validations";
import { sendWelcomeEmail } from "@/lib/email";

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
