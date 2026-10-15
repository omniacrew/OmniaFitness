"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect } from "react";
import { useCart } from "@/context/CartContext";

export default function CartDrawer() {
  const { cart, isOpen, close, updateItem, busy, error } = useCart();
  const lines = cart?.lines ?? [];

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, close]);

  return (
    <div
      className={`fixed inset-0 z-[10000] ${isOpen ? "" : "pointer-events-none"}`}
      aria-hidden={!isOpen}
    >
      {/* Backdrop */}
      <div
        onClick={close}
        className={`absolute inset-0 bg-black/40 transition-opacity duration-300 ${
          isOpen ? "opacity-100" : "opacity-0"
        }`}
      />

      {/* Panel */}
      <aside
        role="dialog"
        aria-label="Your cart"
        className={`absolute right-0 top-0 flex h-full w-full max-w-md flex-col bg-white font-mono text-black shadow-xl transition-transform duration-300 ease-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between border-b border-black/10 px-6 py-5">
          <h2 className="text-base tracking-wide">
            [cart{cart?.totalQuantity ? ` ${cart.totalQuantity}` : ""}]
          </h2>
          <button
            onClick={close}
            className="text-sm tracking-wide hover:opacity-60"
            aria-label="Close cart"
          >
            [close]
          </button>
        </div>

        <div data-lenis-prevent className="flex-1 overflow-y-auto px-6 py-4">
          {lines.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
              <p className="text-sm text-black/60">Your cart is empty.</p>
              <Link
                href="/shop"
                onClick={close}
                className="rounded-lg border border-black bg-pink-primary px-4 py-2 text-sm tracking-wide transition-colors hover:bg-transparent"
              >
                [shop merch]
              </Link>
            </div>
          ) : (
            <ul className="divide-y divide-black/10">
              {lines.map((line) => {
                return (
                  <li key={line.id} className="flex gap-4 py-4">
                    <Link
                      href={`/shop/${line.productHandle}`}
                      onClick={close}
                      className="relative h-24 w-24 flex-shrink-0 overflow-hidden bg-[#f2f2f2]"
                    >
                      {line.image && (
                        <Image
                          src={line.image}
                          alt={line.productTitle}
                          fill
                          sizes="96px"
                          className="object-cover"
                        />
                      )}
                    </Link>
                    <div className="flex min-w-0 flex-1 flex-col">
                      <Link
                        href={`/shop/${line.productHandle}`}
                        onClick={close}
                        className="text-sm leading-5 hover:opacity-60"
                      >
                        {line.productTitle.toLowerCase()}
                      </Link>
                      {line.variantTitle && (
                        <p className="text-xs text-black/60">size: {line.variantTitle}</p>
                      )}
                      <p className="text-xs text-black/60">{line.unitPrice}</p>
                      <div className="mt-auto flex items-center justify-between pt-2">
                        <div className="flex items-center border border-black/20">
                          <button
                            onClick={() => updateItem(line.id, line.quantity - 1)}
                            disabled={busy}
                            className="h-8 w-8 text-sm hover:bg-black/5 disabled:opacity-40"
                            aria-label={`Remove one ${line.productTitle}`}
                          >
                            −
                          </button>
                          <span className="w-8 text-center text-sm">{line.quantity}</span>
                          <button
                            onClick={() => updateItem(line.id, line.quantity + 1)}
                            disabled={busy}
                            className="h-8 w-8 text-sm hover:bg-black/5 disabled:opacity-40"
                            aria-label={`Add one ${line.productTitle}`}
                          >
                            +
                          </button>
                        </div>
                        <button
                          onClick={() => updateItem(line.id, 0)}
                          disabled={busy}
                          className="text-xs text-black/60 underline underline-offset-2 hover:text-black disabled:opacity-40"
                        >
                          remove
                        </button>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {lines.length > 0 && cart && (
          <div className="border-t border-black/10 px-6 py-5">
            {error && <p className="mb-3 text-xs text-red-600">{error}</p>}
            <div className="mb-1 flex justify-between text-sm">
              <span>subtotal</span>
              <span>{cart.subtotal}</span>
            </div>
            <p className="mb-4 text-xs text-black/50">
              Shipping and taxes calculated at checkout.
            </p>
            <a
              href={cart.checkoutUrl}
              className={`block w-full rounded-lg border border-black bg-black py-3 text-center text-sm tracking-wide text-white transition-colors hover:bg-pink-primary hover:text-black ${
                busy ? "pointer-events-none opacity-60" : ""
              }`}
            >
              [checkout]
            </a>
          </div>
        )}
      </aside>
    </div>
  );
}
