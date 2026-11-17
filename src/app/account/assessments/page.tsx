import type { Metadata } from "next";
import Link from "next/link";
import AssessmentHistory from "@/components/store/assessment-history";

export const metadata: Metadata = {
  title: "My Site Assessments",
  description: "Track site feasibility requests and review BawatPieza project quotations.",
};

export default function AccountAssessmentsPage() {
  return (
    <main className="page-shell orders-page">
      <section className="page-intro orders-intro">
        <p className="eyebrow">YOUR PROJECTS</p>
        <h1>Site assessments.</h1>
        <p>Track feasibility reviews, site visits, and project-specific quotations.</p>
      </section>
      <nav aria-label="Account navigation" className="account-page-nav">
        <Link href="/account">Profile</Link>
        <Link aria-current="page" className="is-active" href="/account/assessments">Site assessments</Link>
        <Link href="/account/payments">Payments</Link>
        <Link href="/contact">Support</Link>
      </nav>
      <AssessmentHistory />
    </main>
  );
}
