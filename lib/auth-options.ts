import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";
import { loginSchema } from "./validations";

// ==================== حماية تسجيل الدخول من التخمين المتكرر ====================
// العدّاد بذاكرة السيرفر (يكفي لسيرفر واحد). مفتاحه IP + الإيميل،
// عشان واحد يخمّن ما يقدر يقفل حساب الأدمن على الباقين.
const MAX_FAILS_PER_ACCOUNT = 5; // محاولات فاشلة لنفس الـIP ونفس الإيميل
const MAX_FAILS_PER_IP = 20; // محاولات فاشلة لنفس الـIP بأي إيميل
const WINDOW_MS = 15 * 60 * 1000;
const LOCK_MS = 15 * 60 * 1000;

type Attempt = { count: number; firstAt: number; lockedUntil: number };
const attempts = new Map<string, Attempt>();

// تأخير ثابت التكلفة لو الإيميل غير موجود، عشان ما يعرف المهاجم أي الإيميلات مسجلة
const DUMMY_HASH = bcrypt.hashSync("not-a-real-password", 10);

function cleanup(now: number) {
  if (attempts.size < 5000) return;
  attempts.forEach((a, key) => {
    if (a.lockedUntil < now && now - a.firstAt > WINDOW_MS) attempts.delete(key);
  });
}

function isLocked(key: string, now: number): boolean {
  const a = attempts.get(key);
  return !!a && a.lockedUntil > now;
}

function recordFailure(key: string, limit: number, now: number) {
  const a = attempts.get(key);
  if (!a || now - a.firstAt > WINDOW_MS) {
    attempts.set(key, { count: 1, firstAt: now, lockedUntil: 0 });
    return;
  }
  a.count += 1;
  if (a.count >= limit) a.lockedUntil = now + LOCK_MS;
}

function clientIp(headers: Record<string, unknown> | undefined): string {
  const forwarded = headers?.["x-forwarded-for"];
  const raw = Array.isArray(forwarded) ? forwarded[0] : forwarded;
  const real = headers?.["x-real-ip"];
  const value = (raw ?? real ?? "unknown") as string;
  return String(value).split(",")[0].trim() || "unknown";
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, req) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const { email, password } = parsed.data;
        const normalizedEmail = email.toLowerCase();

        const now = Date.now();
        cleanup(now);
        const ip = clientIp(req?.headers as Record<string, unknown> | undefined);
        const accountKey = `acct:${ip}|${normalizedEmail}`;
        const ipKey = `ip:${ip}`;

        // محظور مؤقتًا: نرفض بدون ما نفحص كلمة المرور أصلًا
        if (isLocked(accountKey, now) || isLocked(ipKey, now)) return null;

        const user = await prisma.user.findUnique({
          where: { email: normalizedEmail },
        });

        const hash = user?.passwordHash ?? DUMMY_HASH;
        const isValid = await bcrypt.compare(password, hash);

        if (!user || !user.passwordHash || !isValid) {
          recordFailure(accountKey, MAX_FAILS_PER_ACCOUNT, now);
          recordFailure(ipKey, MAX_FAILS_PER_IP, now);
          return null;
        }

        // نجح الدخول: نصفّر عدّاد الحساب
        attempts.delete(accountKey);

        return {
          id: user.id,
          email: user.email,
          name: user.name ?? "",
          role: user.role,
        };
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
  },
  pages: {
    signIn: "/admin/login",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.role = (user as { role?: string }).role ?? "CUSTOMER";
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.email = token.email as string;
        (session.user as { role?: string }).role = token.role as string;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};
