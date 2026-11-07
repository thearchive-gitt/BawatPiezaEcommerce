export type Product = {
  id: string;
  name: string;
  category: string;
  price: number;
  image: string;
  gallery?: string[];
  note?: string;
  description: string;
  stock: number;
  specifications: { label: string; value: string }[];
};

export const products: Product[] = [
  {
    id: "kinetic-floor-tile",
    name: "Piezo Dynamo Technology Tile",
    category: "Energy tiles",
    price: 2750,
    image: "/products/kinetic-floor-tile.png",
    gallery: [
      "/products/kinetic-floor-tile-internal.png",
      "/products/kinetic-floor-tile-side.png",
    ],
    note: "FLAGSHIP",
    description:
      "A modular floor tile that turns footsteps into a small electrical output. Piezoelectric elements capture each press, while the integrated dynamo mechanism supports energy harvesting from repeated movement.",
    stock: 18,
    specifications: [
      { label: "Conversion", value: "Piezoelectric + dynamo-assisted" },
      { label: "Tile size", value: "300 × 300 × 45 mm" },
      { label: "Output", value: "Up to 5 W peak per tile*" },
      { label: "Output connection", value: "5 V DC, USB-C" },
      { label: "Top surface", value: "Textured, slip-resistant composite" },
      { label: "Installation", value: "Modular, indoor use" },
    ],
  },
];

export function getProduct(id: string) {
  return products.find((product) => product.id === id);
}

export function formatPrice(price: number) {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    maximumFractionDigits: 0,
  }).format(price);
}
