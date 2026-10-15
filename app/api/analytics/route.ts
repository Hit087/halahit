import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { trackEvent } from "@/server/analytics";
import { getClientIp, rateLimit } from "@/lib/rate-limit";

// فقط الأنواع اللي يرسلها المتصفح فعليًا. نوع ORDER يسجله السيرفر بنفسه ولا يُقبل من هنا.
const schema = z.object({
  type: z.enum(["PAGE_VIEW", "PRODUCT_VIEW"]),
  path: z.string().max(300).startsWith("/").optional(),
  productId: z.string().max(64).optional(),
});

export async function POST(req: NextRequest) {
  try {
    // حد الطلبات لكل IP: يمنع إغراق القاعدة بأحداث وهمية
    const ip = getClientIp(req.headers);
    if (!rateLimit(`analytics:${ip}`, 120, 60 * 1000)) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid" }, { status: 400 });
    }

    await trackEvent(
      parsed.data.type,
      parsed.data.path,
      parsed.data.productId
    );

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
