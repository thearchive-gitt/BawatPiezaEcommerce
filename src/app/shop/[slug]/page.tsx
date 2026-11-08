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
  const product = await getMetadataProduct(slug);
  return product
    ? {
        title: `${product.name} | Kinetic Energy Flooring`,
        description: product.description,
        alternates: { canonical: `/products/${product.id}` },
        openGraph: {
          type: "website",
          title: product.name,
          description: product.description,
          images: [{ url: product.image, alt: product.name }],
        },
      }
    : { title: "Product not found" };
}

async function getMetadataProduct(slug: string) {
  "use cache";
  const fallback = getProduct(slug);
  const apiUrl = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000").replace(/\/+$/, "");
  try {
    const response = await fetch(`${apiUrl}/api/v1/store/products/${encodeURIComponent(slug)}`, {
      next: { revalidate: 300 },
    });
    if (!response.ok) return fallback;
    const payload = (await response.json()) as { product?: { id?: string; name?: string; category?: string; price?: number; stock?: number } };
    const databaseProduct = payload.product;
    if (!databaseProduct || !fallback) return fallback;
    return { ...fallback, ...databaseProduct, id: databaseProduct.id ?? fallback.id, name: databaseProduct.name ?? fallback.name };
  } catch (error) {
    console.warn("[seo] Product metadata database lookup failed; using catalog fallback.", error);
    return fallback;
  }
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const product = getProduct(slug);
  if (!product) notFound();

  return <ProductDetail product={product} />;
}
