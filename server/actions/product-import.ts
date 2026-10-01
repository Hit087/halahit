"use server";

import { revalidatePath } from "next/cache";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { productSchema } from "@/lib/validations";
import { parseCsv } from "@/lib/csv";
import { parseXlsx } from "@/lib/xlsx";

const MAX_ROWS = 200;
const MAX_BYTES = 2_000_000;

async function guard() {
  const session = await requireAdmin();
  if (!session) throw new Error("غير مصرح");
  return session;
}

function normalizeDigits(value: string): string {
  return value
    .replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)))
    .replace(/٫/g, ".")
    .replace(/\s/g, "");
}

// true / false / undefined (فاضي) / "invalid"
function parseBool(value: string): boolean | undefined | "invalid" {
  const v = value.trim().toLowerCase();
  if (v === "") return undefined;
  if (["true", "1", "yes", "y", "نعم", "نشط", "فعال", "مفعل"].includes(v)) return true;
  if (["false", "0", "no", "n", "لا", "معطل", "موقوف"].includes(v)) return false;
  return "invalid";
}

// يكشف الملف اللي انقرأ بترميز غلط (العربي يطلع رموز مثل Ø§Ù)
function looksGarbled(text: string): boolean {
  return text.startsWith("ï»¿") || /(?:Ø|Ù)[\u0080-\u00BF]/.test(text);
}

function cleanHeader(h: string): string {
  return h
    .replace(/^\uFEFF/, "")
    .replace(/^ï»¿/, "")
    .trim()
    .toLowerCase();
}

type Result = {
  success: boolean;
  created: number;
  updated: number;
  withoutImage: number;
  errors: string[];
};

function fail(errors: string[]): Result {
  return { success: false, created: 0, updated: 0, withoutImage: 0, errors };
}

