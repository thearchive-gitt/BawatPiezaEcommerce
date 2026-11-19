"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { getEcommerceNotificationHref } from "@/lib/notification-navigation";

type Notification = {
  id: string;
  type: string;
  title: string;
  message: string;
  entity_type?: string | null;
  entity_id?: string | null;
  read_at: string | null;
  created_at: string;
};

export default function NotificationsPage() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    void apiFetch("/api/v1/notifications")
      .then(async (response) => {
        const body = (await response.json()) as { notifications?: Notification[] };
        setNotifications(body.notifications ?? []);
      })
      .catch((loadError: unknown) => {
        setError(loadError instanceof Error ? loadError.message : "Notifications could not be loaded.");
      })
      .finally(() => setLoading(false));
  }, []);

  async function openNotification(notification: Notification) {
    if (!notification.read_at) {
      try {
        await apiFetch(`/api/v1/notifications/${encodeURIComponent(notification.id)}/read`, { method: "PATCH" });
        setNotifications((current) => current.map((item) =>
          item.id === notification.id ? { ...item, read_at: new Date().toISOString() } : item,
        ));
      } catch (readError) {
        setError(readError instanceof Error ? readError.message : "Notification could not be marked as read.");
      }
    }
    router.push(getEcommerceNotificationHref(notification));
  }

  return (
    <main className="page-shell notifications-page">
      <nav className="breadcrumbs" aria-label="Breadcrumb">
        <Link href="/account">Account</Link><span aria-hidden="true">/</span><span aria-current="page">Notifications</span>
      </nav>
      <section className="notifications-full-list" aria-label="All notifications">
        {error && <p className="form-error" role="alert">{error}</p>}
        {loading ? <p className="notifications-empty">Loading notifications...</p> : notifications.length === 0 ? (
          <p className="notifications-empty">No updates yet.</p>
        ) : notifications.map((notification) => (
          <button className={`notifications-full-item${notification.read_at ? "" : " is-unread"}`} key={notification.id} onClick={() => void openNotification(notification)} type="button">
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
