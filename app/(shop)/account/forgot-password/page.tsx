import Link from "next/link";
import { ForgotPasswordForm } from "./ForgotPasswordForm";

export default function ForgotPasswordPage() {
  return (
    <div className="mx-auto max-w-md px-4 py-16 sm:px-6">
      <h1 className="font-display text-3xl font-bold text-center">نسيت كلمة المرور؟</h1>
      <p className="mt-2 text-center text-sm text-text/60">
        أدخل بريدك الإلكتروني وسنرسل لك رابط إعادة تعيين كلمة المرور
      </p>
      <div className="mt-8">
        <ForgotPasswordForm />
      </div>
      <p className="mt-6 text-center text-sm text-text/60">
        <Link href="/account/login" className="text-accent hover:underline">
          الرجوع لتسجيل الدخول
        </Link>
      </p>
    </div>
  );
}