// الاستيراد "كله أو ولا شي": إذا فيه أي سطر فيه خطأ ما ينحفظ شي،
// عشان لما تصلح الملف وترفعه مرة ثانية ما تتكرر المنتجات الجديدة.
export async function importProductsCsv(formData: FormData): Promise<Result> {
  await guard();

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return fail(["لم يتم اختيار ملف"]);
  }
  if (file.size > MAX_BYTES) {
    return fail(["حجم الملف كبير (الحد الأقصى 2 ميجابايت)"]);
  }

  const fileName = file.name.toLowerCase();
  if (fileName.endsWith(".xls")) {
    return fail(["صيغة xls القديمة غير مدعومة. احفظ الملف بصيغة xlsx أو CSV وارفعه."]);
  }

  const buf = Buffer.from(await file.arrayBuffer());
  const isXlsx =
    fileName.endsWith(".xlsx") || (buf.length > 3 && buf[0] === 0x50 && buf[1] === 0x4b);

  let rows: string[][];
  if (isXlsx) {
    try {
      rows = parseXlsx(buf);
    } catch {
      return fail([
        "تعذّر قراءة ملف Excel. تأكد إنه ملف xlsx سليم، أو احفظه من جديد وارفعه.",
      ]);
    }
  } else {
    const text = buf.toString("utf8");
    if (looksGarbled(text)) {
      return fail([
        "الملف انحفظ بترميز غلط والعربي فيه تخرّب، فما انحفظ شي. استخدم ملف xlsx (الأفضل)، أو احفظ الـCSV بصيغة UTF-8.",
      ]);
    }
    rows = parseCsv(text);
  }

  if (rows.length < 2) {
    return fail(["الملف فاضي أو ما فيه صفوف بيانات"]);
  }

  const headers = rows[0].map(cleanHeader);
  const col = (name: string) => headers.indexOf(name);
  const cell = (cells: string[], name: string) => {
    const i = col(name);
    return i === -1 ? "" : (cells[i] ?? "").trim();
  };

  // عمود id لازم يكون موجود (حتى لو فاضي للمنتجات الجديدة)،
  // لأن غيابه معناه كل الصفوف تنضاف كمنتجات جديدة ويتكرر كل شي
  if (col("id") === -1) {
    return fail([
      "عمود id مفقود من الملف. لا تحذفه حتى للمنتجات الجديدة، اتركه فاضي بس. نزّل الملف من جديد وعدّل عليه.",
    ]);
  }

  const missing = ["name", "name_en", "description"].filter((h) => col(h) === -1);
  if (col("category_slug") === -1 && col("category") === -1) {
    missing.push("category_slug");
  }
  if (missing.length > 0) {
    return fail([`أعمدة ناقصة بالملف: ${missing.join(", ")}`]);
  }

  const dataRows = rows
    .slice(1)
    .map((cells, i) => ({ cells, line: i + 2 }))
    .filter((r) => r.cells.some((c) => c.trim() !== ""));

  if (dataRows.length === 0) {
    return fail(["ما فيه صفوف بيانات بالملف"]);
  }
  if (dataRows.length > MAX_ROWS) {
    return fail([
      `عدد الصفوف (${dataRows.length}) أكثر من الحد المسموح (${MAX_ROWS}). قسّم الملف لأكثر من ملف.`,
    ]);
  }

  const categories = await prisma.category.findMany({
    select: { id: true, slug: true, name: true },
  });
  const bySlug = new Map(categories.map((c) => [c.slug.toLowerCase(), c.id]));
  const byName = new Map(categories.map((c) => [c.name.trim().toLowerCase(), c.id]));

  const ids = dataRows.map((r) => cell(r.cells, "id")).filter(Boolean);
  const existing =
    ids.length > 0
      ? await prisma.product.findMany({
          where: { id: { in: ids } },
          select: { id: true, active: true, featured: true },
        })
      : [];
  const existingMap = new Map(existing.map((p) => [p.id, p]));

  const errors: string[] = [];
  const ops: Prisma.PrismaPromise<unknown>[] = [];
  const seenIds = new Set<string>();
  let created = 0;
  let updated = 0;
  let withoutImage = 0;

  for (const { cells, line } of dataRows) {
    const label = `سطر ${line}`;
    const id = cell(cells, "id");

    if (id) {
      if (seenIds.has(id)) {
        errors.push(`${label}: المعرّف مكرر بالملف`);
        continue;
      }
      seenIds.add(id);
      if (!existingMap.has(id)) {
        errors.push(`${label}: المعرّف غير موجود بالمتجر`);
        continue;
      }
    }

    const slug = cell(cells, "category_slug");
    const catName = cell(cells, "category");
    const categoryId = slug
      ? bySlug.get(slug.toLowerCase())
      : catName
      ? byName.get(catName.toLowerCase())
      : undefined;
    if (!categoryId) {
      errors.push(`${label}: التصنيف غير موجود (${slug || catName || "فاضي"})`);
      continue;
    }

    const priceRaw = normalizeDigits(cell(cells, "price"));
    const price = priceRaw === "" ? undefined : Number(priceRaw);
    if (price !== undefined && (!Number.isFinite(price) || price < 0)) {
      errors.push(`${label}: السعر غير صالح`);
      continue;
    }

    const activeParsed = parseBool(cell(cells, "active"));
    const featuredParsed = parseBool(cell(cells, "featured"));
    if (activeParsed === "invalid" || featuredParsed === "invalid") {
      errors.push(`${label}: قيمة active أو featured لازم تكون true أو false`);
      continue;
    }

    const prev = id ? existingMap.get(id) : undefined;
    const active = activeParsed ?? prev?.active ?? true;
    const featured = featuredParsed ?? prev?.featured ?? false;

    // نفس شكل البيانات اللي يرسلها نموذج إضافة المنتج
    const raw = {
      name: cell(cells, "name"),
      nameEn: cell(cells, "name_en"),
      description: cell(cells, "description"),
      descriptionEn: cell(cells, "description_en") || undefined,
      price,
      stock: normalizeDigits(cell(cells, "stock")),
      categoryId,
      active,
      featured,
    };

    const parsed = productSchema.safeParse(raw);
    if (!parsed.success) {
      const fields = Array.from(
        new Set(parsed.error.issues.map((i) => i.path.join(".")).filter(Boolean))
      );
      errors.push(
        `${label}: بيانات غير صالحة${fields.length ? ` (${fields.join(", ")})` : ""}`
      );
      continue;
    }

    if (id) {
      // التحديث ما يلمس الصور
      ops.push(prisma.product.update({ where: { id }, data: parsed.data }));
      updated++;
    } else {
      const images = cell(cells, "images")
        .split(/[|\s]+/)
        .map((u) => u.trim())
        .filter((u) => u.startsWith("/") || /^https?:\/\//i.test(u));

      ops.push(
        prisma.product.create({
          data: {
            ...parsed.data,
            // المنتج الجديد بدون صورة ينحفظ معطّل عشان ما يظهر بالمتجر بدون صورة
            ...(images.length === 0 ? { active: false } : {}),
            images:
              images.length > 0
                ? { create: images.map((url, i) => ({ url, sortOrder: i })) }
                : undefined,
          },
        })
      );
      created++;
      if (images.length === 0) withoutImage++;
    }
  }

  if (errors.length > 0) {
    const shown = errors.slice(0, 50);
    if (errors.length > shown.length) {
      shown.push(`... و${errors.length - shown.length} أخطاء ثانية`);
    }
    return fail(shown);
  }

  try {
    await prisma.$transaction(ops);
  } catch {
    return fail(["صار خطأ أثناء الحفظ ولا شي انحفظ. حاول مرة ثانية."]);
  }

  revalidatePath("/");
  revalidatePath("/products");
  revalidatePath("/admin/products");

  return { success: true, created, updated, withoutImage, errors: [] };
}
