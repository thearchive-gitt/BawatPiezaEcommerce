import type { Metadata } from "next";
import ContactForm from "@/components/contact-form";

export const metadata: Metadata = {
  title: "Contact",
  description: "Questions about Bawat Pieza kinetic energy tiles, components, or orders?",
};

export default function ContactPage() {
  return (
    <main className="page-shell contact-page">
      <section className="page-intro contact-intro">
        <p className="eyebrow">WE’RE HERE FOR YOU</p>
        <h1>Let&apos;s talk.</h1>
        <p>Questions about tile installation, components, or an order? We&apos;d love to hear from you.</p>
      </section>
      <section className="contact-content">
        <div className="contact-aside">
          <p className="eyebrow">GET IN TOUCH</p>
          <h2>A real person,<br />always.</h2>
          <p>Tell us about your project or ask a question about our kinetic energy system. We usually reply within two business days.</p>
          <a className="contact-email" href="mailto:energy@bawatpieza.com">energy@bawatpieza.com <span aria-hidden="true">↗</span></a>
          <div className="contact-hours">
            <span>STUDIO HOURS</span>
            <p>Monday–Friday<br />9:00 AM–5:00 PM PHT</p>
          </div>
        </div>
        <ContactForm />
      </section>
    </main>
  );
}
