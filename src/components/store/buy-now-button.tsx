"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/components/auth-provider";
import { useCart, type PaymentMethod } from "@/components/store/cart-provider";
import { formatPrice, type Product } from "@/data/products";

export default function BuyNowButton({ product }: { product: Product }) {
  const router = useRouter();
  const { availableStock, buyNow } = useCart();
  const { user, loading } = useAuth();
  const [open, setOpen] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cod");
  const stock = availableStock(product.id);

  function openPurchase() {
    if (!user) {
      router.push(`/login?redirectTo=${encodeURIComponent(`/shop/${product.id}`)}`);
      return;
    }
    setQuantity(1);
    setOpen(true);
  }

  function continueToCheckout() {
    if (stock < 1) return;
    buyNow(product, quantity);
    router.push(`/checkout?paymentMethod=${paymentMethod}`);
  }

  return (
    <>
      <button
        className="button button-outline buy-now-button"
        disabled={loading || stock < 1}
        onClick={openPurchase}
        type="button"
      >
        {stock < 1 ? "Out of stock" : "Buy now"} <span aria-hidden="true">↗</span>
      </button>
      {open && (
        <div
          aria-labelledby="buy-now-title"
          aria-modal="true"
          className="buy-now-modal"
          role="dialog"
          onClick={() => setOpen(false)}
        >
          <div className="buy-now-modal-card" onClick={(event) => event.stopPropagation()}>
            <button
              aria-label="Close buy now dialog"
              className="buy-now-close"
              onClick={() => setOpen(false)}
              type="button"
            >
              ×
            </button>
            <p className="eyebrow">QUICK CHECKOUT</p>
            <h2 id="buy-now-title">Buy {product.name}</h2>
            <p className="buy-now-description">
              Choose how many tiles you need and how you want to pay.
            </p>
            <div className="buy-now-quantity">
              <span>Quantity</span>
              <div>
                <button
                  aria-label="Decrease quantity"
                  disabled={quantity <= 1}
                  onClick={() => setQuantity((value) => Math.max(1, value - 1))}
                  type="button"
                >
                  −
                </button>
                <strong>{quantity}</strong>
                <button
                  aria-label="Increase quantity"
                  disabled={quantity >= stock}
                  onClick={() => setQuantity((value) => Math.min(stock, value + 1))}
                  type="button"
                >
                  +
                </button>
              </div>
            </div>
            <p className="buy-now-total">
              {formatPrice(product.price * quantity)}
              <span>{quantity} tile{quantity === 1 ? "" : "s"}</span>
            </p>
            <div className="buy-now-payment">
              <span>Payment method</span>
              <label>
                <input
                  checked={paymentMethod === "cod"}
                  name="buy-now-payment"
                  onChange={() => setPaymentMethod("cod")}
                  type="radio"
                />
                Cash on delivery
              </label>
              <label>
                <input
                  checked={paymentMethod === "gcash"}
                  name="buy-now-payment"
                  onChange={() => setPaymentMethod("gcash")}
                  type="radio"
                />
                GCash via PayMongo
              </label>
            </div>
            <button className="button button-dark buy-now-continue" onClick={continueToCheckout} type="button">
              Continue to checkout <span aria-hidden="true">→</span>
            </button>
          </div>
        </div>
      )}
    </>
  );
}
