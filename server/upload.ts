import { randomUUID } from "crypto";
import { createClient } from "@supabase/supabase-js";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_SIZE = 20 * 1024 * 1024;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

export async function saveUploadedFile(file: File): Promise<string> {
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new Error("نوع الملف غير مدعوم. استخدم JPG أو PNG أو WebP");
  }

  if (file.size > MAX_SIZE) {
    throw new Error("حجم الملف يتجاوز 20 ميجابايت");
  }

  const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
  const safeExt = ["jpg", "jpeg", "png", "webp", "gif"].includes(ext)
    ? ext
    : "jpg";
  const filename = `${randomUUID()}.${safeExt}`;

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  const { error } = await supabase.storage
    .from("products")
    .upload(filename, buffer, { contentType: file.type });

  if (error) throw new Error(error.message);

  const { data } = supabase.storage
    .from("products")
    .getPublicUrl(filename);

  return data.publicUrl;
}

export async function saveUploadedFiles(files: File[]): Promise<string[]> {
  return Promise.all(files.map((f) => saveUploadedFile(f)));
}
