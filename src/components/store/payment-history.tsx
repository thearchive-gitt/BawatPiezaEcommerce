"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/components/auth-provider";
import { apiFetch } from "@/lib/api";
import { BalancePaymentForm, DownpaymentForm, money, type Assessment } from "@/components/store/assessment-history";

export default function PaymentHistory() {
  const { user, loading } = useAuth();
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [loadingAssessments, setLoadingAssessments] = useState(true);
  const [error, setError] = useState("");
  const [paymentQrUrl, setPaymentQrUrl] = useState("");
  const [paymentQrError, setPaymentQrError] = useState("");
  const [loadingPaymentQr, setLoadingPaymentQr] = useState(true);

  const loadAssessments = useCallback(async () => {
    try {
      const response = await apiFetch("/api/v1/store/assessments");
      const body = (await response.json()) as { assessments: Assessment[] };
      setAssessments(body.assessments ?? []);
      setError("");
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Payment information could not be loaded.");
    } finally {
      setLoadingAssessments(false);
    }
  }, []);

  useEffect(() => {
    if (!user) return;
    let active = true;
    async function loadAssessments() {
      try {
        const response = await apiFetch("/api/v1/store/assessments");
        const body = (await response.json()) as { assessments: Assessment[] };
        if (active) {
          setAssessments(body.assessments ?? []);
          setError("");
        }
      } catch (loadError) {
        if (active) {
          setError(loadError instanceof Error ? loadError.message : "Payment information could not be loaded.");
        }
      } finally {
        if (active) setLoadingAssessments(false);
      }
    }

    async function loadPaymentQr() {
      try {
        const response = await apiFetch("/api/v1/store/payment-qr");
        const body = (await response.json()) as { paymentQrUrl: string | null };
        if (active) {
          setPaymentQrUrl(body.paymentQrUrl ?? "");
          setPaymentQrError("");
        }
      } catch (loadError) {
        if (active) {
          setPaymentQrUrl("");
          setPaymentQrError(loadError instanceof Error ? loadError.message : "The payment QR code could not be loaded.");
        }
      } finally {
        if (active) setLoadingPaymentQr(false);
      }
    }
    void Promise.all([loadAssessments(), loadPaymentQr()]);
    return () => {
      active = false;
    };
  }, [user]);

  async function retryPaymentQr() {
    setLoadingPaymentQr(true);
    setPaymentQrError("");
    try {
      const response = await apiFetch("/api/v1/store/payment-qr");
      const body = (await response.json()) as { paymentQrUrl: string | null };
      setPaymentQrUrl(body.paymentQrUrl ?? "");
    } catch (loadError) {
      setPaymentQrError(loadError instanceof Error ? loadError.message : "The payment QR code could not be loaded.");
    } finally {
      setLoadingPaymentQr(false);
    }
  }

  if (loading) return <p className="storage-message">Loading your payment information…</p>;
  if (!user) {
    return (
      <section className="checkout-empty">
        <h2>Sign in to view your project payments.</h2>
        <p>Assessment payments are linked to your customer account.</p>
        <Link className="button button-dark" href={`/login?redirectTo=${encodeURIComponent("/account/payments")}`}>Sign in <span aria-hidden="true">→</span></Link>
      </section>
    );
  }
  if (loadingAssessments) return <p className="storage-message">Loading your payment information…</p>;

  const payableAssessments = assessments.filter((assessment) =>
    assessment.quotation && (assessment.status === "quotation_sent" || assessment.status === "quotation_accepted"),
  );

  return (
    <section className="purchase-history-section">
      {error && <p className="storage-message" role="alert">{error}</p>}
      {error && assessments.length === 0 && (
        <button className="button button-outline" onClick={() => void loadAssessments()} type="button">Try again</button>
      )}
      {payableAssessments.length === 0 ? (
        <div className="checkout-empty">
          <h2>No project payments due.</h2>
          <p>Payments appear here when a project quotation is ready.</p>
          <Link className="button button-outline" href="/account/assessments">View site assessments</Link>
        </div>
      ) : (
        <div className="space-y-5">
          {payableAssessments.map((assessment) => {
            const quote = assessment.quotation;
            const total = Number(quote?.total);
            const verifiedDownpayment = assessment.downpayment_status === "verified" && Number.isFinite(assessment.downpayment_amount)
              ? Number(assessment.downpayment_amount)
              : 0;
            const verifiedBalance = assessment.balance_payment_status === "verified" && Number.isFinite(assessment.balance_payment_amount)
              ? Number(assessment.balance_payment_amount)
              : 0;
            const remainingBalance = Math.max(total - verifiedDownpayment - verifiedBalance, 0);

            return (
              <article className="history-card" id={assessment.id} key={assessment.id}>
                <div className="history-card-top">
                  <div>
                    <p className="eyebrow">PROJECT PAYMENT · {assessment.id.slice(0, 8).toUpperCase()}</p>
                    <h2>{assessment.customer_info.organizationName}</h2>
                    <p className="history-meta">
                      {String(quote?.quotationNo ?? "Project quotation")} · Total {money(total)}
                    </p>
                  </div>
                  <span className="status-badge">{assessment.status.replace(/_/g, " ")}</span>
                </div>

                {assessment.status === "quotation_sent" ? (
                  <section className="mt-4 rounded-lg border border-[#e4e0d7] p-4">
                    <h3 className="text-sm font-semibold">Downpayment</h3>
                    <p className="mt-1 text-xs text-[#68736a]">Pay at least 20% of the project total and submit proof. Admin verification accepts the quotation.</p>
                    {assessment.downpayment_status === "pending" ? (
                      <div className="mt-3 rounded-lg bg-[#f7f6f1] p-3 text-xs">
                        <p className="font-semibold text-[#214d38]">Proof submitted · awaiting admin verification</p>
                        <p className="mt-2">Amount: {assessment.downpayment_amount === null ? "—" : money(assessment.downpayment_amount)} · Submitted {assessment.downpayment_submitted_at ? new Date(assessment.downpayment_submitted_at).toLocaleString() : "—"}</p>
                        {assessment.downpayment_reference && <p className="mt-1">Reference: {assessment.downpayment_reference}</p>}
                        {assessment.downpayment_proof_url && <a className="mt-2 inline-block text-[#214d38] underline" href={assessment.downpayment_proof_url} rel="noreferrer" target="_blank">View submitted proof</a>}
                      </div>
                    ) : (
                      <>
                        {assessment.downpayment_status === "rejected" && (
                          <p className="mt-3 text-xs text-red-700" role="alert">
                            Payment proof was rejected. {assessment.downpayment_review_notes || "Please correct the payment and submit new proof."}
                          </p>
                        )}
                        {loadingPaymentQr ? (
                          <p className="storage-message mt-3">Loading the payment QR code…</p>
                        ) : paymentQrUrl ? (
                          <DownpaymentForm
                            assessment={assessment}
                            onSubmitted={loadAssessments}
                            paymentQrUrl={paymentQrUrl}
                            userId={user.id}
                          />
                        ) : (
                          <div className="mt-3">
                            <p className="storage-message" role={paymentQrError ? "alert" : "status"}>
                              {paymentQrError || "The payment QR code has not been configured yet. Please contact the BawatPieza team."}
                            </p>
                            {paymentQrError && <button className="button button-outline mt-2" onClick={() => void retryPaymentQr()} type="button">Try again</button>}
                          </div>
                        )}
                      </>
                    )}
                  </section>
                ) : (
                  <section className="mt-4 rounded-lg border border-[#e4e0d7] p-4">
                    <h3 className="text-sm font-semibold">Remaining balance</h3>
                    <dl className="mt-3 grid gap-2 text-xs sm:grid-cols-3">
                      <div><dt className="text-[#68736a]">Verified downpayment</dt><dd className="mt-1 font-semibold">{money(verifiedDownpayment)}</dd></div>
                      <div><dt className="text-[#68736a]">Balance payment status</dt><dd className="mt-1 font-semibold">{(assessment.balance_payment_status ?? "unpaid").replace(/_/g, " ")}</dd></div>
                      <div><dt className="text-[#68736a]">Balance remaining</dt><dd className="mt-1 font-semibold">{money(remainingBalance)}</dd></div>
                    </dl>
                    {assessment.balance_payment_status === "pending" ? (
                      <div className="mt-3 rounded-lg bg-[#f7f6f1] p-3 text-xs">
                        <p className="font-semibold text-[#214d38]">Proof submitted · awaiting admin verification</p>
                        <p className="mt-2">Amount: {assessment.balance_payment_amount === null ? "—" : money(assessment.balance_payment_amount)} · Submitted {assessment.balance_payment_submitted_at ? new Date(assessment.balance_payment_submitted_at).toLocaleString() : "—"}</p>
                        {assessment.balance_payment_reference && <p className="mt-1">Reference: {assessment.balance_payment_reference}</p>}
                        {assessment.balance_payment_proof_url && <a className="mt-2 inline-block text-[#214d38] underline" href={assessment.balance_payment_proof_url} rel="noreferrer" target="_blank">View submitted proof</a>}
                      </div>
                    ) : remainingBalance <= 0 ? (
                      <p className="mt-3 text-xs font-semibold text-green-700">Your project balance is fully paid and verified.</p>
                    ) : (
                      <>
                        {assessment.balance_payment_status === "rejected" && (
                          <p className="mt-3 text-xs text-red-700" role="alert">
                            Balance payment proof was rejected. {assessment.balance_payment_review_notes || "Please correct the payment proof and submit it again."}
                          </p>
                        )}
                        {loadingPaymentQr ? (
                          <p className="storage-message mt-3">Loading the payment QR code…</p>
                        ) : paymentQrUrl ? (
                          <BalancePaymentForm
                            assessment={assessment}
                            balance={remainingBalance}
                            onSubmitted={loadAssessments}
                            paymentQrUrl={paymentQrUrl}
                            userId={user.id}
                          />
                        ) : (
                          <div className="mt-3">
                            <p className="storage-message" role={paymentQrError ? "alert" : "status"}>
                              {paymentQrError || "The payment QR code has not been configured yet. Please contact the BawatPieza team."}
                            </p>
                            {paymentQrError && <button className="button button-outline mt-2" onClick={() => void retryPaymentQr()} type="button">Try again</button>}
                          </div>
                        )}
                      </>
                    )}
                  </section>
                )}
                <Link className="mt-3 inline-block text-xs text-[#214d38] underline" href={`/account/assessments#${assessment.id}`}>
                  View assessment and delivery progress
                </Link>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
