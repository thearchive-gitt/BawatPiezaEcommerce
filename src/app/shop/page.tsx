import type { Metadata } from "next";
import ProductCatalog from "@/components/store/product-catalog";
import { products } from "@/data/products";

export const metadata: Metadata = {
  title: "Energy-harvesting components",
  description:
    "Shop Bawat Pieza kinetic floor tiles, piezoelectric components, dynamo modules, and energy controllers.",
};

export default function ShopPage() {
  return (
    <main className="page-shell">
      <section className="page-intro shop-intro">
        <p className="eyebrow">BAWAT PIEZA · KINETIC ENERGY SYSTEMS</p>
        <h1>Make every step count.</h1>
        <p>
          Explore modular floor tiles and the piezoelectric and dynamo
          components that turn movement into usable energy.
        </p>
      </section>
      <section className="shop-section">
        <ProductCatalog products={products} />
      </section>
    </main>
  );
}
