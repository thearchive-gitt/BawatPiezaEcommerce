"use client";

import { useState, type FormEvent } from "react";
import { apiFetch } from "@/lib/api";

export default function ContactForm() {
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setSubmitting(true);
    setError(null);

    try {
      await apiFetch("/api/v1/public/concerns", {
        method: "POST",
        body: JSON.stringify({
          name: formData.get("name"),
          email: formData.get("email"),
          message: formData.get("message"),
        }),
      });
      event.currentTarget.reset();
      setSubmitted(true);
    } catch (submissionError) {
      setError(
        submissionError instanceof Error
          ? submissionError.message
          : "Your concern could not be sent. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="contact-form" onSubmit={handleSubmit}>
      <label>
        Your name
        <input autoComplete="name" name="name" placeholder="How should we call you?" required />
      </label>
      <label>
        Email address
        <input autoComplete="email" name="email" placeholder="you@example.com" required type="email" />
      </label>
      <label>
        What&apos;s on your mind?
        <textarea name="message" placeholder="Tell us a little more..." required rows={5} />
      </label>
      <button className="button button-dark" disabled={submitting} type="submit">
        {submitting ? "Sending..." : submitted ? "Thanks for reaching out ✓" : "Send us a note"}
      </button>
      {submitted && (
        <p className="form-success" role="status">
          Your concern has been sent to our team. We&apos;ll get back to you within two business days.
        </p>
      )}
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
    </form>
  );
}
