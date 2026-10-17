import { redirect } from "next/navigation";
import Link from "next/link";
import { requireCustomer } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui/Card";
import { SignOutButton } from "./SignOutButton";

export default async function AccountPage() {
  const session = await requireCustomer();
  if (!session) redirect("/account/login");

  // الاسم من القاعدة عشان يظهر محدّثًا بعد تعديله
  const user = session.user?.id
    ? await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { name: true, email: true },
      })
    : null;

  return (
    <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
      <h1 className="font-display text-3xl font-bold">حسابي</h1>
      <p className="mt-2 text-text/60">
        أهلاً {user?.name || user?.email || session.user?.name || session.user?.email}
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <Link href="/account/orders">
          <Card className="text-center hover:shadow-soft-lg transition h-full">
            <p className="text-lg font-semibold">طلباتي</p>
            <p className="text-sm text-text/60 mt-1">تتبع طلباتك السابقة</p>
          </Card>
        </Link>
        <Link href="/account/wishlist">
          <Card className="text-center hover:shadow-soft-lg transition h-full">
            <p className="text-lg font-semibold">المفضلة</p>
            <p className="text-sm text-text/60 mt-1">المنتجات المحفوظة</p>
          </Card>
        </Link>
        <Link href="/account/profile">
          <Card className="text-center hover:shadow-soft-lg transition h-full">
            <p className="text-lg font-semibold">بيانات حسابي</p>
            <p className="text-sm text-text/60 mt-1">الاسم والجوال والبريد وكلمة المرور</p>
          </Card>
        </Link>
      </div>

      <div className="mt-8">
        <SignOutButton />
      </div>
    </div>
  );
}
