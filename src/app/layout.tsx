import type { Metadata } from "next";
import AuthProvider from "@/components/auth-provider";
import CartProvider from "@/components/store/cart-provider";
import SiteFooter from "@/components/site-footer";
import SiteHeader from "@/components/site-header";
import ChatWidget from "@/components/store/chat-widget";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: {
    default: "Kinetic Energy Harvesting Floor Tiles | Bawat Pieza",
    template: "%s | Bawat Pieza",
  },
  description:
    "Explore Bawat Pieza kinetic energy harvesting floor tiles with piezo dynamo technology, foot traffic analytics, and grid-connected energy solutions for commercial spaces.",
  keywords: [
    "kinetic energy harvesting floor tiles",
    "piezo dynamo technology",
    "foot traffic analytics",
    "commercial energy savings",
    "smart city energy infrastructure",
  ],
  openGraph: {
    type: "website",
    siteName: "Bawat Pieza",
    title: "Kinetic Energy Harvesting Floor Tiles | Bawat Pieza",
    description:
      "Capture energy from every step and turn foot traffic into measurable infrastructure value.",
    images: [{ url: "/products/hero-piezo-side-view.png", width: 1200, height: 900, alt: "Bawat Pieza kinetic energy harvesting floor tile" }],
  },
  icons: {
    icon: "/LOGO4.png",
    shortcut: "/LOGO4.png",
    apple: "/LOGO4.png",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body suppressHydrationWarning>
        <AuthProvider>
          <CartProvider>
            <SiteHeader />
            {children}
            <SiteFooter />
            <ChatWidget />
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
