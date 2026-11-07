import type { Metadata } from "next";
import { Suspense } from "react";
import CheckoutForm from "@/components/store/checkout-form";

export const metadata: Metadata = {
  title: "Checkout",
  description: "Review your Bawat Pieza order and choose a payment method.",
};

export default function CheckoutPage() {
  return (
    <main className="page-shell checkout-page">
      <section className="page-intro checkout-intro">
        <p className="eyebrow">SECURE YOUR COMPONENTS</p>
        <h1>Checkout.</h1>
        <p>Sign in to save your order details, enter delivery details, and choose how to pay.</p>
      </section>
      <Suspense fallback={<p className="storage-message">Loading checkout...</p>}>
        <CheckoutForm />
      </Suspense>
    </main>
  );
}
