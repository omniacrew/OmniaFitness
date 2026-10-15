// Server-only helpers that read the Omnia Shopify store through the public
// Storefront API. Only products published to the sales channel that owns
// SHOPIFY_STOREFRONT_TOKEN (the "Headless" channel) are returned.

const STORE_DOMAIN =
  process.env.SHOPIFY_STORE_DOMAIN || "omnia-fitness-collective.myshopify.com";
const API_VERSION = process.env.SHOPIFY_API_VERSION || "2026-04";
export const REVALIDATE_SECONDS = 300; // refresh product data every 5 minutes
// Shopify collection that controls which products show in the banner / shop
// grid and in what order (drag to reorder in Shopify admin). Falls back to all
// products, newest-edited first, if the collection is missing or empty.
const BANNER_COLLECTION =
  process.env.SHOPIFY_BANNER_COLLECTION || "homepage-banner";

export const SHOP_URL = `https://${STORE_DOMAIN}`;

// ---------------------------------------------------------------------------
// Low-level request helper
// ---------------------------------------------------------------------------

type StorefrontOptions = {
  variables?: Record<string, unknown>;
  /** Seconds to cache (ISR). Use 0 / "no-store" for cart calls. */
  revalidate?: number | false;
};

export class StorefrontError extends Error {}

export async function storefront<T>(
  query: string,
  { variables, revalidate = REVALIDATE_SECONDS }: StorefrontOptions = {}
): Promise<T> {
  const token = process.env.SHOPIFY_STOREFRONT_TOKEN;
  if (!token) throw new StorefrontError("SHOPIFY_STOREFRONT_TOKEN is not set");

  const res = await fetch(
    `https://${STORE_DOMAIN}/api/${API_VERSION}/graphql.json`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Storefront-Access-Token": token,
      },
      body: JSON.stringify({ query, variables }),
      ...(revalidate === false || revalidate === 0
        ? { cache: "no-store" as const }
        : { next: { revalidate } }),
    }
  );
  if (!res.ok) throw new StorefrontError(`Storefront API ${res.status}`);
  const json = await res.json();
  if (json.errors) {
    throw new StorefrontError(
      json.errors.map((e: { message: string }) => e.message).join("; ")
    );
  }
  return json.data as T;
}

export function formatPrice(amount: string | number, currencyCode = "USD") {
  const value = Number(amount);
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currencyCode,
    minimumFractionDigits: Number.isInteger(value) ? 0 : 2,
  }).format(value);
}

// ---------------------------------------------------------------------------
// Product list (homepage banner + /shop grid)
// ---------------------------------------------------------------------------

export type ShopProduct = {
  id: string;
  handle: string;
  title: string;
  type: string;
  url: string;
  image: { url: string; alt: string } | null;
  price: string;
  availableForSale: boolean;
};

const LIST_QUERY = /* GraphQL */ `
  fragment BannerProduct on Product {
    id
    handle
    title
    productType
    availableForSale
    featuredImage { url altText }
    priceRange { minVariantPrice { amount currencyCode } }
  }
  query ShopBanner($first: Int!, $handle: String!) {
    collection(handle: $handle) {
      products(first: $first, sortKey: COLLECTION_DEFAULT) {
        nodes { ...BannerProduct }
      }
    }
    products(first: $first, sortKey: UPDATED_AT, reverse: true) {
      nodes { ...BannerProduct }
    }
  }
`;

type RawListProduct = {
  id: string;
  handle: string;
  title: string;
  productType: string;
  availableForSale: boolean;
  featuredImage: { url: string; altText: string | null } | null;
  priceRange: { minVariantPrice: { amount: string; currencyCode: string } };
};

/**
 * Returns the store's products in the Homepage Banner collection order.
 * Never throws: on a missing token or any Shopify error it returns [],
 * so pages still render (the shop banner simply hides).
 */
