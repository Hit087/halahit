"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

import type { HeroSlide } from "@/types";
import { useLocaleStore } from "@/store/locale-store";
import { localizedName } from "@/lib/i18n";
import { Button } from "@/components/ui/Button";

export function HeroCarousel({ slides }: { slides: HeroSlide[] }) {
  const activeSlides = slides.filter((s) => s.active);
  const [index, setIndex] = useState(0);
  const locale = useLocaleStore((s) => s.locale);

  const next = useCallback(() => {
    setIndex((i) => (i + 1) % activeSlides.length);
  }, [activeSlides.length]);

  useEffect(() => {
    if (activeSlides.length <= 1) return;
    const timer = setInterval(next, 5000);
    return () => clearInterval(timer);
  }, [activeSlides.length, next]);

  if (!activeSlides.length) return null;

  const slide = activeSlides[index];

  return (
    <div className="mx-auto my-4 max-w-7xl px-3 sm:px-6">
      <section className="relative overflow-hidden rounded-[24px] shadow-[0_8px_32px_rgba(0,0,0,0.10)]">

        <AnimatePresence mode="wait">
          <motion.div
            key={slide.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="relative"
          >
            {/* الصورة الممتلئة */}
            <div className="relative h-[320px] sm:h-[420px] md:h-[480px] w-full">
              <Image
                src={slide.image}
                alt={slide.title}
                fill
                priority
                sizes="100vw"
                className="object-cover object-center"
              />
              {/* تدرج داكن للنص */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
            </div>

            {/* النص فوق الصورة */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.4 }}
              className="absolute bottom-0 inset-x-0 p-6 sm:p-8 md:p-10"
            >
              <h1 className="font-display text-2xl sm:text-3xl md:text-4xl font-bold text-white leading-snug drop-shadow-md">
                {localizedName(slide.title, slide.titleEn, locale)}
              </h1>

              {(slide.subtitle || slide.subtitleEn) && (
                <p className="mt-2 text-sm sm:text-base text-white/85 max-w-md drop-shadow">
                  {localizedName(slide.subtitle ?? "", slide.subtitleEn ?? "", locale)}
                </p>
              )}

              {slide.ctaLink && (
                <Link href={slide.ctaLink} className="mt-5 inline-block">
                  <Button
                    size="lg"
                    className="rounded-full bg-[#F4A6C1] px-8 text-white font-semibold shadow-lg hover:bg-[#e392b0] transition"
                  >
                    {slide.ctaText ?? "تسوق الآن"}
                  </Button>
                </Link>
              )}
            </motion.div>
          </motion.div>
        </AnimatePresence>

        {/* نقاط التنقل */}
        {activeSlides.length > 1 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
            {activeSlides.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setIndex(i)}
                aria-label={`Slide ${i + 1}`}
                className={`h-2 rounded-full transition-all duration-300 ${
                  i === index ? "w-8 bg-white" : "w-2 bg-white/50"
                }`}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
