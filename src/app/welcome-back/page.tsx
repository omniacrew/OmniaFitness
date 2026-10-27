import type { Metadata } from "next";
import Header from "@/components/Header";
import BlendLogo from "@/components/BlendLogo";
import BlendNav from "@/components/BlendNav";
import Footer from "@/components/Footer";
import Proximate from "@/components/variable-proximity/Proximate";
import WelcomeBackForm from "@/components/WelcomeBackForm";

export const metadata: Metadata = {
  title: "Welcome back",
  description:
    "Whether it's been six months or six years, the door's open. Tell us where you're at and we'll reach out.",
  // Campaign landing page: reached from email, not search.
  robots: { index: false, follow: true },
};

export default function WelcomeBackPage() {
  return (
    <>
      <main className="min-h-screen bg-white">
        <BlendLogo />
        <BlendNav />
        <Header />
        <section className="mx-auto grid max-w-5xl gap-10 px-6 pb-24 pt-32 md:grid-cols-2 md:gap-14 md:pt-40">
          <div className="flex flex-col gap-6">
            <h1 className="font-mono text-3xl font-normal tracking-tight text-black md:text-4xl">
              <Proximate>welcome back.</Proximate>
            </h1>
            <p className="font-mono text-sm leading-relaxed text-black md:text-base">
              Whether it&apos;s been six months or six years, the door&apos;s
              open. No pressure, no pitch. Tell us a little about where
              you&apos;re at and Jason or MK will reach out to set up a time for you to come back in.
            </p>
            <p className="font-mono text-sm leading-relaxed text-black/70 md:text-base">
              Still in Denver. Still at 901 S. Jason Street. Show up. Be real.
              Get strong.
            </p>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/welcome-popup-training.png"
              alt="Omnia members training during class"
              className="hidden w-full rounded-xl border-2 border-black object-cover md:block"
            />
          </div>
          <div>
            <WelcomeBackForm />
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
