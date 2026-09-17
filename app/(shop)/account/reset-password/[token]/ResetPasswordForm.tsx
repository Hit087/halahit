"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { resetPassword } from "@/server/actions/customer-auth";

export function ResetPasswordForm({ token }: { token: string }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    formData.set("token", token);
    const result = await resetPassword(formData);
    setLoading(false);

    if (!result.success) {
      setError(result.error ?? "حدث خطأ");
      return;
    }
    setDone(true);
    setTimeout(() => router.push("/account/login"), 2000);
  };

  if (done) {
    return (
      <Card>
        <p className="text-sm text-primary">
          تم تحديث كلمة المرور بنجاح! جارٍ تحويلك لصفحة تسجيل الدخول...
        </p>
      </Card>
    );
  }

  return (
    <Card>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input name="password" type="password" label="كلمة المرور الجديدة" required />
        <Input name="confirmPassword" type="password" label="تأكيد كلمة المرور" required />
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <Button type="submit" variant="accent" className="w-full" loading={loading}>
          حفظ كلمة المرور الجديدة
        </Button>
      </form>
    </Card>
  );
}
