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
      <section className="shop-section">
        <ProductCatalog products={products} />
      </section>
    </main>
  );
}
