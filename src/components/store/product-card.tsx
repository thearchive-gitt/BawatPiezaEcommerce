import Link from "next/link";
import BuyNowButton from "@/components/store/buy-now-button";
import type { Product } from "@/data/products";

export default function ProductCard({ product }: { product: Product }) {
  return (
    <article className="product-card">
      <Link
        className="product-image product-image-link"
        href={`/shop/${product.id}`}
        aria-label={`View ${product.name} details`}
        style={{ backgroundImage: `url("${product.image}")` }}
      >
        {product.note && <span className="product-note">{product.note}</span>}
      </Link>
      <div className="product-details">
        <div>
          <p className="product-category">{product.category}</p>
          <h3><Link href={`/shop/${product.id}`}>{product.name}</Link></h3>
        </div>
        <span className="product-price">Quoted after site visit</span>
      </div>
      <BuyNowButton product={product} />
    </article>
  );
}
