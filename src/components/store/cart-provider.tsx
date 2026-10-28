"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { getProduct, type Product } from "@/data/products";

const CART_STORAGE_KEY = "bawat-pieza-cart";
const ORDERS_STORAGE_KEY = "bawat-pieza-orders";
const SHIPPING_FEE = 250;
const FREE_SHIPPING_THRESHOLD = 5000;

export type CartEntry = {
  product: Product;
  quantity: number;
};

export type CustomerDetails = {
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  postalCode: string;
};

export type Order = {
  id: string;
  createdAt: string;
  customer: CustomerDetails;
  items: CartEntry[];
  subtotal: number;
  shipping: number;
  total: number;
  status: "Processing";
};

type CartContextValue = {
  items: CartEntry[];
  orders: Order[];
  itemCount: number;
  subtotal: number;
  shipping: number;
  total: number;
  storageMessage: string;
  availableStock: (productId: string) => number;
  addItem: (product: Product, quantity?: number) => void;
  removeItem: (productId: string) => void;
  setQuantity: (productId: string, quantity: number) => void;
  placeOrder: (customer: CustomerDetails) => Order | undefined;
};

const CartContext = createContext<CartContextValue | null>(null);

function isStoredOrder(value: unknown): value is Order {
  if (!value || typeof value !== "object") return false;
  const order = value as Partial<Order>;
  return (
    typeof order.id === "string" &&
    typeof order.createdAt === "string" &&
    isCustomerDetails(order.customer) &&
    Array.isArray(order.items) &&
    order.items.every(
      (item) =>
        Boolean(item?.product && getProduct(item.product.id)) &&
        Number.isInteger(item.quantity) &&
        item.quantity > 0,
    ) &&
    typeof order.subtotal === "number" &&
    typeof order.shipping === "number" &&
    typeof order.total === "number" &&
    order.status === "Processing"
  );
}

function isCustomerDetails(value: unknown): value is CustomerDetails {
  return (
    typeof value === "object" &&
    value !== null &&
    "name" in value &&
    "email" in value &&
    "phone" in value &&
    "address" in value &&
    "city" in value &&
    "postalCode" in value &&
    typeof value.name === "string" &&
    typeof value.email === "string" &&
    typeof value.phone === "string" &&
    typeof value.address === "string" &&
    typeof value.city === "string" &&
    typeof value.postalCode === "string"
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within CartProvider");
  }
  return context;
}

export default function CartProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [items, setItems] = useState<CartEntry[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [storageMessage, setStorageMessage] = useState("");

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        const savedCart = localStorage.getItem(CART_STORAGE_KEY);
        if (savedCart) {
          const parsed: unknown = JSON.parse(savedCart);
          if (Array.isArray(parsed)) {
            setItems(
              parsed.flatMap((entry): CartEntry[] => {
                if (!entry || typeof entry !== "object") return [];
                const { productId, quantity } = entry as {
                  productId?: unknown;
                  quantity?: unknown;
                };
                const product =
                  typeof productId === "string" ? getProduct(productId) : undefined;
                if (
                  !product ||
                  typeof quantity !== "number" ||
                  !Number.isInteger(quantity) ||
                  quantity < 1
                ) {
                  return [];
                }
                return [{ product, quantity: Math.min(quantity, product.stock) }];
              }),
            );
          }
        }

        const savedOrders = localStorage.getItem(ORDERS_STORAGE_KEY);
        if (savedOrders) {
          const parsed: unknown = JSON.parse(savedOrders);
          if (Array.isArray(parsed)) {
            setOrders(parsed.filter(isStoredOrder));
          }
        }
      } catch {
        setStorageMessage(
          "Saved shopping data could not be loaded from this browser.",
        );
      } finally {
        setHydrated(true);
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    const timer = window.setTimeout(() => {
      try {
        localStorage.setItem(
          CART_STORAGE_KEY,
          JSON.stringify(
            items.map(({ product, quantity }) => ({
              productId: product.id,
              quantity,
            })),
          ),
        );
        localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(orders));
      } catch {
        setStorageMessage(
          "Changes are available for this visit but could not be saved in this browser.",
        );
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, [hydrated, items, orders]);

  const value = useMemo<CartContextValue>(() => {
    const itemCount = items.reduce((count, item) => count + item.quantity, 0);
    const subtotal = items.reduce(
      (sum, item) => sum + item.product.price * item.quantity,
      0,
    );
    const shipping =
      subtotal === 0 || subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE;

    return {
      items,
      orders,
      itemCount,
      subtotal,
      shipping,
      total: subtotal + shipping,
      storageMessage,
      availableStock(productId) {
        const product = getProduct(productId);
        if (!product) return 0;
        const orderedQuantity = orders.reduce(
          (totalOrdered, order) =>
            totalOrdered +
            order.items.reduce(
              (orderQuantity, item) =>
                item.product.id === productId
                  ? orderQuantity + item.quantity
                  : orderQuantity,
              0,
            ),
          0,
        );
        return Math.max(0, product.stock - orderedQuantity);
      },
      addItem(product, quantity = 1) {
        setItems((current) => {
          const orderedQuantity = orders.reduce(
            (totalOrdered, order) =>
              totalOrdered +
              order.items.reduce(
                (orderQuantity, item) =>
                  item.product.id === product.id
                    ? orderQuantity + item.quantity
                    : orderQuantity,
                0,
              ),
            0,
          );
          const availableStock = Math.max(0, product.stock - orderedQuantity);
          if (availableStock === 0) return current;
          const existing = current.find((item) => item.product.id === product.id);
          const currentQuantity = existing?.quantity ?? 0;
          const nextQuantity = Math.min(
            availableStock,
            currentQuantity + Math.max(1, quantity),
          );
          if (existing) {
            return current.map((item) =>
              item.product.id === product.id
                ? { ...item, quantity: nextQuantity }
                : item,
            );
          }
          return [...current, { product, quantity: nextQuantity }];
        });
      },
      removeItem(productId) {
        setItems((current) =>
          current.filter((item) => item.product.id !== productId),
        );
      },
      setQuantity(productId, quantity) {
        const product = getProduct(productId);
        if (!product || !Number.isInteger(quantity) || quantity < 1) return;
        const orderedQuantity = orders.reduce(
          (totalOrdered, order) =>
            totalOrdered +
            order.items.reduce(
              (orderQuantity, item) =>
                item.product.id === productId
                  ? orderQuantity + item.quantity
                  : orderQuantity,
              0,
            ),
          0,
        );
        setItems((current) =>
          current.map((item) =>
            item.product.id === productId
              ? {
                  ...item,
                  quantity: Math.min(
                    quantity,
                    Math.max(0, product.stock - orderedQuantity),
                  ),
                }
              : item,
          ),
        );
      },
      placeOrder(customer) {
        if (!isCustomerDetails(customer) || items.length === 0) return undefined;
        const order: Order = {
          id: `BP-${Date.now().toString(36).toUpperCase()}`,
          createdAt: new Date().toISOString(),
          customer,
          items: items.map((item) => ({ ...item })),
          subtotal,
          shipping,
          total: subtotal + shipping,
          status: "Processing",
        };
        setOrders((current) => [order, ...current]);
        setItems([]);
        return order;
      },
    };
  }, [items, orders, storageMessage]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}
