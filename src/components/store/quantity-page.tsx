"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth-provider";
import { useCart } from "@/components/store/cart-provider";
import { formatPrice, type Product } from "@/data/products";

export default function QuantityPage({
  product,
  initialQuantity = 1,
}: {
  product: Product;
  initialQuantity?: number;
}) {
  const router = useRouter();
  const { user, loading } = useAuth();
  const { addItem, availableStock, items } = useCart();
  const stock = availableStock(product.id);
  const existingQuantity =
    items.find((item) => item.product.id === product.id)?.quantity ?? 0;
  const [quantity, setQuantity] = useState(Math.min(initialQuantity, Math.max(stock, 1)));
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!loading && !user) {
      router.replace(
        `/login?redirectTo=${encodeURIComponent(`/shop/${product.id}/quantity`)}`,
      );
    }
  }, [loading, product.id, router, user]);

  if (loading || !user) {
    return (
      <main className="page-shell quantity-page">
        <p className="eyebrow">ACCOUNT REQUIRED</p>
        <h1>Sign in to choose your tiles.</h1>
      </main>
    );
  }

  const canAdd = quantity >= 1 && (stock === 0 || quantity <= stock);

  function changeQuantity(nextQuantity: number) {
    setMessage("");
    setQuantity(Math.min(Math.max(1, nextQuantity), Math.max(stock, 1)));
  }

  function handleAdd() {
    if (!canAdd) return;
    addItem(product, quantity);
    setMessage(
      `${quantity} ${quantity === 1 ? "tile" : "tiles"} added to your bag.`,
    );
  }

  return (
    <main className="page-shell quantity-page">
      <nav className="breadcrumbs" aria-label="Breadcrumb">
        <Link href="/shop">Shop</Link>
        <span aria-hidden="true">/</span>
        <Link href={`/shop/${product.id}`}>{product.name}</Link>
        <span aria-hidden="true">/</span>
        <span aria-current="page">Choose quantity</span>
      </nav>

      <section className="quantity-layout">
        <div className="quantity-preview" aria-live="polite">
          <div className="tile-animation" aria-label={`${quantity} tiles preview`}>
            {Array.from({ length: quantity }, (_, index) => (
              <span
                className="animated-tile"
                key={`${product.id}-${index}`}
                style={{ animationDelay: `${index * 90}ms` }}
              />
            ))}
          </div>
          <p className="quantity-preview-caption">
            Every tile adds another step to your installation.
          </p>
        </div>

        <div className="quantity-copy">
          <p className="eyebrow">{product.category.toUpperCase()}</p>
          <h1>How many tiles do you need?</h1>
          <p>
            Build your installation one tile at a time. Choose a quantity and
            preview the growing layout before adding it to your bag.
          </p>
          <div className="quantity-control" aria-label="Tile quantity">
            <button
              type="button"
              onClick={() => changeQuantity(quantity - 1)}
              disabled={quantity <= 1}
              aria-label="Decrease quantity"
            >
              −
            </button>
            <strong>{quantity}</strong>
            <button
              type="button"
              onClick={() => changeQuantity(quantity + 1)}
              disabled={quantity >= stock}
              aria-label="Increase quantity"
            >
              +
            </button>
          </div>
          <p className="quantity-total">
            {formatPrice(product.price * quantity)}{" "}
            <span>{formatPrice(product.price)} per tile</span>
          </p>
          <p className="quantity-stock">
            {stock > 0 ? `${stock} available` : "Currently out of stock · you can save it to your bag"}
            {existingQuantity > 0 && ` · ${existingQuantity} already in your bag`}
          </p>
          <button
            className="button button-dark quantity-add-button"
            type="button"
            disabled={!canAdd}
            onClick={handleAdd}
          >
            {stock > 0 ? "Add tiles to bag" : "Save to bag for later"}{" "}
            <span aria-hidden="true">→</span>
          </button>
          {message && (
            <p className="quantity-success" role="status">
              {message} <Link href="/cart">View bag</Link>
            </p>
          )}
        </div>
      </section>
    </main>
  );
}
