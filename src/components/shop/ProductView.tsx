"use client";

import { useMemo, useState } from "react";
import { useCart } from "@/context/CartContext";
import type { ProductDetail } from "@/lib/shopify";
import ProductGallery from "./ProductGallery";

export default function ProductView({ product }: { product: ProductDetail }) {
  const { addItem, busy, error } = useCart();
  const singleVariant = product.options.length === 0;

  // Selected option values, e.g. { Size: "M" }. Nothing is preselected for
  // multi-size products so nobody accidentally buys the wrong size.
  const [selected, setSelected] = useState<Record<string, string>>({});
  const [galleryIndex, setGalleryIndex] = useState(0);

  const variant = useMemo(() => {
    if (singleVariant) return product.variants[0];
    return product.variants.find((v) =>
      product.options.every((o) =>
        v.options.some((so) => so.name === o.name && so.value === selected[o.name])
      )
    );
  }, [product, selected, singleVariant]);

  // Is a given option value buyable, given the other options already chosen?
  const valueAvailable = (optionName: string, value: string) =>
    product.variants.some(
      (v) =>
        v.availableForSale &&
        v.options.every((so) =>
          so.name === optionName
            ? so.value === value
            : !selected[so.name] || selected[so.name] === so.value
        )
    );

  const choose = (name: string, value: string) => {
    const next = { ...selected, [name]: value };
    setSelected(next);
    const match = product.variants.find((v) =>
      v.options.every((so) => !next[so.name] || next[so.name] === so.value)
    );
    if (match?.imageUrl) {
      const i = product.images.findIndex((img) => img.url === match.imageUrl);
      if (i >= 0) setGalleryIndex(i);
    }
  };

  const price = variant?.price ?? product.variants[0]?.price;
  const missing = product.options.find((o) => !selected[o.name]);

  let buttonLabel = "[add to cart]";
  let canAdd = false;
  if (!product.availableForSale) buttonLabel = "[sold out]";
  else if (missing) buttonLabel = `[select a ${missing.name.toLowerCase()}]`;
  else if (!variant || !variant.availableForSale) buttonLabel = "[sold out]";
  else canAdd = true;
  if (busy && canAdd) buttonLabel = "[adding…]";

  return (
    <div className="grid gap-10 md:grid-cols-2 md:gap-14">
      <ProductGallery
        images={product.images}
        index={galleryIndex}
        onIndexChange={setGalleryIndex}
        title={product.title}
      />

      <div className="font-mono text-black md:sticky md:top-32 md:self-start">
        {product.type && (
          <span className="mb-3 inline-block bg-[#FBCCF2] px-2 py-0.5 text-xs">
            {product.type.toLowerCase()}
          </span>
        )}
        <h1 className="mb-2 text-2xl font-normal tracking-tight md:text-3xl">
          {product.title.toLowerCase()}
        </h1>
        <p className="mb-8 text-base text-black/70">{price}</p>

        {product.options.map((option) => (
          <fieldset key={option.name} className="mb-8">
            <legend className="mb-3 text-sm">
              {option.name.toLowerCase()}
              {selected[option.name] ? `: ${selected[option.name]}` : ""}
            </legend>
            <div className="flex flex-wrap gap-2">
              {option.values.map((value) => {
                const available = valueAvailable(option.name, value);
                const isSelected = selected[option.name] === value;
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => available && choose(option.name, value)}
                    disabled={!available}
                    aria-pressed={isSelected}
                    className={`min-w-[3rem] rounded-lg border px-3 py-2 text-sm transition-colors ${
                      isSelected
                        ? "border-black bg-black text-white"
                        : available
                          ? "border-black/30 hover:border-black"
                          : "cursor-not-allowed border-black/10 text-black/30 line-through"
                    }`}
                  >
                    {value}
                  </button>
                );
              })}
            </div>
          </fieldset>
        ))}

        <button
          type="button"
          onClick={() => canAdd && variant && addItem(variant.id)}
          disabled={!canAdd || busy}
          className={`mb-3 w-full rounded-lg border border-black py-3 text-sm tracking-wide transition-colors ${
            canAdd
              ? "bg-pink-primary hover:bg-transparent"
              : "cursor-not-allowed bg-transparent text-black/50"
          }`}
        >
          {buttonLabel}
        </button>
        {error && <p className="mb-3 text-xs text-red-600">{error}</p>}
        <p className="mb-10 text-xs text-black/50">
          Shipping and taxes calculated at checkout.
        </p>

        {product.descriptionHtml && (
          <div
            className="space-y-3 text-sm leading-relaxed text-black/80 [&_p:empty]:hidden"
            dangerouslySetInnerHTML={{ __html: product.descriptionHtml }}
          />
        )}
      </div>

    </div>
  );
}
