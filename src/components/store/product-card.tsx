import Link from "next/link";
import AddToBagButton from "@/components/store/add-to-bag-button";
import ProductStock from "@/components/store/product-stock";
import { formatPrice, type Product } from "@/data/products";

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
        <span className="product-price">{formatPrice(product.price)}</span>
      </div>
      <ProductStock productId={product.id} />
      <AddToBagButton product={product} />
    </article>
  );
}
