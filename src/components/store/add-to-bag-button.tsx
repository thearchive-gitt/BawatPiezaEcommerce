"use client";

import { useState } from "react";
import { useCart } from "@/components/store/cart-provider";
import type { Product } from "@/data/products";

export default function AddToBagButton({ product }: { product: Product }) {
  const { addItem, availableStock, items } = useCart();
  const [added, setAdded] = useState(false);
  const [unavailable, setUnavailable] = useState(false);

  function handleAdd() {
    const stock = availableStock(product.id);
    if (stock < 1) return;
    const currentQuantity =
      items.find((item) => item.product.id === product.id)?.quantity ?? 0;
    if (currentQuantity >= stock) {
      setUnavailable(true);
      setAdded(false);
      return;
    }
    addItem(product);
    setAdded(true);
    setUnavailable(false);
    window.setTimeout(() => setAdded(false), 1400);
  }

  return (
    <button
      className="add-button"
      onClick={handleAdd}
      type="button"
      disabled={availableStock(product.id) < 1}
    >
      {availableStock(product.id) < 1
        ? "Out of stock"
        : unavailable
          ? "Stock limit reached"
          : added
            ? "Added to bag ✓"
            : "Add to bag"}
    </button>
  );
}
