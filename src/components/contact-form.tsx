"use client";

import { useState, type FormEvent } from "react";

export default function ContactForm() {
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const subject = `A note from ${formData.get("name")}`;
    const body = [
      `Name: ${formData.get("name")}`,
      `Email: ${formData.get("email")}`,
      "",
      String(formData.get("message")),
    ].join("\n");
    window.location.href = `mailto:energy@bawatpieza.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    setSubmitted(true);
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
      <button className="button button-dark" type="submit">
        {submitted ? "Thanks for reaching out ✓" : "Send us a note"}
      </button>
      {submitted && (
        <p className="form-success" role="status">
          Your email app should open with your message ready to send.
        </p>
      )}
    </form>
  );
}
