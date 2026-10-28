import Link from "next/link";
import AddToBagButton from "@/components/store/add-to-bag-button";
import ProductGrid from "@/components/store/product-grid";
import ProductStock from "@/components/store/product-stock";
import { formatPrice, products, type Product } from "@/data/products";

export default function ProductDetail({ product }: { product: Product }) {
  const relatedProducts = products
    .filter((item) => item.id !== product.id)
    .slice(0, 3);

  return (
    <main className="page-shell product-page">
      <nav className="breadcrumbs" aria-label="Breadcrumb">
        <Link href="/">Home</Link><span aria-hidden="true">/</span>
        <Link href="/shop">Shop</Link><span aria-hidden="true">/</span>
        <span aria-current="page">{product.name}</span>
      </nav>
      <section className="product-detail-layout">
        <div className="product-detail-gallery">
          <div
            className="product-detail-image"
            role="img"
            aria-label={product.name}
            style={{ backgroundImage: `url("${product.image}")` }}
          >
            {product.note && <span className="product-note">{product.note}</span>}
          </div>
          {product.gallery && (
            <div className="product-detail-thumbnails" aria-label="Product views">
              {product.gallery.map((image, index) => (
                <div
                  className="product-detail-thumbnail"
                  key={image}
                  role="img"
                  aria-label={`${product.name} view ${index + 2}`}
                  style={{ backgroundImage: `url("${image}")` }}
                />
              ))}
            </div>
          )}
        </div>
        <div className="product-detail-copy">
          <p className="eyebrow">{product.category.toUpperCase()}</p>
          <h1>{product.name}</h1>
          <p className="detail-price">{formatPrice(product.price)} <span>PHP</span></p>
          <ProductStock detail productId={product.id} />
          <p className="detail-description">{product.description}</p>
          <AddToBagButton product={product} />
          <p className="detail-shipping">
            Secure demo checkout · ₱250 shipping, free on orders over ₱5,000
          </p>
          <div className="specification-section">
            <h2>Technical specifications</h2>
            <dl className="specification-list">
              {product.specifications.map((specification) => (
                <div key={specification.label}>
                  <dt>{specification.label}</dt>
                  <dd>{specification.value}</dd>
                </div>
              ))}
            </dl>
          </div>
          <p className="prototype-note">
            Energy-harvesting output is variable. Peak figures are indicative
            prototype estimates, not guaranteed continuous power ratings.
          </p>
        </div>
      </section>
      {relatedProducts.length > 0 && (
        <section className="related-products">
          <div className="section-heading">
            <div>
              <p className="eyebrow">BUILD YOUR SYSTEM</p>
              <h2>Compatible components.</h2>
            </div>
            <Link className="text-link" href="/shop">View all <span aria-hidden="true">→</span></Link>
          </div>
          <ProductGrid products={relatedProducts} />
        </section>
      )}
    </main>
  );
}
