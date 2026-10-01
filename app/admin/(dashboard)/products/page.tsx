import Link from "next/link";
import Image from "next/image";
import { getAllProductsAdmin } from "@/server/queries";
import { decimalToNumber, formatPrice } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ProductToggleButton } from "./ProductToggleButton";
import { DeleteProductButton } from "./DeleteProductButton";

export default async function AdminProductsPage() {
  const products = await getAllProductsAdmin();

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-3xl font-bold">المنتجات</h1>
        <div className="flex gap-2">
          <Link href="/admin/products/bulk">
            <Button variant="outline">استيراد / تصدير</Button>
          </Link>
          <Link href="/admin/products/new">
            <Button variant="accent">إضافة منتج</Button>
          </Link>
        </div>
      </div>

      <div className="mt-8 overflow-x-auto rounded-luxury-lg bg-white shadow-soft">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-beige bg-cream/50">
              <th className="p-4 text-right">الصورة</th>
              <th className="p-4 text-right">الاسم</th>
              <th className="p-4 text-right">التصنيف</th>
              <th className="p-4 text-right">السعر</th>
              <th className="p-4 text-right">الحالة</th>
              <th className="p-4 text-right">إجراءات</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id} className="border-b border-beige/50">
                <td className="p-4">
                  {p.images[0] && (
                    <div className="relative h-12 w-12 rounded-luxury overflow-hidden">
                      <Image src={p.images[0].url} alt="" fill className="object-cover" />
                    </div>
                  )}
                </td>
                <td className="p-4 font-medium">{p.name}</td>
                <td className="p-4">{p.category.name}</td>
                <td className="p-4">
                  {p.price ? formatPrice(decimalToNumber(p.price)) : "—"}
                </td>
                <td className="p-4">
                  <Badge variant={p.active ? "success" : "muted"}>
                    {p.active ? "نشط" : "معطل"}
                  </Badge>
                </td>
                <td className="p-4">
                  <div className="flex gap-2 flex-wrap">
                    <Link href={`/admin/products/${p.id}/edit`}>
                      <Button variant="outline" size="sm">تعديل</Button>
                    </Link>
                    <ProductToggleButton id={p.id} active={p.active} />
                    <DeleteProductButton id={p.id} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {products.length === 0 && (
          <p className="p-8 text-center text-text/50">لا توجد منتجات</p>
        )}
      </div>
    </div>
  );
}
