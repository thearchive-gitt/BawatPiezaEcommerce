"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { useAuth } from "@/components/auth-provider";
import { apiFetch } from "@/lib/api";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { getProduct } from "@/data/products";

const MAX_PHOTOS = 8;
const MAX_PHOTO_BYTES = 10 * 1024 * 1024;
const ACTIVE_ASSESSMENT_STATUSES = new Set(["pending", "accepted", "site_assessed", "quotation_sent"]);
const inputClass = "mt-1.5 min-h-11 w-full rounded-md border border-[#d6ddd4] bg-white px-3 text-sm text-[#152238]";
const textareaClass = `${inputClass} min-h-24 py-3`;

type ActiveAssessment = {
  id: string;
  status: string;
  quotation?: Record<string, unknown> | null;
  balance_payment_status?: string | null;
};
type UnpaidProject = { id: string; balance_payment_status?: string | null };
type AssessmentCheck = {
  userId: string;
  attempt: number;
  activeAssessment: ActiveAssessment | null;
  unpaidProject: UnpaidProject | null;
  error: string;
};

function localDate() {
  const date = new Date();
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().slice(0, 10);
}

export default function SiteAssessmentForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, account, loading } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [assessmentCheck, setAssessmentCheck] = useState<AssessmentCheck | null>(null);
  const [assessmentCheckAttempt, setAssessmentCheckAttempt] = useState(0);
  const userId = user?.id;
  const checkingAssessments = Boolean(userId && (
    assessmentCheck?.userId !== userId || assessmentCheck.attempt !== assessmentCheckAttempt
  ));
  const assessmentCheckError = checkingAssessments ? "" : assessmentCheck?.error ?? "";
  const activeAssessment = checkingAssessments ? null : assessmentCheck?.activeAssessment ?? null;
  const unpaidProject = checkingAssessments ? null : assessmentCheck?.unpaidProject ?? null;

  const directProduct = getProduct(searchParams.get("productId") ?? "");
  const parsedQuantity = Number(searchParams.get("quantity"));
  const requestedQuantity =
    Number.isSafeInteger(parsedQuantity) && parsedQuantity > 0 ? parsedQuantity : 1;
  const productInterests = directProduct
    ? [{ id: directProduct.id, name: directProduct.name, quantity: requestedQuantity }]
    : [];

  useEffect(() => {
    if (loading || typeof userId !== "string" || userId.length === 0) return;
    const currentUserId = userId;

    let active = true;
    async function checkActiveAssessment() {
      try {
        let activeRequest: ActiveAssessment | null;
        let unpaidProject: UnpaidProject | null = null;
        try {
          const response = await apiFetch("/api/v1/store/assessments/active");
          const body = (await response.json()) as {
            activeAssessment: ActiveAssessment | null;
            unpaidProject?: UnpaidProject | null;
          };
          activeRequest = body.activeAssessment;
          unpaidProject = body.unpaidProject ?? null;
        } catch (activeEndpointError) {
          if (!(activeEndpointError instanceof Error && /status 404/i.test(activeEndpointError.message))) {
            throw activeEndpointError;
          }
          const response = await apiFetch("/api/v1/store/assessments");
          const body = (await response.json()) as { assessments?: Array<ActiveAssessment> };
          if (!Array.isArray(body.assessments)) throw new Error("The assessment request list could not be read.");
          activeRequest = body.assessments.find((assessment) => ACTIVE_ASSESSMENT_STATUSES.has(assessment.status)) ?? null;
          unpaidProject = body.assessments.find((assessment) =>
            assessment.quotation !== null &&
            assessment.quotation !== undefined &&
            assessment.balance_payment_status !== "verified",
          ) ?? null;
        }
        if (active) {
          setAssessmentCheck({
            userId: currentUserId,
            attempt: assessmentCheckAttempt,
            activeAssessment: activeRequest,
            unpaidProject,
            error: "",
          });
        }
      } catch (checkError) {
        if (active) {
          setAssessmentCheck({
            userId: currentUserId,
            attempt: assessmentCheckAttempt,
            activeAssessment: null,
            unpaidProject: null,
            error: checkError instanceof Error ? checkError.message : "Your active requests could not be checked.",
          });
        }
      }
    }
    void checkActiveAssessment();
    return () => {
      active = false;
    };
  }, [assessmentCheckAttempt, loading, userId]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const form = event.currentTarget;
    const formData = new FormData(form);
    const photos = formData.getAll("sitePhotos").filter((file): file is File => file instanceof File && file.size > 0);
    if (photos.length < 3) {
      setError("Upload at least three photos of the proposed installation area.");
      return;
    }
    if (photos.length > MAX_PHOTOS) {
      setError(`You can upload up to ${MAX_PHOTOS} site photos.`);
      return;
    }
    if (photos.some((file) => !["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size > MAX_PHOTO_BYTES)) {
      setError("Use JPG, PNG, or WebP images no larger than 10 MB each.");
      return;
    }
    if (!user) {
      setError("Sign in to submit and track your assessment request.");
      return;
    }

    setSubmitting(true);
    const uploadedPaths: string[] = [];
    try {
      const supabase = getSupabaseBrowserClient();
      const photoPaths: string[] = [];
      for (const file of photos) {
        const extension = file.type === "image/jpeg" ? "jpg" : file.type === "image/png" ? "png" : "webp";
        const path = `${user.id}/${crypto.randomUUID()}.${extension}`;
        const { error: uploadError } = await supabase.storage
          .from("site-assessment-photos")
          .upload(path, file, { contentType: file.type, upsert: false });
        if (uploadError) throw new Error(`Site photo upload failed: ${uploadError.message}`);
        uploadedPaths.push(path);
        photoPaths.push(path);
      }

      const response = await apiFetch("/api/v1/store/assessments", {
        method: "POST",
        body: JSON.stringify({
          customerInfo: {
            organizationName: String(formData.get("organizationName") ?? "").trim(),
            contactPerson: String(formData.get("contactPerson") ?? "").trim(),
            contactPosition: String(formData.get("contactPosition") ?? "").trim(),
            email: String(formData.get("email") ?? "").trim(),
            contactNumber: String(formData.get("contactNumber") ?? "").trim(),
            organizationAddress: String(formData.get("organizationAddress") ?? "").trim(),
          },
          installationInfo: {
            areaName: String(formData.get("areaName") ?? "").trim(),
            exactLocation: String(formData.get("exactLocation") ?? "").trim(),
            purpose: String(formData.get("purpose") ?? "").trim(),
            estimatedLength: String(formData.get("estimatedLength") ?? "").trim(),
            estimatedWidth: String(formData.get("estimatedWidth") ?? "").trim(),
            estimatedTiles: String(formData.get("estimatedTiles") ?? "").trim(),
            floorMaterial: String(formData.get("floorMaterial") ?? "").trim(),
          },
          preferredAssessmentDate: String(formData.get("preferredAssessmentDate") ?? ""),
          existingLedLighting: String(formData.get("existingLedLighting") ?? ""),
          additionalRemarks: String(formData.get("additionalRemarks") ?? "").trim(),
          sitePhotos: photoPaths,
          interestedProducts: productInterests,
        }),
      });
      const body = (await response.json()) as { assessment: { id: string } };
      router.push(`/account/assessments#${body.assessment.id}`);
    } catch (submitError) {
      if (uploadedPaths.length > 0 && user) {
        const { error: cleanupError } = await getSupabaseBrowserClient()
          .storage.from("site-assessment-photos").remove(uploadedPaths);
        if (cleanupError) console.error("[assessment] Could not remove photos after failed request:", cleanupError.message);
      }
      setError(submitError instanceof Error ? submitError.message : "The site assessment request could not be submitted.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return <p className="storage-message">Loading your account…</p>;
  }
  if (!user) {
    const assessmentUrl = searchParams.size > 0
      ? `/assessment?${searchParams.toString()}`
      : "/assessment";
    return (
      <div className="checkout-empty">
        <h2>Sign in to request an assessment.</h2>
        <p>Your account keeps your site request, visit updates, and project quotation together.</p>
        <Link className="button button-dark" href={`/login?redirectTo=${encodeURIComponent(assessmentUrl)}`}>Sign in <span aria-hidden="true">→</span></Link>
      </div>
    );
  }
  if (checkingAssessments) {
    return <p className="storage-message">Checking your current assessment requests…</p>;
  }
  if (assessmentCheckError) {
    return (
      <section className="checkout-empty">
        <h2>We couldn&apos;t check your assessment requests.</h2>
        <p role="alert">{assessmentCheckError}</p>
        <button className="button button-dark" onClick={() => setAssessmentCheckAttempt((attempt) => attempt + 1)} type="button">Try again</button>
      </section>
    );
  }
  if (unpaidProject) {
    return (
      <section className="checkout-empty">
        <p className="eyebrow">PREVIOUS PROJECT BALANCE REQUIRED</p>
        <h2>Fully pay your previous project balance first.</h2>
        <p>Project {unpaidProject.id.slice(0, 8).toUpperCase()} must have its remaining balance paid and verified before you can request another site assessment.</p>
        <Link className="button button-dark" href="/account/payments">View project payments <span aria-hidden="true">→</span></Link>
      </section>
    );
  }
  if (activeAssessment) {
    return (
      <section className="checkout-empty">
        <p className="eyebrow">REQUEST ALREADY IN PROGRESS</p>
        <h2>You currently have an active site assessment request.</h2>
        <p>Request {activeAssessment.id.slice(0, 8).toUpperCase()} is {activeAssessment.status.replace(/_/g, " ")}. You can submit another request after it is declined or you respond to its quotation.</p>
        <Link className="button button-dark" href={`/account/assessments#${activeAssessment.id}`}>View current request <span aria-hidden="true">→</span></Link>
      </section>
    );
  }

  return (
    <div className="checkout-layout">
      <form className="checkout-form" onSubmit={handleSubmit}>
        <section className="checkout-section">
          <p className="eyebrow">01 / CUSTOMER AND ORGANIZATION</p>
          <h2>Who is requesting the assessment?</h2>
          <div className="checkout-fields">
            <label>Organization / Institution Name<input className={inputClass} autoComplete="organization" maxLength={200} name="organizationName" required /></label>
            <label>Contact Person<input className={inputClass} autoComplete="name" defaultValue={[account?.firstname, account?.lastname].filter(Boolean).join(" ")} maxLength={160} name="contactPerson" required /></label>
            <label>Contact Person&apos;s Position<input className={inputClass} maxLength={160} name="contactPosition" /></label>
            <label>Email Address<input className={inputClass} autoComplete="email" defaultValue={account?.email ?? user.email ?? ""} maxLength={254} name="email" required type="email" /></label>
            <label>Contact Number<input className={inputClass} autoComplete="tel" defaultValue={account?.contactNo ?? ""} maxLength={30} name="contactNumber" required type="tel" /></label>
            <label className="field-wide">Organization Address<textarea className={textareaClass} autoComplete="street-address" maxLength={500} name="organizationAddress" required /></label>
          </div>
        </section>

        <section className="checkout-section">
          <p className="eyebrow">02 / PROPOSED INSTALLATION</p>
          <h2>Tell us about the site.</h2>
          <div className="checkout-fields">
            <label>Installation Area Name<input className={inputClass} maxLength={200} name="areaName" required /></label>
            <label className="field-wide">Exact Installation Location<input className={inputClass} maxLength={500} name="exactLocation" placeholder="Building, floor, entrance, or nearest landmark" required /></label>
            <label className="field-wide">Intended Installation Purpose<textarea className={textareaClass} maxLength={2000} name="purpose" placeholder="For example, pathway lighting or a covered campus entrance" required /></label>
            <label>Estimated Pathway Length (m)<input className={inputClass} min="0" name="estimatedLength" step="0.1" type="number" /></label>
            <label>Estimated Pathway Width (m)<input className={inputClass} min="0" name="estimatedWidth" step="0.1" type="number" /></label>
            <label>Estimated Number of Tiles<input className={inputClass} min="1" name="estimatedTiles" step="1" type="number" defaultValue={directProduct ? requestedQuantity : ""} /></label>
            <label>Current Floor Material<input className={inputClass} maxLength={200} name="floorMaterial" /></label>
            <label className="field-wide">
              Site Photos <span>(required: at least 3, up to 8; JPG, PNG, or WebP; 10 MB max each)</span>
              <input accept="image/jpeg,image/png,image/webp" className={`${inputClass} h-auto py-2`} multiple name="sitePhotos" required type="file" />
            </label>
          </div>
          {productInterests.length > 0 && (
            <div className="mt-4 rounded-lg border border-[#d6ddd4] bg-white p-3 text-xs text-[#152238]">
              <strong>Product interests for planning</strong>
              <ul className="mt-2 list-inside list-disc">{productInterests.map((item) => <li key={item.id}>{item.name} · reference quantity {item.quantity}</li>)}</ul>
            </div>
          )}
        </section>

        <section className="checkout-section">
          <p className="eyebrow">03 / ASSESSMENT DETAILS</p>
          <h2>When can we visit?</h2>
          <div className="checkout-fields">
            <label>Preferred Assessment Date<input className={inputClass} min={localDate()} name="preferredAssessmentDate" required type="date" /></label>
            <label>Existing LED Lighting
              <select className={inputClass} defaultValue="" name="existingLedLighting" required>
                <option disabled value="">Select</option>
                <option value="yes">Yes</option>
                <option value="no">No</option>
                <option value="planned">Planned</option>
                <option value="unknown">Unknown</option>
              </select>
            </label>
            <label className="field-wide">Additional Remarks (optional)<textarea className={textareaClass} maxLength={3000} name="additionalRemarks" /></label>
          </div>
        </section>

        {error && <p className="storage-message" role="alert">{error}</p>}
        <p className="text-xs leading-6 text-[#68736a]">Submitting this request does not place an order or authorize installation. The team will review feasibility, arrange a site visit, and prepare a quotation if appropriate.</p>
        <button className="button button-dark place-order-button" disabled={submitting} type="submit">{submitting ? "Submitting request…" : "Submit site assessment request"} <span aria-hidden="true">→</span></button>
      </form>
      <aside className="order-summary checkout-summary">
        <p className="eyebrow">WHAT HAPPENS NEXT</p>
        <ol className="checkout-line-items list-decimal pl-5 text-xs leading-6 text-[#59645b]">
          <li>Our team reviews your site information and photos.</li>
          <li>If accepted, a site assessor contacts you to coordinate an inspection.</li>
          <li>The assessor records conditions and technical feasibility.</li>
          <li>Admin prepares and sends a project-specific quotation.</li>
        </ol>
        <Link className="text-link mt-3 inline-block" href="/account/assessments">View my assessment requests <span aria-hidden="true">→</span></Link>
      </aside>
    </div>
  );
}
