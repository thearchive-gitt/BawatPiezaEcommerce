"use client";

import Link from "next/link";
import { useCart } from "@/components/store/cart-provider";
import { formatPrice, products } from "@/data/products";

const tile = products.find((product) => product.id === "kinetic-floor-tile");

const packages = [
  {
    name: "Starter",
    tiles: 1,
    description: "A practical first tile for home demonstrations, prototypes, and small spaces.",
    features: ["1 kinetic floor tile", "Piezoelectric + dynamo-assisted conversion", "Indoor modular installation"],
  },
  {
    name: "Room",
    tiles: 4,
    description: "A four-tile set for a visible installation in an entryway, classroom, or workspace.",
    features: ["4 kinetic floor tiles", "Connected modular layout", "Best for small installation zones"],
    popular: true,
  },
  {
    name: "Installation",
    tiles: 9,
    description: "A larger package for high-footfall areas and more complete energy-harvesting experiments.",
    features: ["9 kinetic floor tiles", "Expanded modular coverage", "Best for pilot installations"],
  },
];

export default function TilePackages() {
  const { addItem, availableStock } = useCart();

  if (!tile) return null;

  return (
    <section className="section pricing-section" id="packages">
      <div className="pricing-heading">
        <p className="eyebrow">CHOOSE YOUR INSTALLATION</p>
        <h2>Start with the right number of tiles.</h2>
        <p>
          Every package includes the same kinetic floor tile. Choose how much
          surface area you want to cover, then place the package in your bag.
        </p>
      </div>
      <div className="pricing-grid">
        {packages.map((plan) => {
          const packagePrice = tile.price * plan.tiles;
          const canAdd = availableStock(tile.id) >= plan.tiles;

          return (
            <article className={`pricing-card${plan.popular ? " pricing-card-popular" : ""}`} key={plan.name}>
              {plan.popular && <span className="pricing-badge">MOST POPULAR</span>}
              <p className="eyebrow">{plan.name.toUpperCase()} PACKAGE</p>
              <h3>{plan.tiles} {plan.tiles === 1 ? "tile" : "tiles"}</h3>
              <p className="pricing-description">{plan.description}</p>
              <div className="pricing-price">
                <strong>{formatPrice(packagePrice)}</strong>
                <span>{formatPrice(tile.price)} per tile</span>
              </div>
              <ul className="pricing-features">
                {plan.features.map((feature) => <li key={feature}><span aria-hidden="true">✓</span>{feature}</li>)}
              </ul>
              <button
                className="button button-dark pricing-button"
                disabled={!canAdd}
                onClick={() => addItem(tile, plan.tiles)}
                type="button"
              >
                {canAdd ? "Add package to bag" : "Package unavailable"} <span aria-hidden="true">→</span>
              </button>
              <Link className="pricing-detail-link" href="/shop/kinetic-floor-tile">View tile details</Link>
            </article>
          );
        })}
      </div>
      <p className="pricing-note">
        Package prices are based on the current ₱4,850 tile price. Delivery is
        free on orders of ₱5,000 or more.
      </p>
    </section>
  );
}
