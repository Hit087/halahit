import { getServerSession } from "next-auth";
import { authOptions } from "./auth-options";

// بريد الأدمن من متغير البيئة ADMIN_EMAIL فقط (ما نكتبه بالكود).
// لو المتغير مو مضبوط، ما أحد يُعتبر أدمن.
export const ADMIN_EMAIL = (process.env.ADMIN_EMAIL ?? "").trim();

export async function getSession() {
  return getServerSession(authOptions);
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
