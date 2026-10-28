"use client";

import { useMemo, useState } from "react";
import ProductGrid from "@/components/store/product-grid";
import type { Product } from "@/data/products";

export default function ProductCatalog({ products }: { products: Product[] }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All components");
  const categories = [
    "All components",
    ...Array.from(new Set(products.map((product) => product.category))),
  ];

  const filteredProducts = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return products.filter((product) => {
      const matchesCategory =
        category === "All components" || product.category === category;
      const searchableText = [
        product.name,
        product.category,
        product.description,
        ...product.specifications.flatMap((item) => [item.label, item.value]),
      ]
        .join(" ")
        .toLowerCase();
      return (
        matchesCategory &&
        (!normalizedQuery || searchableText.includes(normalizedQuery))
      );
    });
  }, [category, products, query]);

  return (
    <>
      <div className="catalog-controls">
        <label className="catalog-search">
          <span className="visually-hidden">Search products</span>
          <span aria-hidden="true">⌕</span>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search tiles, piezo, dynamo..."
          />
        </label>
        <label className="catalog-filter">
          <span className="visually-hidden">Filter by category</span>
          <select
            value={category}
            onChange={(event) => setCategory(event.target.value)}
          >
            {categories.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="catalog-results" aria-live="polite">
        <span>
          {filteredProducts.length}{" "}
          {filteredProducts.length === 1 ? "product" : "products"}
        </span>
        <span>Prices in Philippine pesos <span aria-hidden="true">₱</span></span>
      </div>
      {filteredProducts.length > 0 ? (
        <ProductGrid products={filteredProducts} columns={4} />
      ) : (
        <div className="catalog-empty">
          <h2>No components found.</h2>
          <p>Try a different search or product category.</p>
        </div>
      )}
      <p className="catalog-disclaimer">
        *Peak output figures are prototype estimates and vary with installation,
        load, and step force. See each product for specifications.
      </p>
    </>
  );
}
