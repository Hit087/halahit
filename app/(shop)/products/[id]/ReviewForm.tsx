"use client";

import { useState } from "react";
import { createReview } from "@/server/actions/reviews";
import { Button } from "@/components/ui/Button";

const StarPath =
  "M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.562.562 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.562.562 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z";

export function ReviewForm({ productId }: { productId: string }) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ error?: string; success?: boolean } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData();
    formData.set("productId", productId);
    formData.set("rating", String(rating));
    formData.set("comment", comment);
    const res = await createReview(formData);
    setLoading(false);
    setResult(res.success ? { success: true } : { error: res.error });
    if (res.success) setComment("");
  };

  if (result?.success) {
    // ==== تعديل: رسالة أبسط، بدون ذكر تفاصيل المراجعة الداخلية ====
    return <p className="text-sm text-primary">شكراً لتقييمك! 🎉</p>;
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-luxury-lg bg-white p-4 shadow-soft space-y-3">
      <div className="flex items-center gap-2">
        <span className="text-sm text-text/70">تقييمك:</span>
        {[1, 2, 3, 4, 5].map((i) => (
          <button key={i} type="button" onClick={() => setRating(i)} aria-label={`${i} نجوم`}>
            <svg
              className={`h-6 w-6 ${i <= rating ? "fill-accent text-accent" : "fill-none text-beige"}`}
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d={StarPath} />
            </svg>
          </button>
        ))}
      </div>
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="اكتب رأيك بالمنتج (اختياري)"
        rows={3}
        className="w-full rounded-luxury border border-beige px-4 py-2.5 text-sm"
      />
      {result?.error && <p className="text-red-500 text-xs">{result.error}</p>}
      <Button type="submit" variant="accent" size="sm" loading={loading}>
        إرسال التقييم
      </Button>
    </form>
  );
}
