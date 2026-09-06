"use server";

import { prisma } from "@/lib/prisma";
import { newsletterSchema } from "@/lib/validations";
import { sendNewsletterWelcomeEmail } from "@/lib/email";

export async function subscribeNewsletter(formData: FormData) {
  const raw = { email: formData.get("email") };
  const parsed = newsletterSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: "بريد إلكتروني غير صالح" };
  }

  const email = parsed.data.email.toLowerCase();

  const existing = await prisma.newsletterSubscriber.findUnique({ where: { email } });
  if (existing) {
    return { success: true, error: undefined as string | undefined };
  }

  await prisma.newsletterSubscriber.create({ data: { email } });
  await sendNewsletterWelcomeEmail(email);

  return { success: true, error: undefined as string | undefined };
}
