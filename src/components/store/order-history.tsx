"use client";

import Link from "next/link";
import { useCart, type Order } from "@/components/store/cart-provider";
import { useAuth } from "@/components/auth-provider";
import { formatPrice } from "@/data/products";
import OrderTracking from "@/components/store/order-tracking";

function getOrderItemCountLabel(order: Order) {
  const count = order.items.reduce((total, item) => total + item.quantity, 0);
  return `${count} ${count === 1 ? "item" : "items"}`;
}

export default function OrderHistory() {
  const { orders, storageMessage } = useCart();
  const { user, loading } = useAuth();

  if (loading) {
    return <main className="page-shell orders-page"><p className="storage-message">Loading your account…</p></main>;
  }

  if (!user) {
    return (
      <main className="page-shell orders-page">
        <section className="empty-cart order-empty">
          <span className="empty-cart-mark" aria-hidden="true">⌁</span>
          <h2>Sign in to view your orders.</h2>
          <p>Your order history is available after signing in to your Bawat Pieza account.</p>
          <Link className="button button-dark" href="/login">Sign in <span aria-hidden="true">→</span></Link>
        </section>
      </main>
    );
  }

  return (
    <main className="page-shell orders-page">
      <section className="page-intro orders-intro">
        <p className="eyebrow">YOUR BAWAT PIEZA PURCHASES</p>
        <h1>Order history.</h1>
        <p>View locally saved demo orders and their tracking status.</p>
      </section>
      {storageMessage && <p className="storage-message" role="status">{storageMessage}</p>}
      {orders.length === 0 ? (
        <section className="empty-cart order-empty">
          <span className="empty-cart-mark" aria-hidden="true">⌁</span>
          <h2>No orders to track yet.</h2>
          <p>Your demo orders will appear here after checkout on this browser.</p>
          <Link className="button button-dark" href="/shop">Explore components <span aria-hidden="true">↗</span></Link>
        </section>
      ) : (
        <section className="order-history-list">
          {orders.map((order) => (
            <article className="history-card" id={order.id} key={order.id}>
              <div className="history-card-top">
                <div>
                  <p className="eyebrow">ORDER REFERENCE</p>
                  <h2>{order.id}</h2>
                </div>
                <span className="order-status"><span aria-hidden="true">●</span> Demo order received</span>
              </div>
              <div className="history-meta">
                <span>{new Date(order.createdAt).toLocaleDateString("en-PH", { year: "numeric", month: "short", day: "numeric" })}</span>
                <span>{getOrderItemCountLabel(order)}</span>
                <strong>{formatPrice(order.total)}</strong>
              </div>
              <div className="history-products">
                {order.items.map((item) => (
                  <span key={item.product.id}>{item.product.name} × {item.quantity}</span>
                ))}
              </div>
              <Link className="text-link" href={`/orders#${order.id}`}>
                Track this order <span aria-hidden="true">→</span>
              </Link>
              <OrderTracking order={order} />
            </article>
          ))}
        </section>
      )}
    </main>
  );
}
