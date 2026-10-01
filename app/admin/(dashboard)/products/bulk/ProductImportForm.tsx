"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { importProductsCsv } from "@/server/actions/product-import";

type Result = Awaited<ReturnType<typeof importProductsCsv>>;

export function ProductImportForm() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [pending, setPending] = useState(false);
  const [result, setResult] = useState<Result | null>(null);

  async function handleImport() {
    if (!file || pending) return;
    setPending(true);
    setResult(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await importProductsCsv(fd);
      setResult(res);
      if (res.success) {
        setFile(null);
        if (inputRef.current) inputRef.current.value = "";
        router.refresh();
      }
    } catch {
      setResult({
        success: false,
        created: 0,
        updated: 0,
        withoutImage: 0,
        errors: ["صار خطأ غير متوقع، حاول مرة ثانية"],
      });
    } finally {
      setPending(false);
    }
  }

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept=".csv,text/csv,text/plain"
        onChange={(e) => {
          setFile(e.target.files?.[0] ?? null);
          setResult(null);
        }}
        className="block w-full text-sm file:ml-3 file:rounded-luxury file:border-0 file:bg-cream file:px-4 file:py-2 file:text-sm file:font-medium file:text-text hover:file:bg-beige/60"
      />

      <button
        type="button"
        onClick={handleImport}
        disabled={!file || pending}
        className="mt-4 rounded-luxury bg-accent px-6 py-2.5 text-sm font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {pending ? "جاري الاستيراد..." : "استيراد الملف"}
      </button>

      {result && result.success && (
        <div className="mt-5 rounded-luxury bg-cream p-4 text-sm">
          <p className="font-bold text-accent">تم الاستيراد بنجاح ✅</p>
          <p className="mt-1">
            منتجات جديدة: {result.created} — منتجات محدّثة: {result.updated}
          </p>
          {result.withoutImage > 0 && (
            <p className="mt-2 text-text/70">
              {result.withoutImage} من المنتجات الجديدة بدون صور، انحفظت معطّلة. أضف لها
              صورة من صفحة تعديل المنتج وفعّلها.
            </p>
          )}
        </div>
      )}

      {result && !result.success && (
        <div className="mt-5 rounded-luxury border border-line bg-white p-4 text-sm">
          <p className="font-bold">ما انحفظ شي. صحّح هالأخطاء وارفع الملف مرة ثانية:</p>
          <ul className="mt-2 list-disc space-y-1 pr-5 text-text/80">
            {result.errors.map((e, i) => (
              <li key={i}>{e}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
