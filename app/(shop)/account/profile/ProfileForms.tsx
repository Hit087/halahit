"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import {
  updateProfile,
  changeEmail,
  changePassword,
  deleteAccount,
  signOutEverywhere,
} from "@/server/actions/account";

type ActionResult = { success: boolean; error?: string };

// منطق مشترك لكل نموذج: حالة التحميل والخطأ والنجاح
function useFormAction(
  action: (fd: FormData) => Promise<ActionResult>,
  options?: { resetOnSuccess?: boolean; onSuccess?: () => void | Promise<void> }
) {
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    setLoading(true);
    setError("");
    setDone(false);
    try {
      const res = await action(new FormData(form));
      if (!res.success) {
        setError(res.error ?? "حدث خطأ");
      } else {
        setDone(true);
        if (options?.resetOnSuccess) form.reset();
        await options?.onSuccess?.();
      }
    } catch {
      setError("حدث خطأ غير متوقع، حاول مرة ثانية");
    } finally {
      setLoading(false);
    }
  }

  return { submit, error, done, loading };
}

function Status({ error, done, doneText }: { error: string; done: boolean; doneText: string }) {
  if (error) return <p className="text-sm text-red-500">{error}</p>;
  if (done) return <p className="text-sm text-green-600">{doneText}</p>;
  return null;
}

export function ProfileForms({
  name,
  email,
  phone,
  isAdmin,
}: {
  name: string;
  email: string;
  phone: string;
  isAdmin: boolean;
}) {
  const profile = useFormAction(updateProfile);

  const emailForm = useFormAction(changeEmail, {
    resetOnSuccess: true,
    // بعد تغيير البريد نطلّعه ليسجّل دخول من جديد بالبريد الجديد
    onSuccess: () => signOut({ callbackUrl: "/account/login" }),
  });

  const passwordForm = useFormAction(changePassword, {
    resetOnSuccess: true,
    // تغيير كلمة المرور يبطل كل الجلسات القديمة، فنطلّعه ليسجّل دخول بكلمته الجديدة
    onSuccess: () => signOut({ callbackUrl: "/account/login" }),
  });

  const allDevices = useFormAction(async () => signOutEverywhere(), {
    onSuccess: () => signOut({ callbackUrl: "/account/login" }),
  });

  const deleteForm = useFormAction(deleteAccount, {
    onSuccess: () => signOut({ callbackUrl: "/" }),
  });

  return (
    <div className="space-y-6">
      {/* ==== البيانات الشخصية ==== */}
      <Card>
        <h2 className="mb-4 text-lg font-semibold">البيانات الشخصية</h2>
        <form onSubmit={profile.submit} className="space-y-4">
          <Input name="name" label="الاسم" defaultValue={name} required />
          <Input
            name="phone"
            label="رقم الجوال"
            type="tel"
            defaultValue={phone}
            placeholder="05xxxxxxxx"
            autoComplete="tel"
          />
          <Status error={profile.error} done={profile.done} doneText="تم حفظ بياناتك ✅" />
          <Button type="submit" variant="accent" loading={profile.loading}>
            حفظ
          </Button>
        </form>
      </Card>

      {isAdmin ? (
        <Card>
          <p className="text-sm text-text/70">
            هذا حساب الأدمن. البريد وكلمة المرور تُدار من صفحة الإعدادات بلوحة التحكم.
          </p>
        </Card>
      ) : (
        <>
          {/* ==== البريد الإلكتروني ==== */}
          <Card>
            <h2 className="mb-1 text-lg font-semibold">البريد الإلكتروني</h2>
            <p className="mb-4 text-sm text-text/60">
              بريدك الحالي: <span className="font-medium">{email}</span>. بعد التغيير راح تسجّل
              دخول من جديد بالبريد الجديد.
            </p>
            <form onSubmit={emailForm.submit} className="space-y-4">
              <Input name="newEmail" label="البريد الجديد" type="email" required autoComplete="email" />
              <Input
                name="confirmEmail"
                label="تأكيد البريد الجديد"
                type="email"
                required
                autoComplete="email"
              />
              <Input
                name="currentPassword"
                label="كلمة المرور الحالية"
                type="password"
                required
                autoComplete="current-password"
              />
              <Status error={emailForm.error} done={emailForm.done} doneText="تم تغيير البريد ✅" />
              <Button type="submit" variant="accent" loading={emailForm.loading}>
                تغيير البريد
              </Button>
            </form>
          </Card>

          {/* ==== كلمة المرور ==== */}
          <Card>
            <h2 className="mb-1 text-lg font-semibold">تغيير كلمة المرور</h2>
            <p className="mb-4 text-sm text-text/60">
              بعد التغيير يتم تسجيل خروجك من كل الأجهزة، وتدخل من جديد بكلمة المرور الجديدة.
            </p>
            <form onSubmit={passwordForm.submit} className="space-y-4">
              <Input
                name="currentPassword"
                label="كلمة المرور الحالية"
                type="password"
                required
                autoComplete="current-password"
              />
              <Input
                name="newPassword"
                label="كلمة المرور الجديدة (8 أحرف على الأقل)"
                type="password"
                required
                autoComplete="new-password"
              />
              <Input
                name="confirmPassword"
                label="تأكيد كلمة المرور الجديدة"
                type="password"
                required
                autoComplete="new-password"
              />
              <Status
                error={passwordForm.error}
                done={passwordForm.done}
                doneText="تم تغيير كلمة المرور ✅"
              />
              <Button type="submit" variant="accent" loading={passwordForm.loading}>
                تغيير كلمة المرور
              </Button>
            </form>
          </Card>

          {/* ==== الخروج من كل الأجهزة ==== */}
          <Card>
            <h2 className="mb-1 text-lg font-semibold">الأجهزة المسجّل دخولك منها</h2>
            <p className="mb-4 text-sm text-text/60">
              إذا حسيت إن أحد دخل حسابك، أو نسيت حسابك مفتوح بجهاز ثاني، سجّل الخروج من كل
              الأجهزة (بما فيها هذا الجهاز).
            </p>
            <form onSubmit={allDevices.submit} className="space-y-4">
              <Status error={allDevices.error} done={allDevices.done} doneText="تم تسجيل الخروج من كل الأجهزة" />
              <Button type="submit" variant="accent" loading={allDevices.loading}>
                تسجيل الخروج من كل الأجهزة
              </Button>
            </form>
          </Card>

          {/* ==== حذف الحساب ==== */}
          <Card className="border border-red-200">
            <h2 className="mb-1 text-lg font-semibold text-red-600">حذف الحساب</h2>
            <p className="mb-4 text-sm text-text/70">
              حذف الحساب نهائي ولا يمكن التراجع عنه. تنحذف بياناتك الشخصية والمفضلة والتقييمات.
              طلباتك السابقة تبقى بسجلات المتجر بدون ربطها بحسابك.
            </p>
            <form onSubmit={deleteForm.submit} className="space-y-4">
              <Input
                name="currentPassword"
                label="كلمة المرور"
                type="password"
                required
                autoComplete="current-password"
              />
              <Input name="confirmation" label='اكتب كلمة "حذف" للتأكيد' required autoComplete="off" />
              <Status error={deleteForm.error} done={deleteForm.done} doneText="تم حذف حسابك" />
              <button
                type="submit"
                disabled={deleteForm.loading}
                className="rounded-luxury bg-red-600 px-6 py-2.5 text-sm font-medium text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {deleteForm.loading ? "جاري الحذف..." : "حذف حسابي نهائيًا"}
              </button>
            </form>
          </Card>
        </>
      )}
    </div>
  );
}
