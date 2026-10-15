"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";

type Img = { url: string; alt: string; width: number; height: number };

type Props = {
  images: Img[];
  index: number;
  onIndexChange: (i: number) => void;
  title: string;
};

const arrowBtn =
  "absolute top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-white/80 font-mono text-lg text-black shadow-sm transition-opacity hover:bg-white";

export default function ProductGallery({ images, index, onIndexChange, title }: Props) {
  const [zoomed, setZoomed] = useState(false);
  const touchX = useRef<number | null>(null);
  const count = images.length;

  const go = useCallback(
    (delta: number) => {
      if (count < 2) return;
      onIndexChange((index + delta + count) % count);
    },
    [count, index, onIndexChange]
  );

  // Keyboard + scroll lock while the lightbox is open.
  useEffect(() => {
    if (!zoomed) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setZoomed(false);
      if (e.key === "ArrowRight") go(1);
      if (e.key === "ArrowLeft") go(-1);
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "unset";
    };
  }, [zoomed, go]);

  const swipe = {
    onTouchStart: (e: React.TouchEvent) => {
      touchX.current = e.touches[0].clientX;
    },
    onTouchEnd: (e: React.TouchEvent) => {
      if (touchX.current == null) return;
      const dx = e.changedTouches[0].clientX - touchX.current;
      touchX.current = null;
      if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1);
    },
  };

  if (count === 0) {
    return <div className="aspect-square w-full bg-[#f2f2f2]" />;
  }

  const current = images[Math.min(index, count - 1)];

  return (
    <div>
      {/* Main image */}
      <div className="relative aspect-square w-full overflow-hidden bg-[#f2f2f2]" {...swipe}>
        <button
          type="button"
          onClick={() => setZoomed(true)}
          className="absolute inset-0 cursor-zoom-in"
          aria-label={`Enlarge photo of ${title}`}
        >
          <Image
            key={current.url}
            src={current.url}
            alt={current.alt}
            fill
            priority
            sizes="(min-width: 768px) 50vw, 100vw"
            className="object-cover"
          />
        </button>
        {count > 1 && (
          <>
            <button type="button" onClick={() => go(-1)} className={`${arrowBtn} left-3`} aria-label="Previous photo">
              ‹
            </button>
            <button type="button" onClick={() => go(1)} className={`${arrowBtn} right-3`} aria-label="Next photo">
              ›
            </button>
          </>
        )}
      </div>

      {/* Thumbnails */}
      {count > 1 && (
        <div className="mt-3 grid grid-cols-5 gap-2">
          {images.map((img, i) => (
            <button
              key={img.url}
              type="button"
              onClick={() => onIndexChange(i)}
              className={`relative aspect-square overflow-hidden bg-[#f2f2f2] transition-opacity ${
                i === index ? "ring-1 ring-black" : "opacity-60 hover:opacity-100"
              }`}
              aria-label={`Show photo ${i + 1}`}
              aria-current={i === index}
            >
              <Image src={img.url} alt="" fill sizes="96px" className="object-cover" />
            </button>
          ))}
        </div>
      )}

      {/* Lightbox */}
      {zoomed && (
        <div
          role="dialog"
          aria-label={`${title} photos`}
          className="fixed inset-0 z-[10001] flex items-center justify-center bg-white"
          onClick={() => setZoomed(false)}
          {...swipe}
        >
          <div className="relative h-[85vh] w-[92vw]">
            <Image
              key={`zoom-${current.url}`}
              src={current.url}
              alt={current.alt}
              fill
              sizes="92vw"
              className="object-contain"
            />
          </div>
          <button
            type="button"
            onClick={() => setZoomed(false)}
            className="absolute right-5 top-5 font-mono text-sm tracking-wide text-black hover:opacity-60"
          >
            [close]
          </button>
          {count > 1 && (
            <>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  go(-1);
                }}
                className={`${arrowBtn} left-4`}
                aria-label="Previous photo"
              >
                ‹
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  go(1);
                }}
                className={`${arrowBtn} right-4`}
                aria-label="Next photo"
              >
                ›
              </button>
              <p className="absolute bottom-5 font-mono text-xs text-black/60">
                {index + 1} / {count}
              </p>
            </>
          )}
        </div>
      )}
    </div>
  );
}
