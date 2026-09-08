"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { sendNewsletterCampaign } from "@/server/actions/newsletter";

export function NewsletterCampaignForm() {
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ error?: string; sentCount?: number } | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!confirm("إرسال هذه الرسالة لكل المشتركين بالنشرة؟")) return;

    setLoading(true);
    setResult(null);
    const res = await sendNewsletterCampaign(subject, message);
    setLoading(false);

    if (!res.success) {
      setResult({ error: res.error });
      return;
    }

    setResult({ sentCount: res.sentCount });
    setSubject("");
    setMessage("");
  };

  return (
    <Card className="max-w-xl">
      <h2 className="font-semibold text-lg mb-4">إرسال رسالة جديدة للمشتركين</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          name="subject"
          label="عنوان الرسالة"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          required
        />
        <div>
          <label className="mb-1.5 block text-sm font-medium">نص الرسالة</label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            required
            rows={6}
            className="w-full rounded-luxury border border-beige px-4 py-3"
          />
        </div>

        {result?.error && <p className="text-red-500 text-sm">{result.error}</p>}
        {result?.sentCount !== undefined && (
          <p className="text-green-600 text-sm">
            تم الإرسال بنجاح لـ {result.sentCount} مشترك 🎉
          </p>
        )}

        <Button type="submit" variant="accent" loading={loading}>
          إرسال للجميع
        </Button>
      </form>
    </Card>
  );
}
