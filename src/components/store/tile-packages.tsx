import Link from "next/link";
import { products } from "@/data/products";

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
  if (!tile) return null;

  return (
    <section className="section pricing-section" id="packages">
      <div className="pricing-heading">
        <p className="eyebrow">CHOOSE YOUR INSTALLATION</p>
        <h2>Start with the right number of tiles.</h2>
        <p>
          Every package includes the same kinetic floor tile. Choose a reference
          quantity and request an assessment before the project is quoted.
        </p>
      </div>
      <div className="pricing-grid">
        {packages.map((plan) => {
          return (
            <article className={`pricing-card${plan.popular ? " pricing-card-popular" : ""}`} key={plan.name}>
              {plan.popular && <span className="pricing-badge">MOST POPULAR</span>}
              <p className="eyebrow">{plan.name.toUpperCase()} PACKAGE</p>
              <h3>{plan.tiles} {plan.tiles === 1 ? "tile" : "tiles"}</h3>
              <p className="pricing-description">{plan.description}</p>
              <div className="pricing-price">
                <strong>Quoted after assessment</strong>
                <span>{plan.tiles} reference {plan.tiles === 1 ? "tile" : "tiles"}</span>
              </div>
              <ul className="pricing-features">
                {plan.features.map((feature) => <li key={feature}><span aria-hidden="true">✓</span>{feature}</li>)}
              </ul>
              <Link
                className="button button-dark pricing-button"
                href={`/assessment?productId=${encodeURIComponent(tile.id)}&quantity=${plan.tiles}`}
              >
                Request site assessment{" "}
                <span aria-hidden="true">→</span>
              </Link>
              <Link className="pricing-detail-link" href="/shop/kinetic-floor-tile">View tile details</Link>
            </article>
          );
        })}
      </div>
      <p className="pricing-note">
        Final tile quantities, feasibility, and project pricing are confirmed after the site visit.
      </p>
    </section>
  );
}
