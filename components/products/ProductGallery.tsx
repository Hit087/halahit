"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";

const ZOOM_SCALE = 2.5;

export function ProductGallery({ images }: { images: { url: string }[] }) {
  const [active, setActive] = useState(0);
  const [open, setOpen] = useState(false);
  const [zoomed, setZoomed] = useState(false);
  const [limits, setLimits] = useState({ x: 0, y: 0 });
  const boxRef = useRef<HTMLDivElement>(null);

  const urls = images.length > 0 ? images.map((i) => i.url) : ["/uploads/placeholder.svg"];
  const count = urls.length;

  const closeLightbox = useCallback(() => {
    setOpen(false);
    setZoomed(false);
  }, []);

  const go = useCallback(
    (dir: 1 | -1) => {
      setZoomed(false);
      setActive((i) => (i + dir + count) % count);
    },
    [count]
  );

  const toggleZoom = useCallback(() => {
    if (zoomed) {
      setZoomed(false);
      return;
    }
    const rect = boxRef.current?.getBoundingClientRect();
    const w = rect ? rect.width : 0;
    const h = rect ? rect.height : 0;
    setLimits({
      x: (w * (ZOOM_SCALE - 1)) / 2,
      y: (h * (ZOOM_SCALE - 1)) / 2,
    });
    setZoomed(true);
  }, [zoomed]);

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeLightbox();
      if (count > 1 && e.key === "ArrowLeft") go(-1);
      if (count > 1 && e.key === "ArrowRight") go(1);
    };
    window.addEventListener("keydown", onKey);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, count, go, closeLightbox]);

  return (
    <div className="space-y-4">
      <div className="relative aspect-square overflow-hidden rounded-luxury-lg bg-beige/30 shadow-soft">
        <AnimatePresence mode="wait">
          <motion.div
            key={urls[active]}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0"
          >
            <Image
              src={urls[active]}
              alt="Product"
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 50vw"
              priority
            />
          </motion.div>
        </AnimatePresence>

        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="تكبير الصورة"
          className="absolute inset-0 z-10 cursor-zoom-in focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          <span className="absolute bottom-3 left-3 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-text shadow-soft">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-5 w-5"
              aria-hidden="true"
            >
              <circle cx="11" cy="11" r="7" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
              <line x1="11" y1="8" x2="11" y2="14" />
              <line x1="8" y1="11" x2="14" y2="11" />
            </svg>
          </span>
        </button>
      </div>

      {urls.length > 1 && (
        <div className="flex gap-3 overflow-x-auto pb-2">
          {urls.map((url, i) => (
            <button
              key={url + i}
              type="button"
              onClick={() => setActive(i)}
              className={`relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-luxury border-2 transition ${
                i === active ? "border-accent" : "border-transparent opacity-70 hover:opacity-100"
              }`}
            >
              <Image src={url} alt="" fill className="object-cover" sizes="80px" />
            </button>
          ))}
        </div>
      )}

      <AnimatePresence>
        {open && (
          <motion.div
            key="lightbox"
            role="dialog"
            aria-modal="true"
            aria-label="معرض صور المنتج"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[100] flex flex-col bg-black/95"
          >
            <div className="flex items-center justify-between px-4 py-3 text-white">
              <button
                type="button"
                onClick={closeLightbox}
                aria-label="إغلاق"
                autoFocus
                className="flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-xl leading-none hover:bg-white/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
              >
                ✕
              </button>
              <span className="text-sm text-white/80" dir="ltr">
                {active + 1} / {count}
              </span>
              <span className="w-11" aria-hidden="true" />
            </div>

            <div
              ref={boxRef}
              className="relative flex-1 overflow-hidden"
              onClick={(e) => {
                if (e.target === e.currentTarget) closeLightbox();
              }}
            >
              <motion.div
                key={active}
                drag={zoomed}
                dragConstraints={{
                  left: -limits.x,
                  right: limits.x,
                  top: -limits.y,
                  bottom: limits.y,
                }}
                dragElastic={0.1}
                initial={false}
                animate={zoomed ? { scale: ZOOM_SCALE } : { scale: 1, x: 0, y: 0 }}
                transition={{ type: "spring", stiffness: 260, damping: 30 }}
                onTap={toggleZoom}
                className={`absolute inset-0 ${zoomed ? "cursor-grab active:cursor-grabbing" : "cursor-zoom-in"}`}
              >
                <Image
                  src={urls[active]}
                  alt="Product"
                  fill
                  draggable={false}
                  quality={90}
                  className="select-none object-contain"
                  sizes="200vw"
                />
              </motion.div>

              {count > 1 && (
                <>
                  <button
                    type="button"
                    onClick={() => go(-1)}
                    aria-label="الصورة السابقة"
                    className="absolute left-3 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/15 text-2xl leading-none text-white hover:bg-white/25 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
                  >
                    ‹
                  </button>
                  <button
                    type="button"
                    onClick={() => go(1)}
                    aria-label="الصورة التالية"
                    className="absolute right-3 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/15 text-2xl leading-none text-white hover:bg-white/25 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
                  >
                    ›
                  </button>
                </>
              )}
            </div>

            <p className="px-4 py-3 text-center text-xs text-white/60">
              {zoomed ? "اسحب الصورة للتنقل، واضغط عليها للرجوع" : "اضغط على الصورة للتكبير"}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
