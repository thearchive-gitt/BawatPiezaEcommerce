"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { useCart } from "@/components/store/cart-provider";
import { useAuth } from "@/components/auth-provider";
import { formatPrice } from "@/data/products";

export default function CheckoutForm() {
  const router = useRouter();
  const { items, subtotal, shipping, total, placeOrder, storageMessage } =
    useCart();
  const { user, loading } = useAuth();
  const [formError, setFormError] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const customer = {
      name: String(formData.get("name")).trim(),
      email: String(formData.get("email")).trim(),
      phone: String(formData.get("phone")).trim(),
      address: String(formData.get("address")).trim(),
      city: String(formData.get("city")).trim(),
      postalCode: String(formData.get("postalCode")).trim(),
    };
    const order = placeOrder(customer);
    if (!order) {
      setFormError("Your order could not be created. Please check your bag and try again.");
      return;
    }
    router.push(`/orders#${order.id}`);
  }

  if (loading) {
    return <div className="checkout-empty"><p className="storage-message">Loading your account…</p></div>;
  }

  if (!user) {
    return (
      <div className="checkout-empty">
        <h2>Sign in before checkout.</h2>
        <p>Your account is required to save and access order details.</p>
        <Link className="button button-dark" href="/login">Sign in <span aria-hidden="true">→</span></Link>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="checkout-empty">
        <h2>Your bag is empty.</h2>
        <p>Add a tile or a compatible component before checkout.</p>
        <Link className="button button-dark" href="/shop">Browse components <span aria-hidden="true">→</span></Link>
      </div>
    );
  }

  return (
    <div className="checkout-layout">
      <form className="checkout-form" onSubmit={handleSubmit}>
        <section className="checkout-section">
          <p className="eyebrow">01 / CONTACT</p>
          <h2>Who should we contact?</h2>
          <div className="checkout-fields">
            <label>
              Full name
              <input autoComplete="name" name="name" required />
            </label>
            <label>
              Email address
              <input autoComplete="email" name="email" required type="email" />
            </label>
            <label>
              Phone number
              <input autoComplete="tel" name="phone" required type="tel" />
            </label>
          </div>
        </section>
        <section className="checkout-section">
          <p className="eyebrow">02 / DELIVERY</p>
          <h2>Where should we send it?</h2>
          <div className="checkout-fields">
            <label className="field-wide">
              Street address
              <input autoComplete="street-address" name="address" required />
            </label>
            <label>
              City / Municipality
              <input autoComplete="address-level2" name="city" required />
            </label>
            <label>
              Postal code
              <input autoComplete="postal-code" name="postalCode" required />
            </label>
          </div>
        </section>
        <section className="checkout-section demo-payment">
          <p className="eyebrow">03 / PAYMENT</p>
          <h2>Demo checkout</h2>
          <p>
            This prototype does not process payments or send orders to a
            fulfillment service. No charge will be made.
          </p>
          <label className="demo-confirmation">
            <input name="demoAcknowledgement" required type="checkbox" />
            <span>I understand this is a demo order with no payment.</span>
          </label>
        </section>
        {storageMessage && <p className="storage-message" role="status">{storageMessage}</p>}
        {formError && <p className="auth-status" role="alert">{formError}</p>}
        <button className="button button-dark place-order-button" type="submit">
          Place demo order <span aria-hidden="true">→</span>
        </button>
      </form>

      <aside className="order-summary checkout-summary">
        <p className="eyebrow">YOUR ORDER</p>
        <div className="checkout-line-items">
          {items.map(({ product, quantity }) => (
            <div className="checkout-line-item" key={product.id}>
              <span>{product.name} <span>× {quantity}</span></span>
              <strong>{formatPrice(product.price * quantity)}</strong>
            </div>
          ))}
        </div>
        <div className="summary-line"><span>Subtotal</span><span>{formatPrice(subtotal)}</span></div>
        <div className="summary-line"><span>Delivery</span><span>{shipping === 0 ? "Free" : formatPrice(shipping)}</span></div>
        <div className="summary-total"><span>Total</span><strong>{formatPrice(total)}</strong></div>
        <p className="summary-note">Free delivery on orders of ₱5,000 or more.</p>
      </aside>
    </div>
  );
}
