import { getProductReviews, getReviewStats } from "@/server/queries";
import { getSession } from "@/lib/auth";
import { ReviewForm } from "./ReviewForm";

const StarPath =
  "M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.562.562 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.562.562 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z";

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <svg
          key={i}
          className={`h-4 w-4 ${i <= Math.round(rating) ? "fill-accent text-accent" : "fill-none text-beige"}`}
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d={StarPath} />
        </svg>
      ))}
    </div>
  );
}

export async function ProductReviews({ productId }: { productId: string }) {
  const [reviews, stats, session] = await Promise.all([
    getProductReviews(productId),
    getReviewStats(productId),
    getSession(),
  ]);

  return (
    <section className="mt-16 border-t border-beige pt-10">
      <div className="flex items-center gap-3">
        <h2 className="font-display text-2xl font-bold text-text">التقييمات</h2>
        {stats.count > 0 && (
          <>
            <Stars rating={stats.average} />
            <span className="text-sm text-text/60">({stats.count})</span>
          </>
        )}
      </div>

      {session?.user ? (
        <div className="mt-6 max-w-lg">
          <ReviewForm productId={productId} />
        </div>
      ) : (
        <p className="mt-4 text-sm text-text/60">
          <a href="/account/login" className="text-accent hover:underline">
            سجّل دخولك
          </a>{" "}
          لإضافة تقييم
        </p>
      )}

      <div className="mt-8 space-y-6 max-w-2xl">
        {reviews.map((r) => (
          <div key={r.id} className="border-b border-beige/60 pb-6">
            <div className="flex items-center gap-3">
              <span className="font-medium text-text">{r.customerName}</span>
              <Stars rating={r.rating} />
            </div>
            {r.comment && <p className="mt-2 text-sm text-text/70">{r.comment}</p>}
          </div>
        ))}
        {reviews.length === 0 && (
          <p className="text-sm text-text/50">لا توجد تقييمات بعد — كن أول من يقيّم هذا المنتج</p>
        )}
      </div>
    </section>
  );
}
