import type { Metadata } from "next";
import CheckoutForm from "@/components/store/checkout-form";

export const metadata: Metadata = {
  title: "Checkout",
  description: "Review your Bawat Pieza demo order.",
};

export default function CheckoutPage() {
  return (
    <main className="page-shell checkout-page">
      <section className="page-intro checkout-intro">
        <p className="eyebrow">SECURE YOUR COMPONENTS</p>
        <h1>Checkout.</h1>
        <p>Sign in to save your order details, then enter delivery details. No payment is processed.</p>
      </section>
      <CheckoutForm />
    </main>
  );
}
