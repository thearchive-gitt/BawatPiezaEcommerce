import type { Metadata } from "next";
import AuthProvider from "@/components/auth-provider";
import CartProvider from "@/components/store/cart-provider";
import SiteFooter from "@/components/site-footer";
import SiteHeader from "@/components/site-header";
import ChatWidget from "@/components/store/chat-widget";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Bawat Pieza — Kinetic energy from every step",
    template: "%s | Bawat Pieza",
  },
  description:
    "Explore Bawat Pieza piezoelectric kinetic floor tiles, dynamo modules, energy controllers, and components.",
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
