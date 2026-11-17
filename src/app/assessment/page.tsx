import type { Metadata } from "next";
import { Suspense } from "react";
import SiteAssessmentForm from "@/components/store/site-assessment-form";

export const metadata: Metadata = {
  title: "Request a Site Assessment",
  description: "Submit your installation details for a BawatPieza feasibility review and project quotation.",
};

export default function AssessmentPage() {
  return (
    <main className="page-shell checkout-page">
      <section className="page-intro checkout-intro">
        <p className="eyebrow">PLAN YOUR INSTALLATION</p>
        <h1>Request a site assessment.</h1>
        <p>Every BawatPieza installation begins with an on-site feasibility review. No purchase is made by submitting this form.</p>
      </section>
      <Suspense fallback={<p className="storage-message">Loading assessment form…</p>}>
        <SiteAssessmentForm />
      </Suspense>
    </main>
  );
}
