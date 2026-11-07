"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import AddToBagButton from "@/components/store/add-to-bag-button";
import BuyNowButton from "@/components/store/buy-now-button";
import ProductGrid from "@/components/store/product-grid";
import ProductStock from "@/components/store/product-stock";
import ProductReviews from "@/components/store/product-reviews";
import { formatPrice, products, type Product } from "@/data/products";

export default function ProductDetail({ product }: { product: Product }) {
  const images = [product.image, ...(product.gallery ?? [])];
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const relatedProducts = products
    .filter((item) => item.id !== product.id)
    .slice(0, 3);

  useEffect(() => {
    if (!previewImage) return;
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setPreviewImage(null);
    }
    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [previewImage]);

  return (
    <main className="page-shell product-page">
      <nav className="breadcrumbs" aria-label="Breadcrumb">
        <Link href="/">Home</Link><span aria-hidden="true">/</span>
        <Link href="/shop">Shop</Link><span aria-hidden="true">/</span>
        <span aria-current="page">{product.name}</span>
      </nav>
      <section className="product-detail-layout">
        <div className="product-detail-gallery">
          <button
            className="product-detail-image"
            type="button"
            aria-haspopup="dialog"
            aria-label={product.name}
            style={{ backgroundImage: `url("${product.image}")` }}
            onClick={() => setPreviewImage(product.image)}
          >
            {product.note && <span className="product-note">{product.note}</span>}
            <span className="product-image-preview-hint">View photo</span>
          </button>
          {product.gallery && (
            <div className="product-detail-thumbnails" aria-label="Product views">
              {product.gallery.map((image, index) => (
                <button
                  className="product-detail-thumbnail"
                  key={image}
                  type="button"
                  aria-label={`${product.name} view ${index + 2}`}
                  style={{ backgroundImage: `url("${image}")` }}
                  onClick={() => setPreviewImage(image)}
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
          <BuyNowButton product={product} />
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
      <ProductReviews productId={product.id} />
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
      {previewImage && typeof document !== "undefined"
        ? createPortal(
            <div
              className="product-image-modal"
              role="dialog"
              aria-modal="true"
              aria-label={`${product.name} photo preview`}
              onClick={() => setPreviewImage(null)}
            >
              <button
                className="product-image-modal-close"
                type="button"
                aria-label="Close photo preview"
                onClick={() => setPreviewImage(null)}
              >
                ×
              </button>
              <div
                className="product-image-modal-content"
                onClick={(event) => event.stopPropagation()}
              >
                <Image
                  className="product-image-modal-photo"
                  alt={product.name}
                  src={previewImage}
                  width={1600}
                  height={1200}
                  sizes="(max-width: 980px) 100vw, 980px"
                />
                <div className="product-image-modal-controls">
                  {images.map((image, index) => (
                    <button
                      className={`product-image-modal-thumb${image === previewImage ? " active" : ""}`}
                      key={image}
                      type="button"
                      aria-label={`View photo ${index + 1}`}
                      aria-pressed={image === previewImage}
                      style={{ backgroundImage: `url("${image}")` }}
                      onClick={() => setPreviewImage(image)}
                    />
                  ))}
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}
    </main>
  );
}
