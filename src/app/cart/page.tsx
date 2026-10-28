"use client";

import Link from "next/link";
import { useCart } from "@/components/store/cart-provider";
import { formatPrice } from "@/data/products";

export default function CartPage() {
  const {
    items,
    itemCount,
    subtotal,
    shipping,
    total,
    storageMessage,
    availableStock,
    removeItem,
    setQuantity,
  } = useCart();

  return (
    <main className="page-shell cart-page">
      <section className="page-intro cart-intro">
        <p className="eyebrow">KINETIC ENERGY SYSTEMS</p>
        <h1>Your cart<span className="cart-total-count"> ({itemCount})</span></h1>
      </section>
      {storageMessage && <p className="storage-message" role="status">{storageMessage}</p>}
      {items.length === 0 ? (
        <section className="empty-cart">
          <span className="empty-cart-mark" aria-hidden="true">⌁</span>
          <h2>Your energy system starts here.</h2>
          <p>Add a kinetic tile or a compatible component to get started.</p>
          <Link className="button button-dark" href="/shop">Browse components <span aria-hidden="true">↗</span></Link>
        </section>
      ) : (
        <section className="cart-layout">
          <div className="cart-items">
            {items.map(({ product, quantity }) => (
              <article className="cart-item" key={product.id}>
                <div
                  className="cart-item-image"
                  role="img"
                  aria-label={product.name}
                  style={{ backgroundImage: `url("${product.image}")` }}
                />
                <div className="cart-item-info">
                  <p className="product-category">{product.category}</p>
                  <h2>{product.name}</h2>
                  <span className="cart-stock">{availableStock(product.id)} in stock</span>
                  <button className="remove-link" onClick={() => removeItem(product.id)} type="button">Remove</button>
                </div>
                <div className="quantity-control" aria-label={`Quantity for ${product.name}`}>
                  <button
                    onClick={() => setQuantity(product.id, quantity - 1)}
                    type="button"
                    aria-label="Decrease quantity"
                    disabled={quantity <= 1}
                  >
                    −
                  </button>
                  <span>{quantity}</span>
                  <button
                    onClick={() => setQuantity(product.id, quantity + 1)}
                    type="button"
                    aria-label="Increase quantity"
                    disabled={quantity >= availableStock(product.id)}
                  >
                    +
                  </button>
                </div>
                <span className="cart-item-price">{formatPrice(product.price * quantity)}</span>
              </article>
            ))}
          </div>
          <aside className="order-summary">
            <p className="eyebrow">ORDER SUMMARY</p>
            <div className="summary-line"><span>Subtotal</span><span>{formatPrice(subtotal)}</span></div>
            <div className="summary-line"><span>Delivery</span><span>{shipping === 0 ? "Free" : formatPrice(shipping)}</span></div>
            <div className="summary-total"><span>Total</span><strong>{formatPrice(total)}</strong></div>
            <Link className="button button-dark checkout-button" href="/checkout">
              Continue to checkout <span aria-hidden="true">→</span>
            </Link>
            <p className="summary-note">Free delivery over ₱5,000. Demo checkout does not process a payment.</p>
          </aside>
        </section>
      )}
    </main>
  );
}
