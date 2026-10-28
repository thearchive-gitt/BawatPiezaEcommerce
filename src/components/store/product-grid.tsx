import ProductCard from "@/components/store/product-card";
import type { Product } from "@/data/products";

export default function ProductGrid({
  products,
  columns,
}: {
  products: Product[];
  columns?: 3 | 4;
}) {
  return (
    <div className={`product-grid${columns ? ` product-grid-${columns}` : ""}`}>
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
