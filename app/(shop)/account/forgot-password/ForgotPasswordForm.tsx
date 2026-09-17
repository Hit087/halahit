"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { requestPasswordReset } from "@/server/actions/customer-auth";

export function ForgotPasswordForm() {
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    await requestPasswordReset(new FormData(e.currentTarget));
    setLoading(false);
    setSent(true);
  };

  if (sent) {
    return (
      <Card>
        <p className="text-sm text-primary">
          إذا كان بريدك مسجّلاً لدينا، بيوصلك رابط إعادة تعيين كلمة المرور خلال دقائق. تفقّد صندوق الوارد ومجلد الرسائل غير المرغوبة (Spam).
        </p>
      </Card>
    );
  }

  return (
    <Card>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input name="email" type="email" label="البريد الإلكتروني" required />
        <Button type="submit" variant="accent" className="w-full" loading={loading}>
          إرسال رابط الاسترجاع
        </Button>
      </form>
    </Card>
  );
}
