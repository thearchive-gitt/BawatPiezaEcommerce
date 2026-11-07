import type { Metadata } from "next";
import { Suspense } from "react";
import OrderHistory from "@/components/store/order-history";
import LoadingTile from "@/components/ui/loading-tile";

export const metadata: Metadata = {
  title: "Purchase history",
  description: "Track active deliveries and review Bawat Pieza purchases.",
};

export default function AccountOrdersPage() {
  return (
    <Suspense fallback={<main className="page-shell orders-page"><LoadingTile label="Loading purchase history" /></main>}>
      <OrderHistory />
    </Suspense>
  );
}
