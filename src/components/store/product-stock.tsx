"use client";

import { useCart } from "@/components/store/cart-provider";

export default function ProductStock({
  productId,
  detail = false,
}: {
  productId: string;
  detail?: boolean;
}) {
  const { availableStock } = useCart();
  const stock = availableStock(productId);
  const className = detail
    ? stock > 0
      ? "detail-stock"
      : "detail-stock out-of-stock"
    : stock > 0
      ? "stock-label"
      : "stock-label out-of-stock";

  return (
    <p className={className}>
      {detail && <span aria-hidden="true">●</span>}
      {stock > 0 ? (detail ? `In stock · ${stock} available` : `${stock} in stock`) : "Out of stock"}
    </p>
  );
}
