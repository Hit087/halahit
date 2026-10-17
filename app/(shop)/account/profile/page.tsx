import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { requireCustomer } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ProfileForms } from "./ProfileForms";

export const metadata: Metadata = {
  title: "بيانات حسابي",
  robots: { index: false, follow: false },
};

export default async function ProfilePage() {
  const session = await requireCustomer();
  if (!session?.user?.id) redirect("/account/login");

  // نقرأ البيانات من القاعدة (مو من الجلسة) عشان تظهر محدّثة بعد أي تعديل
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { name: true, email: true, phone: true, role: true },
  });
  if (!user) redirect("/account/login");

  return (
    <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
      <div className="mb-8 flex items-center justify-between gap-3">
        <h1 className="font-display text-3xl font-bold">بيانات حسابي</h1>
        <Link href="/account" className="text-sm text-accent hover:underline">
          الرجوع لحسابي
        </Link>
      </div>

      <ProfileForms
        name={user.name ?? ""}
        email={user.email}
        phone={user.phone ?? ""}
        isAdmin={user.role === "ADMIN"}
      />
    </div>
  );
}
