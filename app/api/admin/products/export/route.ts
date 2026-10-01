import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { toCsv, type CsvCell } from "@/lib/csv";
import { buildXlsx } from "@/lib/xlsx";
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

const WIDTHS = [30, 28, 28, 50, 50, 10, 10, 18, 18, 10, 10, 60];

export async function GET(request: Request) {
  const session = await requireAdmin();
  if (!session) {
    return new Response("غير مصرح", { status: 401 });
  }

  const params = new URL(request.url).searchParams;
  const template = params.get("template") === "1";
  const asCsv = params.get("format") === "csv";

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

  const baseName = template
    ? "products-template"
    : `products-${new Date().toISOString().slice(0, 10)}`;

  if (asCsv) {
    return new Response("\uFEFF" + toCsv([HEADERS, ...rows]), {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${baseName}.csv"`,
        "Cache-Control": "no-store",
      },
    });
  }

  const xlsx = buildXlsx([HEADERS, ...rows], WIDTHS);
  return new Response(new Uint8Array(xlsx), {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${baseName}.xlsx"`,
      "Cache-Control": "no-store",
    },
  });
}
