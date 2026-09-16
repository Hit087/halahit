"use client";

import { useRouter } from "next/navigation";
import { approveReview, deleteReview } from "@/server/actions/admin-reviews";

export function ReviewActions({ id, approved }: { id: string; approved: boolean }) {
  const router = useRouter();

  return (
    <div className="mt-3 flex gap-4 text-xs">
      {!approved && (
        <button
          type="button"
          onClick={async () => {
            await approveReview(id);
            router.refresh();
          }}
          className="text-primary hover:underline"
        >
          نشر
        </button>
      )}
      <button
        type="button"
        onClick={async () => {
          if (!confirm("حذف التقييم؟")) return;
          await deleteReview(id);
          router.refresh();
        }}
        className="text-red-500 hover:underline"
      >
        حذف
      </button>
    </div>
  );
}
