// Server-only helper that reads live products from the Omnia Shopify store
// via the public Storefront API. Only products published to the sales channel
// that owns SHOPIFY_STOREFRONT_TOKEN (e.g. the "Headless" channel) are returned.

const STORE_DOMAIN =
  process.env.SHOPIFY_STORE_DOMAIN || "omnia-fitness-collective.myshopify.com";
const API_VERSION = process.env.SHOPIFY_API_VERSION || "2026-04";
const REVALIDATE_SECONDS = 300; // refresh product list every 5 minutes

export const SHOP_URL = `https://${STORE_DOMAIN}`;

export type ShopProduct = {
  id: string;
  title: string;
  type: string;
  url: string;
  image: { url: string; alt: string } | null;
  price: string;
  availableForSale: boolean;
};

const QUERY = /* GraphQL */ `
  query ShopBanner($first: Int!) {
    products(first: $first, sortKey: UPDATED_AT, reverse: true) {
      nodes {
        id
        handle
        title
        productType
        availableForSale
        onlineStoreUrl
        featuredImage { url altText }
        priceRange { minVariantPrice { amount currencyCode } }
      }
    }
  }
`;

type RawProduct = {
  id: string;
  handle: string;
  title: string;
  productType: string;
  availableForSale: boolean;
  onlineStoreUrl: string | null;
  featuredImage: { url: string; altText: string | null } | null;
  priceRange: { minVariantPrice: { amount: string; currencyCode: string } };
};

function formatPrice(amount: string, currencyCode: string) {
  const value = Number(amount);
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currencyCode,
    minimumFractionDigits: Number.isInteger(value) ? 0 : 2,
  }).format(value);
}

/**
 * Returns the store's published products, newest first.
 * Never throws: on a missing token or any Shopify error it returns [],
 * so the homepage still renders (the shop banner simply hides).
 */
export async function getShopProducts(first = 20): Promise<ShopProduct[]> {
  const token = process.env.SHOPIFY_STOREFRONT_TOKEN;
  if (!token) return [];

  try {
    const res = await fetch(
      `https://${STORE_DOMAIN}/api/${API_VERSION}/graphql.json`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Shopify-Storefront-Access-Token": token,
        },
        body: JSON.stringify({ query: QUERY, variables: { first } }),
        next: { revalidate: REVALIDATE_SECONDS },
      }
    );
    if (!res.ok) {
      console.error(`[shopify] Storefront API ${res.status}`);
      return [];
    }
    const json = await res.json();
    if (json.errors) {
      console.error("[shopify] Storefront API errors", json.errors);
      return [];
    }
    const nodes: RawProduct[] = json.data?.products?.nodes ?? [];
    return nodes.map((p) => ({
      id: p.id,
      title: p.title,
      type: p.productType?.trim() || "",
      url: p.onlineStoreUrl || `${SHOP_URL}/products/${p.handle}`,
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
    console.error("[shopify] Storefront API request failed", err);
    return [];
  }
}
