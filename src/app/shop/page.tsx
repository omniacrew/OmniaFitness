import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import Header from "@/components/Header";
import BlendLogo from "@/components/BlendLogo";
import BlendNav from "@/components/BlendNav";
import Footer from "@/components/Footer";
import Proximate from "@/components/variable-proximity/Proximate";
import { getShopProducts } from "@/lib/shopify";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Shop",
  description: "Omnia Fitness Collective merch — tees, hats, socks and more.",
  alternates: { canonical: "/shop" },
};

export default async function ShopPage() {
  const products = await getShopProducts(50);

  return (
    <>
      <main className="min-h-screen bg-white">
        <BlendLogo />
        <BlendNav />
        <Header />
        <section className="mx-auto max-w-6xl px-6 pb-28 pt-36 md:pt-44">
          <h1 className="mb-10 text-center font-mono text-2xl font-normal tracking-tight text-black md:mb-14 md:text-3xl">
            <Proximate>shop omnia</Proximate>
          </h1>

          {products.length === 0 ? (
            <p className="text-center font-mono text-sm text-black/60">
              The shop is restocking — check back soon.
            </p>
          ) : (
            <ul className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 md:gap-x-8 md:gap-y-14">
              {products.map((product, i) => (
                <li key={product.id}>
                  <Link
                    href={product.url}
                    className="card-lift-hover group block rounded-sm"
                  >
                    <div className="mb-2 flex justify-center">
                      <span className="bg-[#FBCCF2] px-2 py-0.5 font-mono text-xs text-black">
                        <Proximate>{(product.type || "merch").toLowerCase()}</Proximate>
                      </span>
                    </div>
                    <div className="relative mb-3 aspect-square w-full overflow-hidden bg-[#f2f2f2]">
                      {product.image && (
                        <Image
                          src={product.image.url}
                          alt={product.image.alt}
                          fill
                          priority={i < 3}
                          sizes="(min-width: 768px) 33vw, 50vw"
                          className="object-cover transition-opacity group-hover:opacity-80"
                        />
                      )}
                      {!product.availableForSale && (
                        <span className="absolute left-2 top-2 bg-black px-2 py-0.5 font-mono text-xs text-white">
                          sold out
                        </span>
                      )}
                    </div>
                    <p className="min-h-[2.5rem] font-mono text-sm leading-5 text-black">
                      <Proximate>{product.title.toLowerCase()}</Proximate>
                    </p>
                    <p className="font-mono text-sm text-black/60">
                      <Proximate>{product.availableForSale ? product.price : "sold out"}</Proximate>
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
      <Footer />
    </>
  );
}
