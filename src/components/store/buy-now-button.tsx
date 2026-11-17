"use client";

import Link from "next/link";
import type { Product } from "@/data/products";

export default function BuyNowButton({ product }: { product: Product }) {
  return (
    <Link
      className="button button-outline buy-now-button"
      href={`/assessment?productId=${encodeURIComponent(product.id)}`}
    >
      Request site assessment <span aria-hidden="true">↗</span>
    </Link>
  );
}
