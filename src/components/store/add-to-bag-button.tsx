"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useCart } from "@/components/store/cart-provider";
import { useAuth } from "@/components/auth-provider";
import type { Product } from "@/data/products";

export default function AddToBagButton({ product }: { product: Product }) {
  const { availableStock } = useCart();
  const { user, loading } = useAuth();
  const router = useRouter();
  const [redirecting, setRedirecting] = useState(false);

  function handleAdd() {
    if (!user) {
      setRedirecting(true);
      router.push(
        `/login?redirectTo=${encodeURIComponent(`/shop/${product.id}/quantity`)}`,
      );
      return;
    }

    router.push(`/shop/${product.id}/quantity`);
  }

  return (
    <button
      className="add-button"
      onClick={handleAdd}
      type="button"
      disabled={loading || redirecting}
    >
      {loading
        ? "Checking account..."
        : redirecting
        ? "Taking you to sign in..."
        : availableStock(product.id) < 1
        ? "Add to cart · out of stock"
        : "Add to cart"}
    </button>
  );
}
