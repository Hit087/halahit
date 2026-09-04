import { prisma } from "@/lib/prisma";
import { decimalToNumber } from "@/lib/utils";
import { CheckoutPageClient } from "./CheckoutPageClient";

export default async function CheckoutPage() {
  const [fulfillmentMethodsRaw, paymentMethods, settings] = await Promise.all([
    prisma.fulfillmentMethod.findMany({
      where: { active: true },
      orderBy: { sortOrder: "asc" },
    }),
    prisma.paymentMethod.findMany({
      where: { active: true },
      orderBy: { sortOrder: "asc" },
    }),
    prisma.settings.findUnique({ where: { id: "default" } }),
  ]);

  const fulfillmentMethods = fulfillmentMethodsRaw.map((m) => ({
    id: m.id,
    name: m.name,
    type: m.type,
    price: decimalToNumber(m.price),
  }));

  return (
    <div className="mx-auto max-w-lg px-4 py-12 sm:px-6">
      <CheckoutPageClient
        fulfillmentMethods={fulfillmentMethods}
        paymentMethods={paymentMethods}
        vatEnabled={settings?.vatEnabled ?? true}
      />
    </div>
  );
}
