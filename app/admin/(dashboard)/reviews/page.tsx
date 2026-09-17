import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/Badge";
import { ReviewActions } from "./ReviewActions";

export default async function AdminReviewsPage() {
  const reviews = await prisma.review.findMany({
    include: { product: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <h1 className="font-display text-3xl font-bold mb-8">التقييمات</h1>
      <div className="space-y-4">
        {reviews.map((r) => (
          <div key={r.id} className="rounded-luxury-lg bg-white p-4 shadow-soft">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-medium">
                  {r.customerName} — {r.product.name}
                </p>
                {/* ==== إضافة جديدة: بريد المقيّم + رابط رد مباشر ==== */}
                {r.customerEmail && (
                  <a
                    href={`mailto:${r.customerEmail}`}
                    className="text-xs text-accent hover:underline"
                  >
                    {r.customerEmail}
                  </a>
                )}
                <p className="mt-1 text-sm text-text/60">{"⭐".repeat(r.rating)}</p>
                {r.comment && <p className="mt-1 text-sm text-text/70">{r.comment}</p>}
              </div>
              <Badge variant={r.approved ? "success" : "muted"}>
                {r.approved ? "منشور" : "قيد المراجعة"}
              </Badge>
            </div>
            <ReviewActions id={r.id} approved={r.approved} />
          </div>
        ))}
        {reviews.length === 0 && (
          <p className="text-center text-text/50 py-12">لا توجد تقييمات بعد</p>
        )}
      </div>
    </div>
  );
}
