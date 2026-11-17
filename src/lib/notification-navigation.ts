type EcommerceNotificationTarget = {
  type?: string | null;
  entity_type?: string | null;
  entity_id?: string | null;
};

export function getEcommerceNotificationHref(notification: EcommerceNotificationTarget) {
  if (notification.entity_type === "site_assessment") {
    const anchor = notification.entity_id ? `#${encodeURIComponent(notification.entity_id)}` : "";
    if (notification.type?.includes("payment")) return `/account/payments${anchor}`;
    return `/account/assessments${anchor}`;
  }
  if (notification.entity_type === "user_concern") return "/contact";
  return "/account/notifications";
}
