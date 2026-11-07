"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiFetch } from "@/lib/api";

type Notification = {
  id: string;
  type: string;
  title: string;
  message: string;
  read_at: string | null;
  created_at: string;
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void apiFetch("/api/v1/notifications")
      .then(async (response) => {
        const body = (await response.json()) as { notifications?: Notification[] };
        setNotifications(body.notifications ?? []);
      })
      .finally(() => setLoading(false));
  }, []);

  async function markRead(id: string) {
    const notification = notifications.find((item) => item.id === id);
    if (!notification || notification.read_at) return;
    await apiFetch(`/api/v1/notifications/${id}/read`, { method: "PATCH" });
    setNotifications((current) => current.map((item) => item.id === id ? { ...item, read_at: new Date().toISOString() } : item));
  }

  return (
    <main className="page-shell notifications-page">
      <nav className="breadcrumbs" aria-label="Breadcrumb">
        <Link href="/account">Account</Link><span aria-hidden="true">/</span><span aria-current="page">Notifications</span>
      </nav>
      <section className="page-intro">
        <p className="eyebrow">ACCOUNT UPDATES</p>
        <h1>Notifications</h1>
        <p>Keep track of orders, payments, delivery updates, and support activity.</p>
      </section>
      <section className="notifications-full-list" aria-label="All notifications">
        {loading ? <p className="notifications-empty">Loading notifications...</p> : notifications.length === 0 ? (
          <p className="notifications-empty">No updates yet.</p>
        ) : notifications.map((notification) => (
          <button className={`notifications-full-item${notification.read_at ? "" : " is-unread"}`} key={notification.id} onClick={() => void markRead(notification.id)} type="button">
            <span className="notifications-full-dot" aria-hidden="true" />
            <span className="notifications-full-content">
              <strong>{notification.title}</strong>
              <span>{notification.message}</span>
              <small>{new Date(notification.created_at).toLocaleString("en-PH")}</small>
            </span>
          </button>
        ))}
      </section>
    </main>
  );
}
