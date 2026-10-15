import { headers } from "next/headers";

// محدّد معدّل بسيط بذاكرة السيرفر (يكفي لسيرفر واحد مثل وضعك الحالي).
// يحمي نقاط الدخول العامة من الإغراق (سبام الطلبات والإيميلات، وتخمين الكوبونات).
type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();

// نفضّل ترويسات Cloudflare لأنها ما تنزور من المستخدم، ثم x-forwarded-for كخيار أخير
export function getClientIp(h?: Headers): string {
  const source = h ?? headers();
  const cf = source.get("cf-connecting-ip");
  if (cf) return cf.trim();
  const trueClient = source.get("true-client-ip");
  if (trueClient) return trueClient.trim();
  const forwarded = source.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return source.get("x-real-ip")?.trim() || "unknown";
}

// يرجّع true إذا مسموح، false إذا تجاوز الحد
export function rateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();

  if (buckets.size > 10000) {
    buckets.forEach((b, k) => {
      if (b.resetAt <= now) buckets.delete(k);
    });
  }

  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (bucket.count >= limit) return false;
  bucket.count += 1;
  return true;
}
