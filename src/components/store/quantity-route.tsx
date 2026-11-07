"use client";

import { notFound, useParams, useSearchParams } from "next/navigation";
import QuantityPage from "@/components/store/quantity-page";
import { getProduct } from "@/data/products";

export default function QuantityRoute() {
  const { slug } = useParams<{ slug: string }>();
  const searchParams = useSearchParams();
  const product = getProduct(slug);
  if (!product) notFound();

  const parsedQuantity = Number(searchParams.get("quantity"));
  const initialQuantity =
    Number.isInteger(parsedQuantity) && parsedQuantity > 0 ? parsedQuantity : 1;

  return <QuantityPage initialQuantity={initialQuantity} product={product} />;
}
