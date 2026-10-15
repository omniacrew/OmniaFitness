import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Header from "@/components/Header";
import BlendLogo from "@/components/BlendLogo";
import BlendNav from "@/components/BlendNav";
import Footer from "@/components/Footer";
import ProductView from "@/components/shop/ProductView";
import { getProduct, getShopProducts } from "@/lib/shopify";

export const revalidate = 300;

type Props = { params: { handle: string } };

export async function generateStaticParams() {
  const products = await getShopProducts(50);
  return products.map((p) => ({ handle: p.handle }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const product = await getProduct(params.handle);
  if (!product) return { title: "Shop" };
  const description = product.description.slice(0, 160);
  const image = product.images[0];
  return {
    title: product.title,
    description,
    alternates: { canonical: `/shop/${product.handle}` },
    openGraph: {
      title: product.title,
      description,
      images: image ? [{ url: image.url, width: image.width, height: image.height }] : undefined,
    },
  };
}

export default async function ProductPage({ params }: Props) {
  const product = await getProduct(params.handle);
  if (!product) notFound();

  return (
    <>
      <main className="min-h-screen bg-white">
        <BlendLogo />
        <BlendNav />
        <Header />
        <div className="mx-auto max-w-6xl px-6 pb-28 pt-36 md:pt-44">
          <Link
            href="/shop"
            className="mb-6 inline-block font-mono text-sm text-black/60 hover:text-black"
          >
            ← [all merch]
          </Link>
          <ProductView product={product} />
        </div>
      </main>
      <Footer />
    </>
  );
}
