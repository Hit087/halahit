"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { registerCustomer } from "@/server/actions/customer-auth";

export function RegisterForm() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const result = await registerCustomer(formData);

    if (!result.success) {
      setLoading(false);
      setError(result.error ?? "حدث خطأ");
      return;
    }

    await signIn("credentials", {
      email: formData.get("email"),
      password: formData.get("password"),
      redirect: false,
    });

    setLoading(false);
    router.push("/account");
    router.refresh();
  };

  return (
    <Card>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input name="name" label="الاسم الكامل" required />
        <Input name="email" type="email" label="البريد الإلكتروني" required />
        <Input name="password" type="password" label="كلمة المرور" required />
        <Input name="confirmPassword" type="password" label="تأكيد كلمة المرور" required />
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <Button type="submit" variant="accent" className="w-full" loading={loading}>
          إنشاء الحساب
        </Button>
      </form>
    </Card>
  );
}
