import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { toCsv, type CsvCell } from "@/lib/csv";
import { decimalToNumber } from "@/lib/utils";

export const dynamic = "force-dynamic";

const HEADERS = [
  "id",
  "name",
  "name_en",
  "description",
  "description_en",
  "price",
  "stock",
  "category_slug",
  "category",
  "active",
  "featured",
  "images",
];

export async function GET(request: Request) {
  const session = await requireAdmin();
  if (!session) {
    return new Response("غير مصرح", { status: 401 });
  }

  const template = new URL(request.url).searchParams.get("template") === "1";
  let rows: CsvCell[][];

  if (template) {
    const firstCategory = await prisma.category.findFirst({
      orderBy: { sortOrder: "asc" },
    });
    rows = [
      [
        "",
        "اسم المنتج",
        "Product name",
        "وصف المنتج",
        "Product description",
        25,
        10,
        firstCategory?.slug ?? "",
        firstCategory?.name ?? "",
        "true",
        "false",
        "",
      ],
    ];
  } else {
    const products = await prisma.product.findMany({
      orderBy: { createdAt: "asc" },
      include: {
        category: true,
        images: { orderBy: { sortOrder: "asc" } },
      },
    });
    rows = products.map((p) => [
      p.id,
      p.name,
      p.nameEn,
      p.description,
      p.descriptionEn ?? "",
      p.price ? decimalToNumber(p.price) : "",
      p.stock ?? "",
      p.category.slug,
      p.category.name,
      p.active ? "true" : "false",
      p.featured ? "true" : "false",
      p.images.map((i) => i.url).join(" | "),
    ]);
  }

  const body = "\uFEFF" + toCsv([HEADERS, ...rows]);
  const filename = template
    ? "products-template.csv"
    : `products-${new Date().toISOString().slice(0, 10)}.csv`;

  return new Response(body, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
