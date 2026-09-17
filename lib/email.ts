import { formatPrice } from "./utils";

const BREVO_API_KEY = process.env.BREVO_API_KEY;
const BREVO_ENDPOINT = "https://api.brevo.com/v3/smtp/email";

const SENDER = {
  email: "hithytl15@gmail.com",
  name: "Hit | هيت",
};

const statusLabels: Record<string, string> = {
  PENDING: "قيد الانتظار",
  CONFIRMED: "مؤكد",
  DELIVERED: "تم التوصيل",
  CANCELLED: "ملغي",
};

function wrapEmail(title: string, bodyHtml: string) {
  return `
  <div dir="rtl" style="font-family: Tahoma, Arial, sans-serif; background:#FBF3EC; padding:32px;">
    <div style="max-width:480px; margin:0 auto; background:#ffffff; border-radius:16px; padding:32px; box-shadow:0 4px 16px rgba(0,0,0,0.06);">
      <h2 style="color:#3E2723; margin-top:0;">${title}</h2>
      ${bodyHtml}
      <p style="margin-top:32px; color:#9a8f89; font-size:12px;">هذه رسالة تلقائية من متجر هيت.</p>
    </div>
  </div>`;
}

async function sendEmail(to: string, subject: string, html: string) {
  if (!BREVO_API_KEY) {
    console.error("BREVO_API_KEY is not set, skipping email send");
    return { success: false, error: "لم يتم إعداد مفتاح البريد" };
  }

  try {
    const res = await fetch(BREVO_ENDPOINT, {
      method: "POST",
      headers: {
        "api-key": BREVO_API_KEY,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        sender: SENDER,
        to: [{ email: to }],
        subject,
        htmlContent: html,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("Brevo email failed", res.status, errText);
      return { success: false, error: errText };
    }

    return { success: true, error: undefined as string | undefined };
  } catch (e) {
    console.error("Failed to send email via Brevo", e);
    return { success: false, error: "تعذّر الإرسال" };
  }
}

export async function sendWelcomeEmail(to: string, name: string) {
  return sendEmail(
    to,
    "أهلاً بك في هيت 🎉",
    wrapEmail(
      `أهلاً ${name}!`,
      `<p style="color:#3E2723; line-height:1.8;">تم إنشاء حسابك بنجاح في متجر هيت. تقدر الحين تتابع طلباتك وتحفظ منتجاتك المفضلة من صفحة حسابك.</p>`
    )
  );
}

export async function sendOrderConfirmationEmail(
  to: string,
  params: { orderNumber: string; total: number; trackingToken: string }
) {
  return sendEmail(
    to,
    `تأكيد الطلب #${params.orderNumber}`,
    wrapEmail(
      "تم استلام طلبك",
      `<p style="color:#3E2723; line-height:1.8;">شكراً لطلبك من هيت! رقم طلبك <strong>${params.orderNumber}</strong> والإجمالي <strong>${formatPrice(params.total)}</strong>.</p>
      <p style="margin-top:16px;"><a href="https://halahit.onrender.com/orders/${params.trackingToken}" style="color:#7A3B41;">تابع حالة طلبك من هنا</a></p>`
    )
  );
}

export async function sendOrderStatusEmail(
  to: string,
  params: { orderNumber: string; status: string; trackingToken: string }
) {
  return sendEmail(
    to,
    `تحديث حالة طلبك #${params.orderNumber}`,
    wrapEmail(
      "تحديث على طلبك",
      `<p style="color:#3E2723; line-height:1.8;">حالة طلبك <strong>${params.orderNumber}</strong> الحين: <strong>${statusLabels[params.status] ?? params.status}</strong></p>
      <p style="margin-top:16px;"><a href="https://halahit.onrender.com/orders/${params.trackingToken}" style="color:#7A3B41;">عرض تفاصيل الطلب</a></p>`
    )
  );
}

export async function sendNewsletterWelcomeEmail(to: string) {
  return sendEmail(
    to,
    "تم اشتراكك في نشرة هيت 💌",
    wrapEmail(
      "أهلاً بك!",
      `<p style="color:#3E2723; line-height:1.8;">شكراً لاشتراكك بنشرتنا البريدية — راح تكون أول من يعرف عن عروضنا ومنتجاتنا الجديدة.</p>`
    )
  );
}

export async function sendCampaignEmail(to: string, subject: string, message: string) {
  return sendEmail(
    to,
    subject,
    wrapEmail(subject, `<div style="color:#3E2723; line-height:1.8; white-space:pre-line;">${message}</div>`)
  );
}

// ==================== إضافة جديدة: استرجاع كلمة المرور ====================
export async function sendPasswordResetEmail(to: string, resetLink: string) {
  return sendEmail(
    to,
    "إعادة تعيين كلمة المرور — هيت",
    wrapEmail(
      "طلب إعادة تعيين كلمة المرور",
      `<p style="color:#3E2723; line-height:1.8;">وصلنا طلب لإعادة تعيين كلمة مرور حسابك. اضغط الرابط أدناه لاختيار كلمة مرور جديدة (صالح لمدة ساعة واحدة):</p>
      <p style="margin-top:16px;"><a href="${resetLink}" style="color:#7A3B41; font-weight:bold;">إعادة تعيين كلمة المرور</a></p>
      <p style="margin-top:16px; color:#9a8f89; font-size:13px;">إذا لم تطلب هذا، تجاهل هذه الرسالة.</p>`
    )
  );
}
