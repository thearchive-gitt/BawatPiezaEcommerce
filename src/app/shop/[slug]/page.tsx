import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ProductDetail from "@/components/store/product-detail";
import { getProduct, products } from "@/data/products";

type ProductPageProps = {
  params: Promise<{ slug: string }>;
};

export const instant = false;

export function generateStaticParams() {
  return products.map((product) => ({ slug: product.id }));
}

export async function generateMetadata({
  params,
}: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = getProduct(slug);
  return product
    ? {
        title: product.name,
        description: product.description,
      }
    : { title: "Product not found" };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const product = getProduct(slug);
  if (!product) notFound();

  return <ProductDetail product={product} />;
}
