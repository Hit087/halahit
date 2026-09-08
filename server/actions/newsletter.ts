"use server";

import { prisma } from "@/lib/prisma";
import { newsletterSchema } from "@/lib/validations";
import { sendNewsletterWelcomeEmail, sendCampaignEmail } from "@/lib/email";
import { requireAdmin } from "@/lib/auth";

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

// ==================== إضافة جديدة: إرسال حملة جماعية للمشتركين (أدمن فقط) ====================
export async function sendNewsletterCampaign(subject: string, message: string) {
  const session = await requireAdmin();
  if (!session) {
    return { success: false, error: "غير مصرح", sentCount: 0 };
  }

  if (!subject.trim() || !message.trim()) {
    return { success: false, error: "العنوان والرسالة مطلوبان", sentCount: 0 };
  }

  const subscribers = await prisma.newsletterSubscriber.findMany({
    select: { email: true },
  });

  let sentCount = 0;
  for (const sub of subscribers) {
    const result = await sendCampaignEmail(sub.email, subject, message);
    if (result.success) sentCount++;
  }

  return { success: true, error: undefined as string | undefined, sentCount };
}
