import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/Badge";
import { PaymentMethodForm } from "./PaymentMethodForm";
import { DeletePaymentMethodButton } from "./DeletePaymentMethodButton";

const typeLabels: Record<string, string> = {
  CASH: "الدفع عند الاستلام (واتساب)",
  GATEWAY: "بوابة دفع إلكتروني",
};

export default async function AdminPaymentMethodsPage() {
  const methods = await prisma.paymentMethod.findMany({
    orderBy: { sortOrder: "asc" },
  });

  return (
    <div>
      <h1 className="font-display text-3xl font-bold mb-8">طرق الدفع</h1>

      <div className="grid gap-8 lg:grid-cols-2">
        <div>
          <h2 className="text-lg font-semibold mb-4">إضافة طريقة جديدة</h2>
          <PaymentMethodForm />
        </div>

        <div className="space-y-4">
          <h2 className="text-lg font-semibold">الطرق الحالية</h2>
          {methods.map((method) => (
            <div
              key={method.id}
              className="rounded-luxury-lg bg-white p-4 shadow-soft"
            >
              <div className="flex items-center gap-2">
                <p className="font-medium">{method.name}</p>
                <Badge variant={method.active ? "success" : "muted"}>
                  {method.active ? "نشط" : "معطّل"}
                </Badge>
              </div>
              <p className="text-sm text-text/60">{typeLabels[method.type]}</p>
              <PaymentMethodForm method={method} compact />
              <DeletePaymentMethodButton id={method.id} />
            </div>
          ))}
          {methods.length === 0 && (
            <p className="text-center text-text/50 py-12">لا توجد طرق مضافة بعد</p>
          )}
        </div>
      </div>
    </div>
  );
}
