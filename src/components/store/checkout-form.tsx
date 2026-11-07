"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";
import { useCart, type PaymentMethod } from "@/components/store/cart-provider";
import { useAuth } from "@/components/auth-provider";
import { formatPrice } from "@/data/products";
import PaymentResultModal from "@/components/store/payment-result-modal";
import LoadingTile from "@/components/ui/loading-tile";

export default function CheckoutForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { items, subtotal, shipping, total, placeOrder, storageMessage, hasUnavailableItems } =
    useCart();
  const { user, account, loading } = useAuth();
  const [formError, setFormError] = useState("");
  const paymentCancelled = searchParams.get("payment") === "cancelled";
  const requestedPaymentMethod = searchParams.get("paymentMethod");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(
    requestedPaymentMethod === "gcash" ? "gcash" : "cod",
  );
  const accountName = [account?.firstname, account?.middlename, account?.lastname]
    .filter(Boolean)
    .join(" ");
  const profileAddress =
    account?.address ||
    (typeof user?.user_metadata?.address === "string"
      ? user.user_metadata.address
      : "");
  const profileCity =
    account?.city ||
    (typeof user?.user_metadata?.city === "string"
      ? user.user_metadata.city
      : "");
  const profilePostalCode =
    account?.postal_code ||
    (typeof user?.user_metadata?.postalCode === "string"
      ? user.user_metadata.postalCode
      : "");
  const profileLandmark = account?.landmark ?? "";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const customer = {
      name: String(formData.get("name")).trim(),
      email: String(formData.get("email")).trim(),
      phone: String(formData.get("phone")).trim(),
      address: String(formData.get("address")).trim(),
      city: String(formData.get("city")).trim(),
      postalCode: String(formData.get("postalCode")).trim(),
      landmark: String(formData.get("landmark")).trim(),
    };
    try {
      const result = await placeOrder(customer, paymentMethod);
      if (!result) throw new Error("Your order could not be created.");
      if (result.checkoutUrl) {
        window.location.assign(result.checkoutUrl);
        return;
      }
      router.push(`/orders#${result.order.id}`);
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Your order could not be created.");
    }
  }

  if (loading) {
    return <div className="checkout-loading"><LoadingTile label="Loading checkout" detail="Preparing your saved contact and delivery details." /></div>;
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
    <>
      <div className="checkout-layout">
      <form className="checkout-form" onSubmit={handleSubmit}>
        <section className="checkout-section">
          <p className="eyebrow">01 / CONTACT</p>
          <h2>Who should we contact?</h2>
          <div className="checkout-fields">
            <label>
              Full name
              <input
                autoComplete="name"
                defaultValue={accountName}
                name="name"
                required
              />
            </label>
            <label>
              Email address
              <input
                autoComplete="email"
                defaultValue={account?.email || user.email}
                name="email"
                required
                type="email"
              />
            </label>
            <label>
              Phone number
              <input
                autoComplete="tel"
                defaultValue={account?.contactNo ?? ""}
                name="phone"
                required
                type="tel"
              />
            </label>
          </div>
        </section>
        <section className="checkout-section">
          <p className="eyebrow">02 / DELIVERY</p>
          <h2>Where should we send it?</h2>
          <div className="checkout-fields">
            <label className="field-wide">
              Street address
              <input
                autoComplete="street-address"
                defaultValue={profileAddress}
                name="address"
                required
              />
            </label>
            <label>
              City / Municipality
              <input
                autoComplete="address-level2"
                defaultValue={profileCity}
                name="city"
                required
              />
            </label>
            <label>
              Postal code
              <input
                autoComplete="postal-code"
                defaultValue={profilePostalCode}
                name="postalCode"
                required
              />
            </label>
            <label className="field-wide">
              Landmark or delivery instructions
              <textarea defaultValue={profileLandmark} name="landmark" rows={3} />
            </label>
          </div>
        </section>
        <section className="checkout-section demo-payment">
          <p className="eyebrow">03 / PAYMENT</p>
          <h2>Choose how to pay.</h2>
          <div className="payment-methods">
            <label className={`payment-method${paymentMethod === "cod" ? " is-selected" : ""}`}>
              <input
                checked={paymentMethod === "cod"}
                name="paymentMethod"
                onChange={() => setPaymentMethod("cod")}
                type="radio"
                value="cod"
              />
              <span>
                <strong>Cash on delivery</strong>
                <small>Pay when your order arrives.</small>
              </span>
            </label>
            <label className={`payment-method${paymentMethod === "gcash" ? " is-selected" : ""}`}>
              <input
                checked={paymentMethod === "gcash"}
                name="paymentMethod"
                onChange={() => setPaymentMethod("gcash")}
                type="radio"
                value="gcash"
              />
              <span>
                <strong>GCash</strong>
                <small>Pay securely through PayMongo.</small>
              </span>
            </label>
          </div>
        </section>
        {storageMessage && <p className="storage-message" role="status">{storageMessage}</p>}
        {hasUnavailableItems && (
          <p className="auth-status" role="alert">
            One or more items are out of stock. Remove unavailable items from your bag before placing an order.
          </p>
        )}
        {formError && <p className="auth-status" role="alert">{formError}</p>}
        <button className="button button-dark place-order-button" disabled={hasUnavailableItems} type="submit">
        {paymentMethod === "gcash" ? "Continue to GCash" : "Place order"} <span aria-hidden="true">→</span>
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
      {paymentCancelled && (
        <PaymentResultModal
          closePath="/checkout"
          kind="error"
          message="Your GCash payment was cancelled or declined. No payment was recorded. You can try again or choose cash on delivery."
          title="Payment was not completed."
        />
      )}
      {formError && (
        <PaymentResultModal
          closePath="/checkout"
          kind="error"
          message={formError}
          title={paymentMethod === "cod" ? "We could not place the order." : "We could not start the payment."}
        />
      )}
    </>
  );
}
