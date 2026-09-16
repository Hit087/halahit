"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { approveReview, unapproveReview, deleteReview } from "@/server/actions/admin-reviews";

export function ReviewActions({ id, approved }: { id: string; approved: boolean }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleToggle = async () => {
    setLoading(true);
    if (approved) {
      await unapproveReview(id);
    } else {
      await approveReview(id);
    }
    setLoading(false);
    router.refresh();
  };

  const handleDelete = async () => {
    if (!confirm("حذف التقييم نهائيًا؟")) return;
    setLoading(true);
    await deleteReview(id);
    setLoading(false);
    router.refresh();
  };

  return (
    <div className="mt-3 flex gap-2">
      <button
        type="button"
        disabled={loading}
        onClick={handleToggle}
        className={`rounded-full px-4 py-1.5 text-xs font-semibold text-white transition ${
          approved ? "bg-text/60 hover:bg-text/80" : "bg-accent hover:bg-accent-dark"
        }`}
      >
        {approved ? "إخفاء من الموقع" : "نشر"}
      </button>
      <button
        type="button"
        disabled={loading}
        onClick={handleDelete}
        className="rounded-full border border-red-300 px-4 py-1.5 text-xs font-semibold text-red-500 transition hover:bg-red-50"
      >
        حذف
      </button>
    </div>
  );
}
