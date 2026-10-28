import type { Metadata } from "next";
import OrderHistory from "@/components/store/order-history";

export const metadata: Metadata = {
  title: "Order history",
  description: "View your Bawat Pieza orders and tracking status.",
};

export default function OrdersPage() {
  return <OrderHistory />;
}
