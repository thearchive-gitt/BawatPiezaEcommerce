"use client";

import { useEffect, useState } from "react";
import { Bell, X } from "lucide-react";
import { apiFetch } from "@/lib/api";
import Link from "next/link";
import { useRouter } from "next/navigation";
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

export default function NotificationsBell() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);
  const [deletingId, setDeletingId] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const response = await apiFetch("/api/v1/notifications");
        const body = (await response.json()) as { notifications?: Notification[] };
        if (active) setNotifications(body.notifications ?? []);
      } catch {
        // Notification delivery must not interrupt storefront navigation.
      }
    };
    void load();
    const timer = window.setInterval(() => void load(), 15000);
    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, []);

  const unreadCount = notifications.filter((notification) => !notification.read_at).length;

  async function markRead(notification: Notification) {
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
  }

  async function openNotification(notification: Notification) {
    await markRead(notification);
    setOpen(false);
    router.push(getEcommerceNotificationHref(notification));
  }

  async function deleteNotification(notification: Notification) {
    setDeletingId(notification.id);
    setError("");
    try {
      await apiFetch(`/api/v1/notifications/${encodeURIComponent(notification.id)}`, { method: "DELETE" });
      setNotifications((current) => current.filter((item) => item.id !== notification.id));
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Notification could not be deleted.");
    } finally {
      setDeletingId("");
    }
  }

  return (
    <div className="notifications-menu">
      <button
        aria-expanded={open}
        aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ""}`}
        className="notifications-trigger"
        onClick={() => setOpen((current) => !current)}
        type="button"
      >
        <Bell aria-hidden="true" size={17} strokeWidth={1.8} />
        {unreadCount > 0 && <b>{unreadCount > 9 ? "9+" : unreadCount}</b>}
      </button>
      {open && (
        <div className="notifications-dropdown">
          <div className="notifications-heading">
            <strong>Notifications</strong>
            <span>{unreadCount ? `${unreadCount} new` : "All caught up"}</span>
          </div>
          {error && <p className="notifications-error" role="alert">{error}</p>}
          {notifications.length === 0 ? (
            <p className="notifications-empty">No updates yet.</p>
          ) : notifications.map((notification) => (
            <div className={`notification-row${notification.read_at ? "" : " is-unread"}`} key={notification.id}>
              <button
                className={`notification-item${notification.read_at ? "" : " is-unread"}`}
                onClick={() => void openNotification(notification)}
                type="button"
              >
                <strong>{notification.title}</strong>
                <span>{notification.message}</span>
                <small>{new Date(notification.created_at).toLocaleString("en-PH")}</small>
              </button>
              <button
                aria-label={`Delete notification: ${notification.title}`}
                className="notification-delete"
                disabled={deletingId === notification.id}
                onClick={() => void deleteNotification(notification)}
                title="Delete notification"
                type="button"
              >
                <X aria-hidden="true" size={15} />
              </button>
            </div>
          ))}
          <Link className="notifications-view-all" href="/account/notifications" onClick={() => setOpen(false)}>
            View all notifications
          </Link>
        </div>
      )}
    </div>
  );
}
