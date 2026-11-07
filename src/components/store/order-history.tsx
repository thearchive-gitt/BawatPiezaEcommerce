"use client";

import Link from "next/link";
import { useCart, type Order } from "@/components/store/cart-provider";
import { useAuth } from "@/components/auth-provider";
import { formatPrice } from "@/data/products";
import OrderTracking from "@/components/store/order-tracking";
import PaymentResultModal from "@/components/store/payment-result-modal";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import LoadingTile from "@/components/ui/loading-tile";

function getOrderItemCountLabel(order: Order) {
  const count = order.items.reduce((total, item) => total + item.quantity, 0);
  return `${count} ${count === 1 ? "item" : "items"}`;
}

function OrderCard({ order, showTracking = false, onCancel }: { order: Order; showTracking?: boolean; onCancel?: (orderId: string) => Promise<Order> }) {
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState("");
  const canCancel = Boolean(onCancel) && !["delivered", "cancelled"].includes(order.deliveryStatus);

  async function handleCancel() {
    if (!onCancel || !window.confirm("Cancel this order? Any reserved stock will be released.")) return;
    setCancelling(true);
    setCancelError("");
    try {
      await onCancel(order.id);
    } catch (error) {
      setCancelError(error instanceof Error ? error.message : "The order could not be cancelled.");
    } finally {
      setCancelling(false);
    }
  }

  return (
    <article className="history-card" id={order.id} key={order.id}>
      <div className="history-card-top">
        <div>
          <p className="eyebrow">ORDER REFERENCE</p>
          <h2>{order.id}</h2>
        </div>
        <span className={`order-status${order.deliveryStatus === "cancelled" ? " is-cancelled" : ""}`}><span aria-hidden="true">●</span> {order.deliveryStatus === "cancelled" ? "Order cancelled" : order.paymentStatus === "paid" ? "Payment received" : order.paymentMethod === "gcash" ? "Payment pending" : "COD order received"}</span>
      </div>
      <div className="history-meta">
        <span><small>PLACED</small>{new Date(order.createdAt).toLocaleDateString("en-PH", { year: "numeric", month: "short", day: "numeric" })}</span>
        <span><small>ITEMS</small>{getOrderItemCountLabel(order)}</span>
        <strong><small>TOTAL</small>{formatPrice(order.total)}</strong>
      </div>
      <div className="history-products">
        {order.items.map((item) => (
          <span className="history-product-chip" key={item.product.id}>{item.product.name} <b>× {item.quantity}</b></span>
        ))}
      </div>
      {showTracking ? (
        <>
          <OrderTracking order={order} />
          {canCancel && (
            <div className="order-cancel-actions">
              <button className="order-cancel-button" disabled={cancelling} onClick={() => void handleCancel()} type="button">
                {cancelling ? "Cancelling..." : "Cancel this order"}
              </button>
              <span>Paid orders are marked cancelled and removed from revenue totals.</span>
            </div>
          )}
          {cancelError && <p className="form-error" role="alert">{cancelError}</p>}
        </>
      ) : (
        <Link className="text-link" href={`/orders#${order.id}`}>
          View order details <span aria-hidden="true">→</span>
        </Link>
      )}
    </article>
  );
}

export default function OrderHistory() {
  const { orders, storageMessage, cancelOrder } = useCart();
  const { user, loading } = useAuth();
  const searchParams = useSearchParams();
  const paymentSucceeded = searchParams.get("payment") === "success";
  const activeOrder = orders.find((order) => !["delivered", "cancelled"].includes(order.deliveryStatus)) ?? orders[0];

  if (loading) {
    return <main className="page-shell orders-page"><LoadingTile label="Loading purchase history" detail="Fetching your latest order and delivery updates." /></main>;
  }

  if (!user) {
    return (
      <>
      <main className="page-shell orders-page">
        <section className="empty-cart order-empty">
          <span className="empty-cart-mark" aria-hidden="true">⌁</span>
          <h2>Sign in to view your orders.</h2>
          <p>Your order history is available after signing in to your Bawat Pieza account.</p>
          <Link className="button button-dark" href="/login">Sign in <span aria-hidden="true">→</span></Link>
        </section>
      </main>
      {paymentSucceeded && (
        <PaymentResultModal
          closePath="/orders"
          kind="success"
          message="Your GCash payment was received. We will begin processing your order shortly."
          title="Thank you for your payment."
        />
      )}
      </>
    );
  }

  return (
    <main className="page-shell orders-page">
      <section className="page-intro orders-intro">
        <p className="eyebrow">YOUR BAWAT PIEZA PURCHASES</p>
        <h1>Purchase history.</h1>
        <p>Track your active delivery and review every purchase in one place.</p>
      </section>
      {storageMessage && <p className="storage-message" role="status">{storageMessage}</p>}
      {orders.length === 0 ? (
        <section className="empty-cart order-empty">
          <span className="empty-cart-mark" aria-hidden="true">⌁</span>
          <h2>No orders to track yet.</h2>
          <p>Your orders will appear here after checkout.</p>
          <Link className="button button-dark" href="/shop">Explore components <span aria-hidden="true">↗</span></Link>
        </section>
      ) : (
        <>
          <section className="active-order-panel">
            <div className="section-heading-row">
              <div>
                <p className="eyebrow">ACTIVE ORDER</p>
                <h2>Track your latest delivery.</h2>
              </div>
              <span className="active-order-badge">In progress</span>
            </div>
            <OrderCard order={activeOrder} showTracking onCancel={cancelOrder} />
          </section>
          {orders.filter((order) => order.id !== activeOrder.id).length > 0 && (
            <section className="purchase-history-section">
              <div className="section-heading-row">
                <div>
                  <p className="eyebrow">PURCHASE HISTORY</p>
                  <h2>Past purchases.</h2>
                </div>
                <span className="purchase-count">{orders.filter((order) => order.id !== activeOrder.id).length} previous</span>
              </div>
              <div className="order-history-list">
                {orders.filter((order) => order.id !== activeOrder.id).map((order) => <OrderCard key={order.id} order={order} />)}
              </div>
            </section>
          )}
        </>
      )}
    </main>
  );
}
