import { getServerSession } from "next-auth";
import { authOptions } from "./auth-options";

export const ADMIN_EMAIL =
  process.env.ADMIN_EMAIL ?? "hithytl15@gmail.com";

export async function getSession() {
  return getServerSession(authOptions);
}

export async function requireAdmin() {
  const session = await getSession();
  if (!session?.user?.email) {
    return null;
  }
  if (session.user.email.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
    return null;
  }
  return session;
}

// ==== إضافة جديدة: التحقق من دخول عميل (أي حساب مسجّل، مو بالضرورة الأدمن) ====
export async function requireCustomer() {
  const session = await getSession();
  if (!session?.user?.email) {
    return null;
  }
  return session;
}
