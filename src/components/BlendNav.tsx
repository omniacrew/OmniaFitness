"use client";

import MagneticButton from "@/components/MagneticButton";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useBooking } from "@/context/BookingContext";
import { NEWSLETTER_LAYOUT, useNewsletterBanner } from "@/context/NewsletterBannerContext";
import Proximate from "@/components/variable-proximity/Proximate";
import CartButton from "@/components/shop/CartButton";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";

const bookIntroBtnClass =
  "rounded-lg border border-black bg-pink-primary px-4 py-2 font-mono text-sm text-black tracking-wide transition-colors duration-300 hover:bg-transparent";

export default function BlendNav() {
  const { openModal } = useBooking();
  const { bannerVisible } = useNewsletterBanner();
  const pathname = usePathname();
  const reduceMotion = usePrefersReducedMotion();
  const navTopPx = bannerVisible
    ? NEWSLETTER_LAYOUT.navTop.withBanner
    : NEWSLETTER_LAYOUT.navTop.withoutBanner;
  const hideBookIntro = pathname.startsWith("/policies");
  const isBlog = pathname.startsWith("/blog");

  const handleAboutClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (pathname !== "/") return;
    e.preventDefault();
    document.getElementById("why-omnia")?.scrollIntoView({
      behavior: reduceMotion ? "auto" : "smooth",
      block: "start",
    });
    window.history.replaceState(null, "", "#why-omnia");
  };

  return (
    <>
      <CartButton />
      {/* Desktop Nav - Fixed top left */}
      <div
        className="hidden md:flex fixed items-center gap-3"
        style={{
          top: `${navTopPx}px`,
          left: "24px",
          zIndex: 9998,
          transition: "top 0.45s cubic-bezier(0.32, 0.72, 0, 1)",
        }}
      >
        {isBlog ? (
          <Link
            href="/"
            className="text-base font-mono tracking-wide text-black transition-colors duration-300 hover:text-pink-primary"
          >
            <Proximate>[home]</Proximate>
          </Link>
        ) : (
          <div
            className="flex items-center gap-3"
            style={{ mixBlendMode: "difference" }}
          >
            <Link
              href="/#why-omnia"
              onClick={handleAboutClick}
              className="text-base font-mono tracking-wide text-white transition-colors duration-300 hover:text-pink-primary"
            >
              <Proximate>[about]</Proximate>
            </Link>
            <Link
              href="/blog"
              className="text-base font-mono tracking-wide text-white transition-colors duration-300 hover:text-pink-primary"
            >
              <Proximate>[blog]</Proximate>
            </Link>
            <Link
              href="/shop"
              className="text-base font-mono tracking-wide text-white transition-colors duration-300 hover:text-pink-primary"
            >
              <Proximate>[shop]</Proximate>
            </Link>
          </div>
        )}
        {!hideBookIntro ? (
          <MagneticButton onClick={() => openModal()} className={bookIntroBtnClass}>
            <Proximate>[book intro]</Proximate>
          </MagneticButton>
        ) : null}
      </div>

      {/* Mobile Nav - Fixed bottom bar */}
      <div
        className="fixed z-[9998] flex items-center justify-center gap-3 md:hidden"
        style={{
          left: "max(1rem, env(safe-area-inset-left, 0px))",
          right: "max(1rem, env(safe-area-inset-right, 0px))",
          bottom: "max(1rem, env(safe-area-inset-bottom, 0px))",
        }}
      >
        {isBlog ? (
          <Link
            href="/"
            className="text-base font-mono tracking-wide text-black transition-opacity duration-300 hover:opacity-70"
          >
            <Proximate>[home]</Proximate>
          </Link>
        ) : (
          <div className="flex items-center gap-3">
            <Link
              href="/#why-omnia"
              onClick={handleAboutClick}
              className="mix-blend-difference text-base font-mono tracking-wide text-white transition-opacity duration-300 hover:opacity-70"
            >
              <Proximate>[about]</Proximate>
            </Link>
            <Link
              href="/blog"
              className="mix-blend-difference text-base font-mono tracking-wide text-white transition-opacity duration-300 hover:opacity-70"
            >
              <Proximate>[blog]</Proximate>
            </Link>
            <Link
              href="/shop"
              className="mix-blend-difference text-base font-mono tracking-wide text-white transition-opacity duration-300 hover:opacity-70"
            >
              <Proximate>[shop]</Proximate>
            </Link>
          </div>
        )}
        {!hideBookIntro ? (
          <MagneticButton onClick={() => openModal()} className={bookIntroBtnClass}>
            <Proximate>[book intro]</Proximate>
          </MagneticButton>
        ) : null}
      </div>
    </>
  );
}
