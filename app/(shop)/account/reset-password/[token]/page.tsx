import { ResetPasswordForm } from "./ResetPasswordForm";

export default function ResetPasswordPage({
  params,
}: {
  params: { token: string };
}) {
  return (
    <div className="mx-auto max-w-md px-4 py-16 sm:px-6">
      <h1 className="font-display text-3xl font-bold text-center">كلمة مرور جديدة</h1>
      <div className="mt-8">
        <ResetPasswordForm token={params.token} />
      </div>
    </div>
  );
}
