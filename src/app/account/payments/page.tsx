import type { Metadata } from "next";
import Link from "next/link";
import PaymentHistory from "@/components/store/payment-history";

export const metadata: Metadata = {
  title: "Project Payments",
  description: "Submit project downpayment and balance proofs and track payment verification.",
};

export default function AccountPaymentsPage() {
  return (
    <main className="page-shell orders-page">
      <section className="page-intro orders-intro">
        <p className="eyebrow">YOUR PROJECTS</p>
        <h1>Project payments.</h1>
        <p>Submit payment proof and track admin verification for your project quotations.</p>
      </section>
      <nav aria-label="Account navigation" className="account-page-nav">
        <Link href="/account">Profile</Link>
        <Link href="/account/assessments">Site assessments</Link>
        <Link aria-current="page" className="is-active" href="/account/payments">Payments</Link>
        <Link href="/contact">Support</Link>
      </nav>
      <PaymentHistory />
    </main>
  );
}
