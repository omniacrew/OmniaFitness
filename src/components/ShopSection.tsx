import { getShopProducts } from "@/lib/shopify";
import ShopCarousel from "./ShopCarousel";

// Pulls live, published products from the Omnia Shopify store.
// If nothing is published (or Shopify is unreachable) the section hides.
export default async function ShopSection() {
  const products = await getShopProducts();
  if (products.length === 0) return null;
  return <ShopCarousel products={products} />;
}
