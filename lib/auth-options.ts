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
  if (a.count >= limit && a.lockedUntil <= now) {
    a.lockedUntil = now + LOCK_MS;
    // نسجّل الـIP بس (بدون الإيميل) عشان نقدر نتأكد من اشتغال الحماية من سجلات Render
    console.warn(`[auth] تم حظر تسجيل الدخول مؤقتًا بعد محاولات فاشلة متكررة (${key.split("|")[0]})`);
  }
}

function clientIp(headers: Record<string, unknown> | undefined): string {
  const pick = (name: string): string | undefined => {
    const v = headers?.[name];
    const first = Array.isArray(v) ? v[0] : v;
    return typeof first === "string" && first.trim() ? first : undefined;
  };

  // ترويسات Cloudflare ما تنزور من المستخدم، فنفضّلها على x-forwarded-for
  const value =
    pick("cf-connecting-ip") ??
    pick("true-client-ip") ??
    pick("x-forwarded-for") ??
    pick("x-real-ip") ??
    "unknown";

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
        const now = Date.now();
        cleanup(now);
        const ip = clientIp(req?.headers as Record<string, unknown> | undefined);

        // نبني المفاتيح قبل فحص صيغة المدخلات، عشان كل محاولة فاشلة تنحسب
        // (حتى لو كلمة المرور قصيرة وانرفضت من الفحص الأولي)
        const rawEmail = String(credentials?.email ?? "")
          .trim()
          .toLowerCase()
          .slice(0, 200);
        const accountKey = `acct:${ip}|${rawEmail}`;
        const ipKey = `ip:${ip}`;

        // محظور مؤقتًا: نرفض بدون ما نفحص كلمة المرور أصلًا
        if (isLocked(accountKey, now) || isLocked(ipKey, now)) {
          console.warn(`[auth] محاولة دخول أثناء الحظر المؤقت من ${ip}`);
          return null;
        }

        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) {
          recordFailure(accountKey, MAX_FAILS_PER_ACCOUNT, now);
          recordFailure(ipKey, MAX_FAILS_PER_IP, now);
          return null;
        }

        const { email, password } = parsed.data;
        const normalizedEmail = email.toLowerCase();

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

        // نحط البيانات بمتغير أول (بدل إرجاعها مباشرة) عشان TypeScript ما يعترض على الحقل الإضافي
        const authUser = {
          id: user.id,
          email: user.email,
          name: user.name ?? "",
          role: user.role,
          sessionVersion: user.sessionVersion,
        };
        return authUser;
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
        // رقم نسخة الجلسة وقت الدخول. لو تغيّر بالقاعدة، الجلسة القديمة تبطل
        token.sv = (user as { sessionVersion?: number }).sessionVersion ?? 0;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.email = token.email as string;
        (session.user as { role?: string }).role = token.role as string;
        (session.user as { sv?: number }).sv =
          typeof token.sv === "number" ? token.sv : 0;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};