export async function getShopProducts(first = 20): Promise<ShopProduct[]> {
  try {
    const data = await storefront<{
      collection: { products: { nodes: RawListProduct[] } } | null;
      products: { nodes: RawListProduct[] };
    }>(LIST_QUERY, { variables: { first, handle: BANNER_COLLECTION } });
    const fromCollection = data.collection?.products?.nodes ?? [];
    const nodes = fromCollection.length ? fromCollection : data.products.nodes;
    return nodes.map((p) => ({
      id: p.id,
      handle: p.handle,
      title: p.title,
      type: p.productType?.trim() || "",
      url: `/shop/${p.handle}`,
      image: p.featuredImage
        ? { url: p.featuredImage.url, alt: p.featuredImage.altText || p.title }
        : null,
      price: formatPrice(
        p.priceRange.minVariantPrice.amount,
        p.priceRange.minVariantPrice.currencyCode
      ),
      availableForSale: p.availableForSale,
    }));
  } catch (err) {
    console.error("[shopify] product list failed", err);
    return [];
  }
}

// ---------------------------------------------------------------------------
// Single product (/shop/[handle])
// ---------------------------------------------------------------------------

export type ProductVariant = {
  id: string;
  title: string;
  availableForSale: boolean;
  price: string;
  options: { name: string; value: string }[];
  imageUrl: string | null;
};

export type ProductDetail = {
  id: string;
  handle: string;
  title: string;
  type: string;
  descriptionHtml: string;
  description: string;
  availableForSale: boolean;
  images: { url: string; alt: string; width: number; height: number }[];
  /** Options worth showing a picker for (hides Shopify's "Default Title"). */
  options: { name: string; values: string[] }[];
  variants: ProductVariant[];
};

const PRODUCT_QUERY = /* GraphQL */ `
  query ShopProduct($handle: String!) {
    product(handle: $handle) {
      id
      handle
      title
      productType
      description
      descriptionHtml
      availableForSale
      images(first: 20) { nodes { url altText width height } }
      options { name optionValues { name } }
      variants(first: 50) {
        nodes {
          id
          title
          availableForSale
          price { amount currencyCode }
          selectedOptions { name value }
          image { url }
        }
      }
    }
  }
`;

type RawProduct = {
  id: string;
  handle: string;
  title: string;
  productType: string;
  description: string;
  descriptionHtml: string;
  availableForSale: boolean;
  images: {
    nodes: { url: string; altText: string | null; width: number; height: number }[];
  };
  options: { name: string; optionValues: { name: string }[] }[];
  variants: {
    nodes: {
      id: string;
      title: string;
      availableForSale: boolean;
      price: { amount: string; currencyCode: string };
      selectedOptions: { name: string; value: string }[];
      image: { url: string } | null;
    }[];
  };
};

/** Returns null when the product doesn't exist (or Shopify is unreachable). */
export async function getProduct(handle: string): Promise<ProductDetail | null> {
  try {
    const { product: p } = await storefront<{ product: RawProduct | null }>(
      PRODUCT_QUERY,
      { variables: { handle } }
    );
    if (!p) return null;
    const options = p.options
      .map((o) => ({ name: o.name, values: o.optionValues.map((v) => v.name) }))
      .filter((o) => !(o.values.length === 1 && o.values[0] === "Default Title"));
    return {
      id: p.id,
      handle: p.handle,
      title: p.title,
      type: p.productType?.trim() || "",
      description: p.description,
      descriptionHtml: p.descriptionHtml,
      availableForSale: p.availableForSale,
      images: p.images.nodes.map((i) => ({
        url: i.url,
        alt: i.altText || p.title,
        width: i.width,
        height: i.height,
      })),
      options,
      variants: p.variants.nodes.map((v) => ({
        id: v.id,
        title: v.title,
        availableForSale: v.availableForSale,
        price: formatPrice(v.price.amount, v.price.currencyCode),
        options: v.selectedOptions,
        imageUrl: v.image?.url ?? null,
      })),
    };
  } catch (err) {
    console.error(`[shopify] product ${handle} failed`, err);
    return null;
  }
}
