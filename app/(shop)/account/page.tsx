import { redirect } from "next/navigation";
import Link from "next/link";
import { requireCustomer } from "@/lib/auth";
import { Card } from "@/components/ui/Card";
import { SignOutButton } from "./SignOutButton";

export default async function AccountPage() {
  const session = await requireCustomer();
  if (!session) redirect("/account/login");

  return (
    <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
      <h1 className="font-display text-3xl font-bold">حسابي</h1>
      <p className="mt-2 text-text/60">أهلاً {session.user?.name || session.user?.email}</p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <Link href="/account/orders">
          <Card className="text-center hover:shadow-soft-lg transition">
            <p className="text-lg font-semibold">طلباتي</p>
            <p className="text-sm text-text/60 mt-1">تتبع طلباتك السابقة</p>
          </Card>
        </Link>
        <Link href="/account/wishlist">
          <Card className="text-center hover:shadow-soft-lg transition">
            <p className="text-lg font-semibold">المفضلة</p>
            <p className="text-sm text-text/60 mt-1">المنتجات المحفوظة</p>
          </Card>
        </Link>
      </div>

      <div className="mt-8">
        <SignOutButton />
      </div>
    </div>
  );
}
