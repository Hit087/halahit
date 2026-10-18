import { getServerSession } from "next-auth";
import { authOptions } from "./auth-options";
import { prisma } from "./prisma";

// بريد الأدمن من متغير البيئة ADMIN_EMAIL فقط (ما نكتبه بالكود).
// لو المتغير مو مضبوط، ما أحد يُعتبر أدمن.
export const ADMIN_EMAIL = (process.env.ADMIN_EMAIL ?? "").trim();

// الجلسة الصالحة فقط: نقارن رقم نسخة الجلسة بالقاعدة.
// لو تغيّرت كلمة المرور أو انحذف الحساب أو طلب المستخدم الخروج من كل الأجهزة،
// الجلسات القديمة ترجع null ويُعتبر صاحبها غير مسجّل دخول.
export async function getSession() {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  if (!session || !userId) return null;

  const tokenVersion = (session.user as { sv?: number }).sv ?? 0;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { sessionVersion: true },
  });

  if (!user || user.sessionVersion !== tokenVersion) {
    return null;
  }

  return session;
}

export async function requireAdmin() {
  if (!ADMIN_EMAIL) {
    return null;
  }

  const session = await getSession();
  if (!session?.user?.email) {
    return null;
  }

  // لازم الإيميل يطابق إيميل الأدمن + الدور ADMIN (حماية مزدوجة)
  if (session.user.email.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
    return null;
  }

  if ((session.user as { role?: string }).role !== "ADMIN") {
    return null;
  }

  return session;
}

// ==== التحقق من دخول عميل (أي حساب مسجّل، مو بالضرورة الأدمن) ====
export async function requireCustomer() {
  const session = await getSession();
  if (!session?.user?.email) {
    return null;
  }
  return session;
}
