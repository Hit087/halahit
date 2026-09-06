"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { OrderStatus } from "@prisma/client";
import { sendOrderStatusEmail } from "@/lib/email";

async function guard() {
  const session = await requireAdmin();
  if (!session) throw new Error("غير مصرح");
}

export async function updateOrderStatus(id: string, status: OrderStatus) {
  await guard();

  const order = await prisma.order.update({ where: { id }, data: { status } });

  // ==== إضافة جديدة: إرسال إيميل تحديث الحالة لو العميل زوّدنا بريده ====
  if (order.customerEmail) {
    await sendOrderStatusEmail(order.customerEmail, {
      orderNumber: order.orderNumber,
      status: order.status,
      trackingToken: order.trackingToken,
    });
  }

  revalidatePath("/admin/orders");
  return { success: true };
}

export async function deleteOrder(id: string) {
  await guard();
  await prisma.order.delete({ where: { id } });
  revalidatePath("/admin/orders");
  return { success: true };
}
