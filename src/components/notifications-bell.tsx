"use client";

import { useEffect, useState } from "react";
import { Bell } from "lucide-react";
import { apiFetch } from "@/lib/api";
import Link from "next/link";

type Notification = {
  id: string;
  title: string;
  message: string;
  read_at: string | null;
  created_at: string;
};

export default function NotificationsBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);

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
      await apiFetch(`/api/v1/notifications/${notification.id}/read`, { method: "PATCH" });
      setNotifications((current) => current.map((item) =>
        item.id === notification.id ? { ...item, read_at: new Date().toISOString() } : item,
      ));
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
          {notifications.length === 0 ? (
            <p className="notifications-empty">No updates yet.</p>
          ) : notifications.map((notification) => (
            <button
              className={`notification-item${notification.read_at ? "" : " is-unread"}`}
              key={notification.id}
              onClick={() => void markRead(notification)}
              type="button"
            >
              <strong>{notification.title}</strong>
              <span>{notification.message}</span>
              <small>{new Date(notification.created_at).toLocaleString("en-PH")}</small>
            </button>
          ))}
          <Link className="notifications-view-all" href="/account/notifications" onClick={() => setOpen(false)}>
            View all notifications
          </Link>
        </div>
      )}
    </div>
  );
}
