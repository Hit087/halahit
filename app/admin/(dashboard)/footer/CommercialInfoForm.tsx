"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { updateCommercialInfo } from "@/server/actions/admin-commercial";

export function CommercialInfoForm({
  commercialRegNumber,
  commercialLicenseNumber,
  commercialRegVisible,
}: {
  commercialRegNumber: string | null;
  commercialLicenseNumber: string | null;
  commercialRegVisible: boolean;
}) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setSaved(false);
    const result = await updateCommercialInfo(new FormData(e.currentTarget));
    setLoading(false);
    if (!result.success) {
      setError(result.error ?? "حدث خطأ");
      return;
    }
    setError("");
    setSaved(true);
    router.refresh();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        name="commercialRegNumber"
        label="رقم السجل التجاري"
        defaultValue={commercialRegNumber ?? ""}
      />
      <Input
        name="commercialLicenseNumber"
        label="رقم الرخصة"
        defaultValue={commercialLicenseNumber ?? ""}
      />

      <label className="flex items-center gap-2 text-sm">
        <input type="hidden" name="commercialRegVisible" value="false" />
        <input
          type="checkbox"
          name="commercialRegVisible"
          value="true"
          defaultChecked={commercialRegVisible}
        />
        إظهار السجل التجاري والرخصة بتذييل الموقع
      </label>

      {error && <p className="text-sm text-red-500">{error}</p>}
      {saved && <p className="text-sm text-green-600">تم الحفظ ✅</p>}

      <Button type="submit" variant="accent" loading={loading}>
        حفظ
      </Button>
    </form>
  );
}
