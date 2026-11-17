import { notFound, redirect } from "next/navigation";
import { getProduct } from "@/data/products";

export default async function ProductQuantityPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ quantity?: string }>;
}) {
  const [{ slug }, query] = await Promise.all([params, searchParams]);
  const product = getProduct(slug);
  if (!product) notFound();

  const quantity = Number(query.quantity);
  const validQuantity = Number.isSafeInteger(quantity) && quantity > 0 ? quantity : 1;
  redirect(`/assessment?productId=${encodeURIComponent(product.id)}&quantity=${validQuantity}`);
}
