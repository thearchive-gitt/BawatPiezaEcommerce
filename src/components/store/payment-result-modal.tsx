"use client";

import { useRouter } from "next/navigation";

type PaymentResultModalProps = {
  kind: "success" | "error";
  title: string;
  message: string;
  closePath: string;
};

export default function PaymentResultModal({
  kind,
  title,
  message,
  closePath,
}: PaymentResultModalProps) {
  const router = useRouter();

  return (
    <div className="payment-result-modal" role="dialog" aria-modal="true" aria-labelledby="payment-result-title">
      <div className="payment-result-card">
        <button
          aria-label="Close payment message"
          className="buy-now-close"
          onClick={() => router.replace(closePath)}
          type="button"
        >
          ×
        </button>
        <span className={`payment-result-icon ${kind}`} aria-hidden="true">
          {kind === "success" ? "✓" : "!"}
        </span>
        <p className="eyebrow">{kind === "success" ? "PAYMENT CONFIRMED" : "PAYMENT NOT COMPLETED"}</p>
        <h2 id="payment-result-title">{title}</h2>
        <p>{message}</p>
        <button className="button button-dark" onClick={() => router.replace(closePath)} type="button">
          {kind === "success" ? "View my orders" : "Return to checkout"} <span aria-hidden="true">→</span>
        </button>
      </div>
    </div>
  );
}
