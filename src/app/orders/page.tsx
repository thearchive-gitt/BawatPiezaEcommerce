import type { Metadata } from "next";
import { Suspense } from "react";
import OrderHistory from "@/components/store/order-history";
import LoadingTile from "@/components/ui/loading-tile";

export const metadata: Metadata = {
  title: "Order history",
  description: "View your Bawat Pieza orders and tracking status.",
};

export default function OrdersPage() {
  return (
    <Suspense fallback={<main className="page-shell orders-page"><LoadingTile label="Loading orders" /></main>}>
      <OrderHistory />
    </Suspense>
  );
}
