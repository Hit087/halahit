import Link from "next/link";
import { RegisterForm } from "./RegisterForm";

export default function AccountRegisterPage() {
  return (
    <div className="mx-auto max-w-md px-4 py-16 sm:px-6">
      <h1 className="font-display text-3xl font-bold text-center">إنشاء حساب</h1>
      <div className="mt-8">
        <RegisterForm />
      </div>
      <p className="mt-6 text-center text-sm text-text/60">
        عندك حساب بالفعل؟{" "}
        <Link href="/account/login" className="text-accent hover:underline">
          تسجيل الدخول
        </Link>
      </p>
    </div>
  );
}
