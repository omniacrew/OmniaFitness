import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import { Gruppo } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { BookingProvider } from "@/context/BookingContext";
import { NewsletterBannerProvider } from "@/context/NewsletterBannerContext";
import { WelcomeModalProvider } from "@/context/WelcomeModalContext";
import { CartProvider } from "@/context/CartContext";
import CartDrawer from "@/components/shop/CartDrawer";
import BookingModal from "@/components/BookingModal";
import SmoothScroll from "@/components/SmoothScroll";
import WelcomeModal from "@/components/WelcomeModal";
import { VariableProximityRoot } from "@/components/variable-proximity/VariableProximityRoot";

const gruppo = Gruppo({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-gruppo",
});

const SITE_NAME = "Omnia Fitness Collective";
const SITE_URL = "https://omniafitco.com";
const SITE_DESCRIPTION =
  "Your goals. Your lifestyle. Omnia. A CrossFit gym dedicated to helping you achieve your fitness goals.";
const SHARE_IMAGE = {
  url: "/bottom.jpg",
  width: 2500,
  height: 1184,
  alt: "Omnia Fitness Collective gym in Denver",
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} | Show up. Be real. Get strong.`,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  openGraph: {
    type: "website",
    locale: "en_US",
    url: SITE_URL,
    siteName: SITE_NAME,
    title: `${SITE_NAME} | Show up. Be real. Get strong.`,
    description: SITE_DESCRIPTION,
    images: [SHARE_IMAGE],
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} | Show up. Be real. Get strong.`,
    description: SITE_DESCRIPTION,
    images: [SHARE_IMAGE.url],
  },
};

export const viewport: Viewport = {
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const organizationJsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_NAME,
    url: SITE_URL,
    logo: `${SITE_URL}/omnia-o.png`,
  };

  const websiteJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: SITE_URL,
  };

  return (
    <html lang="en">
      <head>
        <Script
          id="google-tag-manager"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','GTM-W7HDMQSZ');`,
          }}
        />
        <Script
          id="google-gtag"
          src="https://www.googletagmanager.com/gtag/js?id=AW-18229379592"
          strategy="beforeInteractive"
        />
        <Script
          id="google-gtag-init"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', 'AW-18229379592');`,
          }}
        />
      </head>
      <body className={`${gruppo.variable} font-mono antialiased`}>
        <noscript>
          <iframe
            src="https://www.googletagmanager.com/ns.html?id=GTM-W7HDMQSZ"
            height="0"
            width="0"
            style={{ display: "none", visibility: "hidden" }}
          />
        </noscript>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify([organizationJsonLd, websiteJsonLd]),
          }}
        />
        <SmoothScroll>
        <Script
          id="klaviyo-init"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html:
              "!function(){if(!window.klaviyo){window._klOnsite=window._klOnsite||[];try{window.klaviyo=new Proxy({},{get:function(n,i){return\"push\"===i?function(){var n;(n=window._klOnsite).push.apply(n,arguments)}:function(){for(var n=arguments.length,o=new Array(n),w=0;w<n;w++)o[w]=arguments[w];var t=\"function\"==typeof o[o.length-1]?o.pop():void 0,e=new Promise((function(n){window._klOnsite.push([i].concat(o,[function(i){t&&t(i),n(i)}]))}));return e}}})}catch(n){window.klaviyo=window.klaviyo||[],window.klaviyo.push=function(){var n;(n=window._klOnsite).push.apply(n,arguments)}}}}();",
          }}
        />
        <Script
          src="https://static.klaviyo.com/onsite/js/We668q/klaviyo.js?company_id=We668q"
          strategy="afterInteractive"
        />
        <BookingProvider>
          <CartProvider>
          <WelcomeModalProvider>
            <VariableProximityRoot>
              <NewsletterBannerProvider>
                {children}
                <Suspense fallback={null}>
                  <WelcomeModal />
                </Suspense>
                <BookingModal />
                <CartDrawer />
              </NewsletterBannerProvider>
            </VariableProximityRoot>
          </WelcomeModalProvider>
          </CartProvider>
        </BookingProvider>
        </SmoothScroll>
      </body>
    </html>
  );
}
