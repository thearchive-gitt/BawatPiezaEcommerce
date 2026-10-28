import type { Order } from "@/components/store/cart-provider";

const steps = [
  { title: "Demo order received", detail: "Saved in this browser", complete: true },
  { title: "Preparing order", detail: "Awaiting fulfillment integration", complete: false },
  { title: "Courier pickup", detail: "Live carrier tracking is not connected", complete: false },
  { title: "Delivered", detail: "Delivery confirmation is not connected", complete: false },
];

export default function OrderTracking({ order }: { order: Order }) {
  return (
    <div className="order-tracking-inline">
      <div className="tracking-reference">
        <div>
          <p className="eyebrow">TRACKING STATUS</p>
          <h3>{order.id}</h3>
        </div>
        <span className="order-status"><span aria-hidden="true">●</span> Demo order received</span>
      </div>
      <ol className="tracking-timeline">
        {steps.map((step, index) => (
          <li className={step.complete ? "tracking-step is-complete" : "tracking-step"} key={step.title}>
            <span className="tracking-step-marker">{step.complete ? "✓" : String(index + 1).padStart(2, "0")}</span>
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
