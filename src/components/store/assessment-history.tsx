"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import { useAuth } from "@/components/auth-provider";
import { apiFetch } from "@/lib/api";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export type Assessment = {
  id: string;
  created_at: string;
  preferred_assessment_date: string;
  customer_info: Record<string, string>;
  installation_info: Record<string, string>;
  existing_led_lighting: string;
  additional_remarks: string | null;
  site_photos: string[];
  interested_products: Array<{ id: string; name: string; quantity: number }>;
  status: string;
  admin_notes: string | null;
  site_evaluation: Record<string, unknown> | null;
  quotation: Record<string, unknown> | null;
  downpayment_status: "unpaid" | "pending" | "rejected" | "verified" | null;
  downpayment_amount: number | null;
  downpayment_reference: string | null;
  downpayment_proof_url: string | null;
  downpayment_submitted_at: string | null;
  downpayment_review_notes: string | null;
  balance_payment_status: "unpaid" | "pending" | "rejected" | "verified" | null;
  balance_payment_amount: number | null;
  balance_payment_reference: string | null;
  balance_payment_proof_url: string | null;
  balance_payment_submitted_at: string | null;
  balance_payment_review_notes: string | null;
  delivery_status: "not_started" | "preparing" | "fabrication" | "ready_for_delivery" | "in_transit" | "installation" | "completed" | null;
  delivery_expected_at: string | null;
  delivery_notes: string | null;
  delivery_updated_at: string | null;
};

type Notification = {
  entity_type?: string | null;
  entity_id?: string | null;
  read_at: string | null;
};

type LineItem = { description: string; amount: number };
type AssessmentFilter = "all" | "requests" | "quotations";
const ACTIVE_ASSESSMENT_STATUSES = new Set(["pending", "accepted", "site_assessed", "quotation_sent"]);
const DELIVERY_STAGES = [
  ["preparing", "Preparing"],
  ["fabrication", "Fabrication"],
  ["ready_for_delivery", "Ready for delivery"],
  ["in_transit", "In transit"],
  ["installation", "Installation"],
  ["completed", "Completed"],
] as const;

function isLineItem(value: unknown): value is LineItem {
  return Boolean(value && typeof value === "object" &&
    typeof (value as LineItem).description === "string" &&
    typeof (value as LineItem).amount === "number");
}

export function money(value: unknown) {
  const amount = typeof value === "number" && Number.isFinite(value) ? value : 0;
  return new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" }).format(amount);
}

function provided(value: string | undefined) {
  return value?.trim() || "Not provided";
}

