import type { Order } from "@/components/store/cart-provider";

const steps = [
  { key: "received", title: "Order received", detail: "Your purchase is confirmed" },
  { key: "preparing", title: "Preparing order", detail: "Our team is preparing your order" },
  { key: "pickup", title: "Courier pickup", detail: "Your order is with the courier" },
  { key: "delivered", title: "Delivered", detail: "Delivery confirmed" },
] as const;

export default function OrderTracking({ order }: { order: Order }) {
  const currentIndex = order.deliveryStatus === "cancelled"
    ? -1
    : steps.findIndex((step) => step.key === order.deliveryStatus);
  return (
    <div className="order-tracking-inline">
      <div className="tracking-reference">
        <div>
          <p className="eyebrow">TRACKING STATUS</p>
          <h3>{order.id}</h3>
        </div>
        <span className={`tracking-live${order.deliveryStatus === "cancelled" ? " is-cancelled" : ""}`}>
          <i aria-hidden="true" /> {order.deliveryStatus === "cancelled" ? "Order cancelled" : steps[currentIndex]?.title ?? "Order received"}
        </span>
      </div>
      <ol className="tracking-timeline">
        {steps.map((step, index) => (
          <li className={index <= currentIndex ? "tracking-step is-complete" : "tracking-step"} key={step.title}>
            <span className="tracking-step-marker">{index <= currentIndex ? "✓" : String(index + 1).padStart(2, "0")}</span>
            <div>
              <h4>{step.title}</h4>
              <p>{step.detail}</p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
