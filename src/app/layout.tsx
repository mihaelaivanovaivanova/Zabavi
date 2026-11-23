import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
import { CartProvider } from "@/lib/CartContext";
import { CookieConsentProvider } from "@/lib/CookieConsentContext";
import { CookieConsent } from "@/components/legal/CookieConsent";
import { MetaPixelLoader } from "@/components/legal/MetaPixelLoader";
import { siteConfig } from "@/config/site";
import "./globals.css";

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin", "cyrillic"],
});

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.brand.url),
  title: {
    default: `${siteConfig.brand.name} — ${siteConfig.brand.tagline}`,
    template: `%s — ${siteConfig.brand.name}`,
  },
  description: siteConfig.brand.description,
  openGraph: {
    title: siteConfig.brand.name,
    description: siteConfig.brand.description,
    locale: "bg_BG",
    type: "website",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="bg" className={`${montserrat.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <CartProvider>
          <CookieConsentProvider>
            {children}
            <CookieConsent />
            <MetaPixelLoader />
          </CookieConsentProvider>
        </CartProvider>
      </body>
    </html>
  );
}