export function DownpaymentForm({
  assessment,
  userId,
  paymentQrUrl,
  onSubmitted,
}: {
  assessment: Assessment;
  userId: string;
  paymentQrUrl: string;
  onSubmitted: () => Promise<void>;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const total = Number(assessment.quotation?.total);
  const minimumAmount = Math.ceil(total * 0.2 * 100) / 100;

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const amount = Number(formData.get("amount"));
    const proof = formData.get("proof");
    const fileExtensions: Record<string, string> = {
      "image/jpeg": "jpg",
      "image/png": "png",
      "image/webp": "webp",
    };
    const extension = proof instanceof File ? fileExtensions[proof.type] : undefined;
    if (!Number.isFinite(amount) || amount < minimumAmount || amount > total) {
      setError(`Enter a downpayment from ${money(minimumAmount)} up to ${money(total)}.`);
      return;
    }
    if (!(proof instanceof File) || !extension || proof.size === 0 || proof.size > 10 * 1024 * 1024) {
      setError("Choose a JPG, PNG, or WebP payment proof image smaller than 10 MB.");
      return;
    }

    setBusy(true);
    setError("");
    try {
      const objectPath = `${userId}/${assessment.id}/${window.crypto.randomUUID()}.${extension}`;
      const supabase = getSupabaseBrowserClient();
      const { error: uploadError } = await supabase.storage
        .from("site-assessment-payment-proofs")
        .upload(objectPath, proof, { contentType: proof.type, upsert: false });
      if (uploadError) throw new Error(`Payment proof could not be uploaded: ${uploadError.message}`);
      await apiFetch(`/api/v1/store/assessments/${encodeURIComponent(assessment.id)}/downpayment`, {
        method: "POST",
        body: JSON.stringify({
          amount,
          reference: String(formData.get("reference") ?? "").trim(),
          proofPath: objectPath,
          customerName: String(formData.get("customerName") ?? "").trim(),
          signature: String(formData.get("signature") ?? "").trim(),
        }),
      });
      await onSubmitted();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "The downpayment could not be submitted.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="mt-4 grid w-full gap-3 rounded-lg border border-[#e4e0d7] p-4 sm:grid-cols-2" onSubmit={(event) => void submit(event)}>
      <label className="text-xs sm:col-span-2">
        Scan this payment QR code
        <a className="mt-2 block w-fit" href={paymentQrUrl} rel="noreferrer" target="_blank">
          <Image alt="BawatPieza payment QR code" className="h-52 w-52 rounded-md border border-[#d6ddd4] object-contain p-2" height={208} src={paymentQrUrl} unoptimized width={208} />
        </a>
      </label>
      <label className="text-xs">
        Downpayment amount (minimum {money(minimumAmount)})
        <input className="mt-1.5 min-h-11 w-full rounded-md border border-[#d6ddd4] bg-white px-3 text-sm" defaultValue={minimumAmount.toFixed(2)} max={total.toFixed(2)} min={minimumAmount.toFixed(2)} name="amount" required step="0.01" type="number" />
      </label>
      <label className="text-xs">
        Payment reference (optional)
        <input className="mt-1.5 min-h-11 w-full rounded-md border border-[#d6ddd4] bg-white px-3 text-sm" maxLength={200} name="reference" />
      </label>
      <label className="text-xs sm:col-span-2">
        Proof of payment
        <input accept="image/jpeg,image/png,image/webp" className="mt-1.5 block w-full text-sm" name="proof" required type="file" />
      </label>
      <label className="text-xs">
        Customer representative name
        <input className="mt-1.5 min-h-11 w-full rounded-md border border-[#d6ddd4] bg-white px-3 text-sm" maxLength={200} name="customerName" required />
      </label>
      <label className="text-xs">
        Typed signature
        <input className="mt-1.5 min-h-11 w-full rounded-md border border-[#d6ddd4] bg-white px-3 text-sm" maxLength={200} name="signature" required />
      </label>
      {error && <p className="storage-message sm:col-span-2" role="alert">{error}</p>}
      <button className="button button-dark sm:col-span-2 sm:justify-self-start" disabled={busy} type="submit">
        {busy ? "Uploading proof..." : "Submit downpayment for verification"}
      </button>
    </form>
  );
}

export function BalancePaymentForm({
  assessment,
  userId,
  paymentQrUrl,
  balance,
  onSubmitted,
}: {
  assessment: Assessment;
  userId: string;
  paymentQrUrl: string;
  balance: number;
  onSubmitted: () => Promise<void>;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const proof = formData.get("proof");
    const fileExtensions: Record<string, string> = {
      "image/jpeg": "jpg",
      "image/png": "png",
      "image/webp": "webp",
    };
    const extension = proof instanceof File ? fileExtensions[proof.type] : undefined;
    if (!(proof instanceof File) || !extension || proof.size === 0 || proof.size > 10 * 1024 * 1024) {
      setError("Choose a JPG, PNG, or WebP payment proof image smaller than 10 MB.");
      return;
    }

    setBusy(true);
    setError("");
    try {
      const objectPath = `${userId}/${assessment.id}/${window.crypto.randomUUID()}.${extension}`;
      const supabase = getSupabaseBrowserClient();
      const { error: uploadError } = await supabase.storage
        .from("site-assessment-payment-proofs")
        .upload(objectPath, proof, { contentType: proof.type, upsert: false });
      if (uploadError) throw new Error(`Payment proof could not be uploaded: ${uploadError.message}`);
      await apiFetch(`/api/v1/store/assessments/${encodeURIComponent(assessment.id)}/balance-payment`, {
        method: "POST",
        body: JSON.stringify({
          reference: String(formData.get("reference") ?? "").trim(),
          proofPath: objectPath,
        }),
      });
      await onSubmitted();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "The balance payment could not be submitted.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="mt-4 grid w-full gap-3 rounded-lg border border-[#e4e0d7] p-4 sm:grid-cols-2" onSubmit={(event) => void submit(event)}>
      <div className="text-xs sm:col-span-2">
        <p className="font-semibold">Pay the remaining balance: {money(balance)}</p>
        <p className="mt-1 text-[#68736a]">Scan the QR code, pay the exact balance, then upload your proof for admin verification.</p>
        <a className="mt-2 inline-block" href={paymentQrUrl} rel="noreferrer" target="_blank">
          <Image alt="BawatPieza payment QR code" className="h-52 w-52 rounded-md border border-[#d6ddd4] object-contain p-2" height={208} src={paymentQrUrl} unoptimized width={208} />
        </a>
      </div>
      <label className="text-xs">
        Payment reference (optional)
        <input className="mt-1.5 min-h-11 w-full rounded-md border border-[#d6ddd4] bg-white px-3 text-sm" maxLength={200} name="reference" />
      </label>
      <label className="text-xs">
        Proof of payment
        <input accept="image/jpeg,image/png,image/webp" className="mt-1.5 block w-full text-sm" name="proof" required type="file" />
      </label>
      {error && <p className="storage-message sm:col-span-2" role="alert">{error}</p>}
      <button className="button button-dark sm:col-span-2 sm:justify-self-start" disabled={busy} type="submit">
        {busy ? "Uploading proof..." : "Pay remaining balance"}
      </button>
    </form>
  );
}

function DeliveryProgress({ assessment }: { assessment: Assessment }) {
  const currentIndex = DELIVERY_STAGES.findIndex(([status]) => status === assessment.delivery_status);

  return (
    <section aria-label="Project delivery progress" className="mt-5 rounded-lg border border-[#e4e0d7] p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold">Delivery and installation progress</h3>
          <p className="mt-1 text-xs text-[#68736a]">
            {currentIndex < 0
              ? "Your project is accepted. The team will update this timeline as work begins."
              : `Current stage: ${DELIVERY_STAGES[currentIndex][1]}`}
          </p>
        </div>
        {assessment.delivery_expected_at && (
          <p className="text-xs font-semibold text-[#214d38]">
            Estimated delivery: {new Date(`${assessment.delivery_expected_at}T00:00:00`).toLocaleDateString()}
          </p>
        )}
      </div>
      <ol className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {DELIVERY_STAGES.map(([status, label], index) => {
          const complete = currentIndex >= index;
          const current = currentIndex === index;
          return (
            <li aria-current={current ? "step" : undefined} className="flex items-center gap-2 text-xs" key={status}>
              <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-[10px] ${
                complete ? "border-[#214d38] bg-[#214d38] text-white" : "border-[#c9d0c7] text-[#68736a]"
              }`}>
                {complete ? "✓" : index + 1}
              </span>
              <span className={complete ? "font-semibold text-[#214d38]" : "text-[#68736a]"}>{label}</span>
            </li>
          );
        })}
      </ol>
      {assessment.delivery_notes && <p className="mt-4 whitespace-pre-wrap text-xs text-[#47534a]">{assessment.delivery_notes}</p>}
      {assessment.delivery_updated_at && (
        <p className="mt-2 text-[11px] text-[#68736a]">Last updated {new Date(assessment.delivery_updated_at).toLocaleString()}</p>
      )}
    </section>
  );
}

export default function AssessmentHistory() {
  const { user, loading } = useAuth();
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [loadingAssessments, setLoadingAssessments] = useState(true);
  const [error, setError] = useState("");
  const [notificationError, setNotificationError] = useState("");
  const [newAssessmentIds, setNewAssessmentIds] = useState<Set<string>>(new Set());
  const [busyId, setBusyId] = useState("");
  const [filter, setFilter] = useState<AssessmentFilter>("all");
  async function loadAssessments() {
    try {
      const response = await apiFetch("/api/v1/store/assessments");
      const body = (await response.json()) as { assessments: Assessment[] };
      setAssessments(body.assessments ?? []);
      setError("");
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Assessment requests could not be loaded.");
    } finally {
      setLoadingAssessments(false);
    }
  }

  useEffect(() => {
    if (!user) return;
    let active = true;
    async function load() {
      const assessmentRequest = apiFetch("/api/v1/store/assessments");
      const notificationRequest = apiFetch("/api/v1/notifications");
      try {
        const response = await assessmentRequest;
        const body = (await response.json()) as { assessments: Assessment[] };
        if (active) {
          setAssessments(body.assessments ?? []);
          setError("");
        }
      } catch (loadError) {
        if (active) setError(loadError instanceof Error ? loadError.message : "Assessment requests could not be loaded.");
      } finally {
        if (active) setLoadingAssessments(false);
      }
      try {
        const response = await notificationRequest;
        const body = (await response.json()) as { notifications?: Notification[] };
        if (active) {
          setNewAssessmentIds(new Set(
            (body.notifications ?? [])
              .flatMap((notification) =>
                !notification.read_at && notification.entity_type === "site_assessment" && notification.entity_id
                  ? [notification.entity_id]
                  : [],
              ),
          ));
          setNotificationError("");
        }
      } catch (notificationLoadError) {
        if (active) {
          setNewAssessmentIds(new Set());
          setNotificationError(notificationLoadError instanceof Error
            ? notificationLoadError.message
            : "New assessment indicators could not be loaded.");
        }
      }
    }
    void load();
    return () => {
      active = false;
    };
  }, [user]);

  async function respond(
    id: string,
    decision: "quotation_declined",
  ) {
    setBusyId(id);
    setError("");
    try {
      await apiFetch(`/api/v1/store/assessments/${encodeURIComponent(id)}/quotation-response`, {
        method: "PATCH",
        body: JSON.stringify({ decision }),
      });
      await loadAssessments();
    } catch (responseError) {
      setError(responseError instanceof Error ? responseError.message : "Your quotation response could not be saved.");
    } finally {
      setBusyId("");
    }
  }

  if (loading) return <p className="storage-message">Loading your assessment requests…</p>;
  if (!user) {
    return (
      <section className="checkout-empty">
        <h2>Sign in to view your assessments.</h2>
        <p>Assessment updates and quotations are linked to your customer account.</p>
        <Link className="button button-dark" href={`/login?redirectTo=${encodeURIComponent("/account/assessments")}`}>Sign in <span aria-hidden="true">→</span></Link>
      </section>
    );
  }
  if (loadingAssessments) return <p className="storage-message">Loading your assessment requests…</p>;

  const activeAssessment = assessments.find((assessment) => ACTIVE_ASSESSMENT_STATUSES.has(assessment.status));
  const filteredAssessments = assessments.filter((assessment) => {
    if (filter === "requests") return !assessment.quotation;
    if (filter === "quotations") return Boolean(assessment.quotation);
    return true;
  });

  return (
    <section className="purchase-history-section">
      {assessments.length > 0 && (
        <div aria-label="Filter site assessments" className="mb-5 flex flex-wrap items-center gap-2" role="group">
          <span className="mr-1 text-xs text-[#68736a]">Show:</span>
          {([
            ["all", "All"],
            ["requests", "Requests"],
            ["quotations", "Proposal & quotations"],
          ] as const).map(([value, label]) => (
            <button
              aria-pressed={filter === value}
              className={`rounded-full border px-4 py-2 text-xs font-semibold transition ${
                filter === value
                  ? "border-[#214d38] bg-[#214d38] text-white"
                  : "border-[#d6ddd4] bg-white text-[#47534a] hover:border-[#214d38]"
              }`}
              key={value}
              onClick={() => setFilter(value)}
              type="button"
            >
              {label}
            </button>
          ))}
        </div>
      )}
      {error && <p className="storage-message" role="alert">{error}</p>}
      {notificationError && <p className="storage-message" role="status">New assessment indicators are unavailable: {notificationError}</p>}
      {error && assessments.length === 0 && <button className="button button-outline" onClick={() => void loadAssessments()} type="button">Try again</button>}
      {activeAssessment && (
        <p className="storage-message" role="status">
          You currently have an active site assessment request ({activeAssessment.status.replace(/_/g, " ")}). Submit another request after it is declined or you respond to its quotation.
        </p>
      )}
      {assessments.length === 0 && !error ? (
        <div className="checkout-empty">
          <h2>No assessment requests yet.</h2>
          <p>Tell us about your site to begin a feasibility review.</p>
          <Link className="button button-dark" href="/assessment">Request an assessment <span aria-hidden="true">→</span></Link>
        </div>
      ) : filteredAssessments.length === 0 ? (
        <p className="storage-message">
          {filter === "requests" ? "No open assessment requests." : "No proposal or quotation is available yet."}
        </p>
      ) : (
        <div className="space-y-5">
          {filteredAssessments.map((assessment) => {
            const quote = assessment.quotation;
            const items = Array.isArray(quote?.lineItems) ? quote.lineItems.filter(isLineItem) : [];
            const timeline = quote?.timeline as Record<string, string> | undefined;
            const specs = quote?.technicalSpecs as Record<string, string> | undefined;
            const acceptance = quote?.customerAcceptance as Record<string, string> | undefined;
            return (
              <article className="history-card" id={assessment.id} key={assessment.id}>
                <div className="history-card-top">
                  <div>
                    <p className="eyebrow">SITE ASSESSMENT · {assessment.id.slice(0, 8).toUpperCase()}</p>
                    <h2>{assessment.customer_info.organizationName}</h2>
                    <p className="history-meta">Submitted {new Date(assessment.created_at).toLocaleDateString()} · Preferred visit {assessment.preferred_assessment_date}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {newAssessmentIds.has(assessment.id) && <span className="status-badge">New</span>}
                    <span className="status-badge">{assessment.status.replace(/_/g, " ")}</span>
                  </div>
                </div>
                <section className="mt-4 rounded-lg border border-[#e4e0d7] p-4">
                  <h3 className="text-sm font-semibold">Your submitted request</h3>
                  <h4 className="mt-3 text-xs font-semibold uppercase tracking-wide text-[#68736a]">Customer and organization</h4>
                  <dl className="mt-2 grid gap-3 text-xs sm:grid-cols-2">
                    <div><dt className="text-[#777]">Organization</dt><dd className="mt-1">{provided(assessment.customer_info.organizationName)}</dd></div>
                    <div><dt className="text-[#777]">Contact person</dt><dd className="mt-1">{provided(assessment.customer_info.contactPerson)}</dd></div>
                    <div><dt className="text-[#777]">Position</dt><dd className="mt-1">{provided(assessment.customer_info.contactPosition)}</dd></div>
                    <div><dt className="text-[#777]">Email</dt><dd className="mt-1">{provided(assessment.customer_info.email)}</dd></div>
                    <div><dt className="text-[#777]">Contact number</dt><dd className="mt-1">{provided(assessment.customer_info.contactNumber)}</dd></div>
                    <div><dt className="text-[#777]">Organization address</dt><dd className="mt-1">{provided(assessment.customer_info.organizationAddress)}</dd></div>
                  </dl>
                  <h4 className="mt-4 text-xs font-semibold uppercase tracking-wide text-[#68736a]">Proposed installation</h4>
                  <dl className="mt-2 grid gap-3 text-xs sm:grid-cols-2">
                    <div><dt className="text-[#777]">Installation area</dt><dd className="mt-1">{provided(assessment.installation_info.areaName)}</dd></div>
                    <div><dt className="text-[#777]">Exact location</dt><dd className="mt-1">{provided(assessment.installation_info.exactLocation)}</dd></div>
                    <div className="sm:col-span-2"><dt className="text-[#777]">Intended purpose</dt><dd className="mt-1">{provided(assessment.installation_info.purpose)}</dd></div>
                    <div><dt className="text-[#777]">Estimated pathway length</dt><dd className="mt-1">{provided(assessment.installation_info.estimatedLength)}{assessment.installation_info.estimatedLength ? " m" : ""}</dd></div>
                    <div><dt className="text-[#777]">Estimated pathway width</dt><dd className="mt-1">{provided(assessment.installation_info.estimatedWidth)}{assessment.installation_info.estimatedWidth ? " m" : ""}</dd></div>
                    <div><dt className="text-[#777]">Estimated number of tiles</dt><dd className="mt-1">{provided(assessment.installation_info.estimatedTiles)}</dd></div>
                    <div><dt className="text-[#777]">Current floor material</dt><dd className="mt-1">{provided(assessment.installation_info.floorMaterial)}</dd></div>
                    <div><dt className="text-[#777]">Preferred assessment date</dt><dd className="mt-1">{assessment.preferred_assessment_date}</dd></div>
                    <div><dt className="text-[#777]">Existing LED lighting</dt><dd className="mt-1">{assessment.existing_led_lighting}</dd></div>
                    {assessment.additional_remarks && <div className="sm:col-span-2"><dt className="text-[#777]">Additional remarks</dt><dd className="mt-1 whitespace-pre-wrap">{assessment.additional_remarks}</dd></div>}
                  </dl>
                  {assessment.interested_products.length > 0 && (
                    <>
                      <h4 className="mt-4 text-xs font-semibold uppercase tracking-wide text-[#68736a]">Products for planning</h4>
                      <ul className="mt-2 list-inside list-disc text-xs">
                        {assessment.interested_products.map((product) => <li key={product.id}>{product.name} · reference quantity {product.quantity}</li>)}
                      </ul>
                    </>
                  )}
                  <h4 className="mt-4 text-xs font-semibold uppercase tracking-wide text-[#68736a]">Site photos</h4>
                  <div className="mt-2 flex flex-wrap gap-3 text-xs">
                    {assessment.site_photos.map((photo, index) => (
                      <a className="text-[#214d38] underline" href={photo} key={photo} rel="noreferrer" target="_blank">View site photo {index + 1}</a>
                    ))}
                  </div>
                </section>
                {assessment.admin_notes && <p className="mt-4 text-xs leading-5 text-[#6b756d]"><strong>Team note:</strong> {assessment.admin_notes}</p>}
                {quote && (
                  <section className="mt-5 border-t border-[#e4e0d7] pt-5">
                    <p className="eyebrow">BAWATPIEZA · PROJECT PROPOSAL &amp; QUOTATION</p>
                    <div className="mt-2 flex flex-wrap justify-between gap-2">
                      <h3 className="text-lg font-semibold">{String(quote.quotationNo ?? "Project quotation")}</h3>
                      <span className="text-xs text-[#68736a]">Valid until {String(quote.validUntil ?? "—")}</span>
                    </div>
                    <p className="mt-2 text-xs text-[#68736a]">Organization: {assessment.customer_info.organizationName} · Site: {assessment.customer_info.organizationAddress}</p>
                    <p className="mt-1 text-xs text-[#68736a]">Prepared by {String(quote.preparedBy ?? "—")} · Approved by {String(quote.approvedBy ?? "—")} · Issued {String(quote.dateIssued ?? "—")}</p>
                    <div className="mt-4 grid gap-2 text-xs sm:grid-cols-2">
                      <p>Tiles: {specs?.tiles || "—"}</p>
                      <p>Sandbox / tile housing: {specs?.housing || "—"}</p>
                      <p>Battery capacity: {specs?.batteryCapacity || "—"}</p>
                      <p>Battery capacity percentage: {specs?.batteryPercentage || "—"}</p>
                      <p className="sm:col-span-2">Battery / power management: {specs?.batteryManagement || "—"}</p>
                    </div>
                    <div className="mt-4 space-y-2 border-t border-[#e4e0d7] pt-3">
                      {items.map((item) => <div className="flex justify-between gap-3 text-xs" key={item.description}><span>{item.description}</span><span>{money(item.amount)}</span></div>)}
                      <div className="flex justify-between border-t border-[#d8d2c8] pt-3 text-sm font-bold"><span>Total project cost</span><span>{money(quote.total)}</span></div>
                    </div>
                    <div className="mt-4 grid gap-3 text-xs sm:grid-cols-2">
                      <p>Project timeline: Fabrication {timeline?.fabrication || "—"} · Installation {timeline?.installation || "—"} · Testing {timeline?.testing || "—"} · Total {timeline?.total || "—"}</p>
                      <p>Warranty: {String(quote.warrantyCoverage ?? "—")}</p>
                      <p>Maintenance: {String(quote.maintenanceSchedule ?? "—")}</p>
                      <p>Payment terms: {String(quote.paymentTerms ?? "—")}</p>
                    </div>
                    {assessment.status === "quotation_sent" ? (
                      <div className="mt-5">
                        <p className="text-sm font-semibold">Payment review is in your Payments tab.</p>
                        <p className="mt-1 text-xs text-[#68736a]">
                          {assessment.downpayment_status === "pending"
                            ? "Your downpayment proof is awaiting admin verification."
                            : "Submit your downpayment proof and follow its verification status."}
                        </p>
                        <Link className="button button-dark mt-3" href="/account/payments">Open Payments</Link>
                        {assessment.downpayment_status !== "pending" && (
                          <button className="button button-outline mt-3 sm:ml-2" disabled={busyId === assessment.id} onClick={() => void respond(assessment.id, "quotation_declined")} type="button">
                            {busyId === assessment.id ? "Saving…" : "Decline quotation"}
                          </button>
                        )}
                      </div>
                    ) : assessment.status === "quotation_accepted" ? (
                      <>
                        <p className="mt-4 text-xs font-semibold text-green-700">Accepted by {acceptance?.name || "customer representative"} ({acceptance?.signature || "signed"}) on {acceptance?.date ? new Date(acceptance.date).toLocaleDateString() : "—"}.</p>
                        <p className="mt-2 text-xs text-[#68736a]">View your balance and payment status in the Payments tab.</p>
                        <Link className="button button-outline mt-3" href="/account/payments">View Payments</Link>
                        <DeliveryProgress assessment={assessment} />
                      </>
                    ) : assessment.status === "quotation_declined" ? (
                      <p className="mt-4 text-xs text-[#68736a]">You declined this quotation. Contact the team if you would like to discuss it.</p>
                    ) : null}
                  </section>
                )}
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
