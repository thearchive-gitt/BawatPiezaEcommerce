import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Site assessment",
  description: "Request a BawatPieza site assessment before receiving a project quotation.",
};

export default function CheckoutPage() {
  redirect("/assessment");
}
