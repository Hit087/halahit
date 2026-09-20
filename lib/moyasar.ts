const MOYASAR_SECRET_KEY = process.env.MOYASAR_SECRET_KEY;
const MOYASAR_BASE_URL = "https://api.moyasar.com/v1";

// ==== يرجع false لحد ما تُضاف MOYASAR_SECRET_KEY فعليًا بمتغيرات البيئة ====
export function isMoyasarConfigured(): boolean {
  return Boolean(MOYASAR_SECRET_KEY);
}

function authHeader() {
  const encoded = Buffer.from(`${MOYASAR_SECRET_KEY}:`).toString("base64");
  return `Basic ${encoded}`;
}

type CreateInvoiceResult =
  | { success: true; url: string; id: string }
  | { success: false; error: string };

// ==== ينشئ فاتورة دفع مستضافة (Hosted Invoice) ويرجع رابط صفحة الدفع ====
export async function createMoyasarInvoice(params: {
  amount: number; // بالريال — يُحوَّل تلقائيًا للهللات
  description: string;
  callbackUrl: string;
}): Promise<CreateInvoiceResult> {
  if (!isMoyasarConfigured()) {
    return { success: false, error: "بوابة الدفع غير مفعّلة" };
  }

  try {
    const res = await fetch(`${MOYASAR_BASE_URL}/invoices`, {
      method: "POST",
      headers: {
        Authorization: authHeader(),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount: Math.round(params.amount * 100),
        currency: "SAR",
        description: params.description,
        callback_url: params.callbackUrl,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("Moyasar invoice creation failed", res.status, errText);
      return { success: false, error: "تعذّر إنشاء فاتورة الدفع" };
    }

    const data = await res.json();
    return { success: true, url: data.url, id: data.id };
  } catch (e) {
    console.error("Moyasar request failed", e);
    return { success: false, error: "تعذّر الاتصال ببوابة الدفع" };
  }
}

// ==== للتحقق لاحقًا من حالة فاتورة (paid/initiated/expired) عند الحاجة ====
export async function getMoyasarInvoiceStatus(id: string) {
  if (!isMoyasarConfigured()) return null;
  try {
    const res = await fetch(`${MOYASAR_BASE_URL}/invoices/${id}`, {
      headers: { Authorization: authHeader() },
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (e) {
    console.error("Moyasar status check failed", e);
    return null;
  }
}
