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
    name: "Kinetic Floor Tile",
    category: "Energy tiles",
    price: 4850,
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
  {
    id: "dynamo-harvester",
    name: "Dynamo Harvester Module",
    category: "Harvesting modules",
    price: 1890,
    image: "/products/dynamo-harvester.svg",
    note: "TILE COMPATIBLE",
    description:
      "A compact electromagnetic generator module for kinetic-energy experiments and compatible Bawat Pieza tile prototypes. Includes a rectifier board and wiring terminals.",
    stock: 32,
    specifications: [
      { label: "Generator", value: "Low-speed electromagnetic dynamo" },
      { label: "Rectifier", value: "Full-wave bridge output" },
      { label: "Output", value: "Up to 3 W peak*" },
      { label: "Connector", value: "Screw terminals, 2-pin" },
      { label: "Mounting", value: "Four-point M3 bracket" },
      { label: "Compatible with", value: "Kinetic Floor Tile prototypes" },
    ],
  },
  {
    id: "piezo-sensor-strip",
    name: "Piezo Sensor Strip",
    category: "Piezo components",
    price: 950,
    image: "/products/piezo-sensor-strip.svg",
    description:
      "A flexible piezoelectric strip for sensing pressure and vibration in floor-tile prototypes, interactive installations, and classroom projects.",
    stock: 46,
    specifications: [
      { label: "Element", value: "Flexible piezoelectric film" },
      { label: "Strip length", value: "250 mm" },
      { label: "Response", value: "Pressure and vibration" },
      { label: "Lead length", value: "150 mm" },
      { label: "Mounting", value: "Adhesive backing" },
      { label: "Use", value: "Low-voltage sensing and experiments" },
    ],
  },
  {
    id: "energy-controller",
    name: "Energy Storage Controller",
    category: "Controllers",
    price: 2350,
    image: "/products/energy-controller.svg",
    note: "IN STOCK",
    description:
      "A compact power-management board for rectifying and regulating small harvested-energy inputs before connecting to a compatible low-voltage storage or demonstration load.",
    stock: 12,
    specifications: [
      { label: "Input", value: "5–12 V DC, screw terminals" },
      { label: "Regulated output", value: "5 V DC, USB-A" },
      { label: "Protection", value: "Overcurrent and reverse polarity" },
      { label: "Indicators", value: "Input and output status LEDs" },
      { label: "Mounting", value: "Four-point M3 bracket" },
      { label: "Use", value: "Low-voltage demonstration systems" },
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
