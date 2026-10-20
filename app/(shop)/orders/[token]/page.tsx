import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

// الروابط القديمة بالإيميلات كانت /orders/<رمز>، والصفحة الفعلية /account/orders/<رمز>
export default function LegacyOrderLinkPage({
  params,
}: {
  params: { token: string };
}) {
  redirect(`/account/orders/${encodeURIComponent(params.token)}`);
}
