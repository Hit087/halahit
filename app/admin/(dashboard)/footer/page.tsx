import { prisma } from "@/lib/prisma";
import Image from "next/image";
import { Badge } from "@/components/ui/Badge";
import { FooterItemForm } from "./FooterItemForm";
import { DeleteFooterItemButton } from "./DeleteFooterItemButton";

const sections: { key: string; title: string; hint: string }[] = [
  { key: "SOCIAL", title: "التواصل الاجتماعي", hint: "أيقونات فيسبوك، سناب، انستقرام..." },
  { key: "CONTACT", title: "معلومات التواصل", hint: "واتساب، جوال، إيميل، موقع" },
  { key: "TRUST", title: "شعارات الثقة", hint: "منصة الأعمال، السجل التجاري، الرقم الضريبي" },
  { key: "PAYMENT", title: "طرق الدفع المقبولة", hint: "فيزا، مدى، آبل باي، تابي..." },
  { key: "DELIVERY", title: "تطبيقات التوصيل", hint: "جاهز، هنقرستيشن، ToYou..." },
];

export default async function AdminFooterPage() {
  const items = await prisma.footerItem.findMany({ orderBy: { sortOrder: "asc" } });

  return (
    <div>
      <h1 className="font-display text-3xl font-bold mb-2">الفوتر</h1>
      <p className="mb-8 text-sm text-text/60">
        أضف أي عنصر (صورة + نص + رابط) لكل قسم، ورتّبها كما تحب.
      </p>

      <div className="space-y-12">
        {sections.map((sec) => {
          const sectionItems = items.filter((i) => i.section === sec.key);
          return (
            <div key={sec.key}>
              <h2 className="text-lg font-semibold">{sec.title}</h2>
              <p className="mb-4 text-xs text-text/50">{sec.hint}</p>

              <div className="grid gap-8 lg:grid-cols-2">
                <div>
                  <p className="mb-2 text-sm font-medium">إضافة عنصر جديد</p>
                  <div className="rounded-luxury-lg bg-white p-4 shadow-soft">
                    <FooterItemForm section={sec.key} />
                  </div>
                </div>

                <div className="space-y-3">
                  {sectionItems.map((item) => (
                    <div key={item.id} className="rounded-luxury-lg bg-white p-4 shadow-soft">
                      <div className="flex items-center gap-3">
                        <div className="relative h-10 w-10 flex-shrink-0 rounded overflow-hidden bg-cream">
                          <Image src={item.image} alt="" fill className="object-contain" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium">{item.label || "بدون نص"}</p>
                            <Badge variant={item.active ? "success" : "muted"}>
                              {item.active ? "نشط" : "معطّل"}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <div className="mt-2">
                        <FooterItemForm section={sec.key} item={item} compact />
                        <DeleteFooterItemButton id={item.id} />
                      </div>
                    </div>
                  ))}
                  {sectionItems.length === 0 && (
                    <p className="py-6 text-center text-sm text-text/40">لا توجد عناصر بعد</p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
