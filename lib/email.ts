import { Resend } from "resend";
import { formatPrice } from "./utils";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = "Hit | هيت <onboarding@resend.dev>";

const statusLabels: Record<string, string> = {
  PENDING: "قيد الانتظار",
  CONFIRMED: "مؤكد",
  DELIVERED: "تم التوصيل",
  CANCELLED: "ملغي",
};

function wrapEmail(title: string, bodyHtml: string) {
  return `
  <div dir="rtl" style="font-family: Tahoma, Arial, sans-serif; background:#FDF6F0; padding:32px;">
    <div style="max-width:480px; margin:0 auto; background:#ffffff; border-radius:16px; padding:32px; box-shadow:0 4px 16px rgba(0,0,0,0.06);">
      <h2 style="color:#3E2723; margin-top:0;">${title}</h2>
      ${bodyHtml}
      <p style="margin-top:32px; color:#9a8f89; font-size:12px;">هذه رسالة تلقائية من متجر هيت.</p>
    </div>
  </div>`;
}

export async function sendWelcomeEmail(to: string, name: string) {
  try {
    await resend.emails.send({
      from: FROM,
      to,
      subject: "أهلاً بك في هيت 🎉",
      html: wrapEmail(
        `أهلاً ${name}!`,
        `<p style="color:#3E2723; line-height:1.8;">تم إنشاء حسابك بنجاح في متجر هيت. تقدر الحين تتابع طلباتك وتحفظ منتجاتك المفضلة من صفحة حسابك.</p>`
      ),
    });
  } catch (e) {
    console.error("Failed to send welcome email", e);
  }
}

export async function sendOrderConfirmationEmail(
  to: string,
  params: { orderNumber: string; total: number; trackingToken: string }
) {
  try {
    await resend.emails.send({
      from: FROM,
      to,
      subject: `تأكيد الطلب #${params.orderNumber}`,
      html: wrapEmail(
        "تم استلام طلبك",
        `<p style="color:#3E2723; line-height:1.8;">شكراً لطلبك من هيت! رقم طلبك <strong>${params.orderNumber}</strong> والإجمالي <strong>${formatPrice(params.total)}</strong>.</p>
        <p style="margin-top:16px;"><a href="https://halahit.onrender.com/orders/${params.trackingToken}" style="color:#E91E63;">تابع حالة طلبك من هنا</a></p>`
      ),
    });
  } catch (e) {
    console.error("Failed to send order confirmation email", e);
  }
}

export async function sendOrderStatusEmail(
  to: string,
  params: { orderNumber: string; status: string; trackingToken: string }
) {
  try {
    await resend.emails.send({
      from: FROM,
      to,
      subject: `تحديث حالة طلبك #${params.orderNumber}`,
      html: wrapEmail(
        "تحديث على طلبك",
        `<p style="color:#3E2723; line-height:1.8;">حالة طلبك <strong>${params.orderNumber}</strong> الحين: <strong>${statusLabels[params.status] ?? params.status}</strong></p>
        <p style="margin-top:16px;"><a href="https://halahit.onrender.com/orders/${params.trackingToken}" style="color:#E91E63;">عرض تفاصيل الطلب</a></p>`
      ),
    });
  } catch (e) {
    console.error("Failed to send order status email", e);
  }
}

export async function sendNewsletterWelcomeEmail(to: string) {
  try {
    await resend.emails.send({
      from: FROM,
      to,
      subject: "تم اشتراكك في نشرة هيت 💌",
      html: wrapEmail(
        "أهلاً بك!",
        `<p style="color:#3E2723; line-height:1.8;">شكراً لاشتراكك بنشرتنا البريدية — راح تكون أول من يعرف عن عروضنا ومنتجاتنا الجديدة.</p>`
      ),
    });
  } catch (e) {
    console.error("Failed to send newsletter welcome email", e);
  }
}
