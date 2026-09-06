import Link from "next/link";
import { LoginForm } from "./LoginForm";

export default function AccountLoginPage() {
  return (
    <div className="mx-auto max-w-md px-4 py-16 sm:px-6">
      <h1 className="font-display text-3xl font-bold text-center">تسجيل الدخول</h1>
      <div className="mt-8">
        <LoginForm />
      </div>
      <p className="mt-6 text-center text-sm text-text/60">
        ما عندك حساب؟{" "}
        <Link href="/account/register" className="text-accent hover:underline">
          إنشاء حساب جديد
        </Link>
      </p>
    </div>
  );
}
