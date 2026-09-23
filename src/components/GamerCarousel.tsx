"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";

interface GamerCarouselProps {
  images: string[];
  alt?: string;
  intervalMs?: number;
}

export default function GamerCarousel({
  images,
  alt = "Consola Gamer Tecno+",
  intervalMs = 6000,
}: GamerCarouselProps) {
  const [current, setCurrent] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const nextSlide = useCallback(() => {
    setCurrent((prev) => (prev + 1) % images.length);
  }, [images.length]);

  const prevSlide = useCallback(() => {
    setCurrent((prev) => (prev - 1 + images.length) % images.length);
  }, [images.length]);

  // 6-second auto advance
  useEffect(() => {
    if (isPaused || images.length <= 1) return;

    const interval = setInterval(() => {
      nextSlide();
    }, intervalMs);

    return () => clearInterval(interval);
  }, [isPaused, images.length, intervalMs, nextSlide, current]);

  if (!images || images.length === 0) return null;

  return (
    <div
      className="relative flex h-full min-h-[340px] sm:min-h-[400px] w-full items-center justify-center p-3 sm:p-6"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      aria-label="Carrusel de imágenes de consola gamer"
    >
      {/* Studio Showcase Card */}
      <div className="relative flex h-[320px] sm:h-[380px] w-full max-w-[480px] items-center justify-center overflow-hidden rounded-3xl bg-white shadow-2xl ring-1 ring-white/20">
        {/* Slides */}
        {images.map((src, idx) => {
          const isActive = idx === current;
          return (
            <div
              key={src}
              className={`absolute inset-0 flex items-center justify-center p-4 sm:p-6 transition-all duration-700 ease-in-out ${
                isActive
                  ? "opacity-100 scale-100 pointer-events-auto"
                  : "opacity-0 scale-95 pointer-events-none"
              }`}
            >
              <div className="relative h-full w-full">
                <Image
                  src={src}
                  alt={`${alt} - Imagen ${idx + 1}`}
                  fill
                  priority={idx === 0}
                  unoptimized
                  className="object-contain"
                  sizes="(max-width: 768px) 100vw, 480px"
                />
              </div>
            </div>
          );
        })}

        {/* 6-Second Animated Progress Bar */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-black/5 z-10">
          <div
            key={current}
            className="h-full bg-[var(--red)] origin-left"
            style={{
              animation: isPaused
                ? "none"
                : `gamerProgressBar ${intervalMs}ms linear`,
            }}
          />
        </div>

        {/* Navigation Arrows */}
        {images.length > 1 && (
          <>
            <button
              onClick={prevSlide}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 z-20 flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-full bg-black/10 hover:bg-black/20 text-[#111] backdrop-blur-md transition-all hover:scale-110 active:scale-95 shadow-xs"
              aria-label="Imagen anterior"
              title="Anterior"
            >
              <svg
                className="h-4 w-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>

            <button
              onClick={nextSlide}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 z-20 flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-full bg-black/10 hover:bg-black/20 text-[#111] backdrop-blur-md transition-all hover:scale-110 active:scale-95 shadow-xs"
              aria-label="Siguiente imagen"
              title="Siguiente"
            >
              <svg
                className="h-4 w-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          </>
        )}

        {/* Dots & slide counter */}
        {images.length > 1 && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 rounded-full bg-black/20 px-3 py-1.5 backdrop-blur-md">
            {images.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrent(idx)}
                className={`h-2 rounded-full transition-all duration-300 ${
                  idx === current
                    ? "w-6 bg-[var(--red)]"
                    : "w-2 bg-black/30 hover:bg-black/50"
                }`}
                aria-label={`Ver diapositiva ${idx + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
