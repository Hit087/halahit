"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { productSchema } from "@/lib/validations";
import { saveUploadedFiles } from "@/server/upload";

async function guard() {
  const session = await requireAdmin();
  if (!session) throw new Error("غير مصرح");
  return session;
}

export async function createProduct(formData: FormData) {
  await guard();

  const raw = {
    name: formData.get("name"),
    nameEn: formData.get("nameEn"),
    description: formData.get("description"),
    descriptionEn: formData.get("descriptionEn") || undefined,
    price: formData.get("price") ? parseFloat(formData.get("price") as string) : undefined,
    stock: formData.get("stock"),
    categoryId: formData.get("categoryId"),
    active: formData.getAll("active").includes("true"),
    featured: formData.getAll("featured").includes("true"),
  };

  const parsed = productSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: "بيانات المنتج غير صالحة" };
  }

  const files = formData.getAll("images").filter((f): f is File => f instanceof File && f.size > 0);
  let imageUrls: string[] = [];

  if (files.length > 0) {
    imageUrls = await saveUploadedFiles(files);
  } else {
    const existingUrls = formData.get("existingImages");
    if (typeof existingUrls === "string" && existingUrls) {
      imageUrls = existingUrls.split(",").filter(Boolean);
    }
  }

  if (imageUrls.length === 0) {
    return { success: false, error: "يجب إضافة صورة واحدة على الأقل" };
  }

  await prisma.product.create({
    data: {
      id: Math.random().toString(36).slice(2) + Date.now().toString(36),
      ...parsed.data,
      images: {
        create: imageUrls.map((url, i) => ({ url, sortOrder: i })),
      },
    },
  });

  revalidatePath("/");
  revalidatePath("/products");
  revalidatePath("/admin/products");
  return { success: true };
}

export async function updateProduct(id: string, formData: FormData) {
  await guard();

  const raw = {
    name: formData.get("name"),
    nameEn: formData.get("nameEn"),
    description: formData.get("description"),
    descriptionEn: formData.get("descriptionEn") || undefined,
    price: formData.get("price") ? parseFloat(formData.get("price") as string) : undefined,
    stock: formData.get("stock"),
    categoryId: formData.get("categoryId"),
    active: formData.getAll("active").includes("true"),
    featured: formData.getAll("featured").includes("true"),
  };

  const parsed = productSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: "بيانات المنتج غير صالحة" };
  }

  const keepUrls =
    (formData.get("keepImages") as string)?.split(",").filter(Boolean) ?? [];

  const files = formData.getAll("images").filter((f): f is File => f instanceof File && f.size > 0);
  const newUrls = files.length > 0 ? await saveUploadedFiles(files) : [];
  const allUrls = [...keepUrls, ...newUrls];

  if (allUrls.length === 0) {
    return { success: false, error: "يجب إضافة صورة واحدة على الأقل" };
  }

  await prisma.$transaction([
    prisma.productImage.deleteMany({ where: { productId: id } }),
    prisma.product.update({
      where: { id },
      data: {
        ...parsed.data,
        images: {
          create: allUrls.map((url, i) => ({ url, sortOrder: i })),
        },
      },
    }),
  ]);

  revalidatePath("/");
  revalidatePath("/products");
  revalidatePath(`/products/${id}`);
  revalidatePath("/admin/products");
  return { success: true };
}

export async function deleteProduct(id: string) {
  await guard();
  await prisma.product.delete({ where: { id } });
  revalidatePath("/");
  revalidatePath("/products");
  revalidatePath("/admin/products");
  return { success: true };
}

export async function toggleProductActive(id: string, active: boolean) {
  await guard();
  await prisma.product.update({ where: { id }, data: { active } });
  revalidatePath("/admin/products");
  return { success: true };
}
