import type { Metadata } from "next";
import AuthProvider from "@/components/auth-provider";
import CartProvider from "@/components/store/cart-provider";
import CursorGrid from "@/components/ui/cursor-grid";
import SiteFooter from "@/components/site-footer";
import SiteHeader from "@/components/site-header";
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
      <body>
        <AuthProvider>
          <CartProvider>
            <SiteHeader />
            {children}
            <SiteFooter />
            <CursorGrid
              className="cursor-grid--page"
              cellSize={64}
              color="#e47b3f"
              gridColor="#c66d3d"
              radius={140}
              holdTime={350}
              fadeDuration={750}
              fillOpacity={0.025}
              gridOpacity={0.035}
              spotlight={0.48}
              clickPulse
              dpr={1.25}
            />
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
