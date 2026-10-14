"use client";

import Image from "next/image";
import { useRef, useState, useEffect } from "react";
import Proximate from "@/components/variable-proximity/Proximate";
import StaggerList from "./StaggerList";
import type { ShopProduct } from "@/lib/shopify";

export default function ShopCarousel({ products }: { products: ShopProduct[] }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  // True when the cards are wider than the screen and the row can scroll.
  const [overflowing, setOverflowing] = useState(false);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const check = () => setOverflowing(el.scrollWidth > el.clientWidth + 1);
    check();
    const ro = new ResizeObserver(check);
    ro.observe(el);
    if (el.firstElementChild) ro.observe(el.firstElementChild);
    return () => ro.disconnect();
  }, [products.length]);

  useEffect(() => {
    const handleScroll = () => {
      if (scrollRef.current) {
        const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
        const max = scrollWidth - clientWidth;
        setScrollProgress(max > 0 ? scrollLeft / max : 0);
      }
    };

    const scrollElement = scrollRef.current;
    if (scrollElement) {
      scrollElement.addEventListener("scroll", handleScroll);
      return () => scrollElement.removeEventListener("scroll", handleScroll);
    }
  }, []);

  return (
    <section className="bg-white py-10 md:py-14">
      {/* Product Cards - Horizontal Scroll */}
      <div
        ref={scrollRef}
        data-lenis-prevent-touch
        className={`flex touch-pan-x overflow-x-auto px-6 pb-4 [&::-webkit-scrollbar]:hidden ${
          overflowing ? "" : "justify-center"
        }`}
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        <StaggerList as="div" className="flex gap-4 md:gap-8" staggerMs={36} durationMs={340}>
        {products.map((product) => (
          <a
            key={product.id}
            href={product.url}
            target="_blank"
            rel="noopener noreferrer"
            className="card-lift-hover flex-shrink-0 w-[200px] md:w-[280px] group cursor-pointer rounded-sm"
          >
            {/* Badge - Above image */}
            <div className="flex justify-center mb-2">
              <span className="bg-[#FBCCF2] text-black text-xs font-mono px-2 py-0.5">
                <Proximate>{(product.type || "merch").toLowerCase()}</Proximate>
              </span>
            </div>
            {/* Product Image */}
            <div className="relative aspect-square w-full mb-3 overflow-hidden bg-black">
              {product.image && (
                <Image
                  src={product.image.url}
                  alt={product.image.alt}
                  fill
                  sizes="(min-width: 768px) 280px, 200px"
                  className="object-cover group-hover:opacity-80 transition-opacity"
                />
              )}
            </div>

            {/* Product Name + Price */}
            <p className="text-black text-sm font-mono min-h-[2.5rem] leading-5">
              <Proximate>{product.title.toLowerCase()}</Proximate>
            </p>
            <p className="text-black/60 text-sm font-mono">
              <Proximate>{product.availableForSale ? product.price : "sold out"}</Proximate>
            </p>
          </a>
        ))}
        </StaggerList>
      </div>

      {/* Progress Bar - only when the row actually scrolls */}
      {overflowing && (
      <div className="mt-6 px-6">
        <div className="h-0.5 bg-black/20">
          <div 
            className="h-0.5 bg-black transition-all duration-150"
            style={{ width: `${Math.max(20, scrollProgress * 100)}%` }}
          />
        </div>
      </div>
      )}
    </section>
  );
}
