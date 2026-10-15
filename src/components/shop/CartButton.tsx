"use client";

import { usePathname } from "next/navigation";
import { useCart } from "@/context/CartContext";
import { NEWSLETTER_LAYOUT, useNewsletterBanner } from "@/context/NewsletterBannerContext";
import Proximate from "@/components/variable-proximity/Proximate";

/**
 * Fixed top-right [cart n] link. Shows on shop pages, and anywhere on the site
 * once the visitor has something in their cart.
 */
export default function CartButton() {
  const { count, open } = useCart();
  const { bannerVisible } = useNewsletterBanner();
  const pathname = usePathname();
  const onShop = pathname.startsWith("/shop");
  if (!onShop && count === 0) return null;

  const top = bannerVisible
    ? NEWSLETTER_LAYOUT.navTop.withBanner
    : NEWSLETTER_LAYOUT.navTop.withoutBanner;

  return (
    <button
      onClick={open}
      className="fixed right-4 md:right-6 font-mono text-base tracking-wide text-white transition-colors duration-300 hover:text-pink-primary"
      style={{
        top: `${top}px`,
        zIndex: 9998,
        mixBlendMode: "difference",
        transition: "top 0.45s cubic-bezier(0.32, 0.72, 0, 1)",
      }}
      aria-label={`Open cart, ${count} item${count === 1 ? "" : "s"}`}
    >
      <Proximate>{`[cart${count ? ` ${count}` : ""}]`}</Proximate>
    </button>
  );
}
