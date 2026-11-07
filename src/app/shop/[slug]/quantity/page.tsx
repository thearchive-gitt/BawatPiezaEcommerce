import { Suspense } from "react";
import QuantityRoute from "@/components/store/quantity-route";

export default function ProductQuantityPage() {
  return (
    <Suspense fallback={<main className="page-shell quantity-page" />}>
      <QuantityRoute />
    </Suspense>
  );
}
