"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { apiFetch } from "@/lib/api";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { getProduct, type Product } from "@/data/products";

const CART_STORAGE_KEY = "bawat-pieza-cart";
const SHIPPING_FEE = 250;
const FREE_SHIPPING_THRESHOLD = 5000;

export type CartEntry = { product: Product; quantity: number };
export type CustomerDetails = {
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  postalCode: string;
  landmark: string;
  region?: string;
  regionCode?: string;
  province?: string;
  provinceCode?: string;
  barangay?: string;
  barangayCode?: string;
  cityCode?: string;
  latitude?: number | null;
  longitude?: number | null;
  distanceKm?: number | null;
  locationSource?: "device" | "address";
  locationAccuracyMeters?: number | null;
};
export type PaymentMethod = "cod" | "gcash";
export type Order = {
  id: string;
  createdAt: string;
  customer: CustomerDetails;
  items: CartEntry[];
  subtotal: number;
  shipping: number;
  total: number;
  status: string;
  paymentMethod: PaymentMethod;
  paymentStatus: "pending" | "paid" | "failed";
  deliveryStatus: "received" | "preparing" | "pickup" | "delivered" | "cancelled";
};

type StoredOrder = {
  id: string;
  created_at: string;
  customer: CustomerDetails;
  items: Array<{ product: Product; quantity: number }>;
  subtotal: number;
  shipping: number;
  total: number;
  status: string;
  payment_method?: PaymentMethod;
  payment_status?: "pending" | "paid" | "failed";
  delivery_status?: Order["deliveryStatus"];
};

type CartContextValue = {
  items: CartEntry[];
  orders: Order[];
  itemCount: number;
  subtotal: number;
  shipping: number;
  total: number;
  storageMessage: string;
  hasUnavailableItems: boolean;
  availableStock: (productId: string) => number;
  addItem: (product: Product, quantity?: number) => void;
  removeItem: (productId: string) => void;
  setQuantity: (productId: string, quantity: number) => void;
  buyNow: (product: Product, quantity: number) => void;
  placeOrder: (
    customer: CustomerDetails,
    paymentMethod: PaymentMethod,
  ) => Promise<{ order: Order; checkoutUrl: string | null } | undefined>;
  cancelOrder: (orderId: string) => Promise<Order>;
};

const CartContext = createContext<CartContextValue | null>(null);

function normalizeOrder(order: StoredOrder): Order {
  return {
    id: order.id,
    createdAt: order.created_at,
    customer: order.customer,
    items: order.items.flatMap((item) => {
      const product = getProduct(item.product.id);
      return product ? [{ product, quantity: item.quantity }] : [];
    }),
    subtotal: Number(order.subtotal),
    shipping: Number(order.shipping),
    total: Number(order.total),
    status: order.status,
    paymentMethod: order.payment_method ?? "cod",
    paymentStatus: order.payment_status ?? "pending",
    deliveryStatus: order.delivery_status ?? "received",
  };
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used within CartProvider");
  return context;
}

export default function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartEntry[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [storageMessage, setStorageMessage] = useState("");
  const [catalogStock, setCatalogStock] = useState<Record<string, number>>({});

  useEffect(() => {
    let active = true;
    const loadCatalogStock = async () => {
      try {
        const response = await apiFetch("/api/v1/store/products");
        const body = (await response.json()) as {
          products?: Array<{ id: string; stock: number }>;
        };
        if (!active) return;
        setCatalogStock(
          Object.fromEntries(
            (body.products ?? []).map((product) => [product.id, product.stock]),
          ),
        );
      } catch {
        if (active) setStorageMessage("Live stock could not be loaded. Checkout will recheck availability.");
      }
    };
    void loadCatalogStock();
    const refreshTimer = window.setInterval(() => void loadCatalogStock(), 15000);
    return () => {
      active = false;
      window.clearInterval(refreshTimer);
    };
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        const savedCart = localStorage.getItem(CART_STORAGE_KEY);
        if (savedCart) {
          const parsed: unknown = JSON.parse(savedCart);
          if (Array.isArray(parsed)) {
            setItems(parsed.flatMap((entry): CartEntry[] => {
              if (!entry || typeof entry !== "object") return [];
              const { productId, quantity } = entry as { productId?: unknown; quantity?: unknown };
              const product = typeof productId === "string" ? getProduct(productId) : undefined;
              if (!product || !Number.isInteger(quantity) || Number(quantity) < 1) return [];
              return [{ product, quantity: Math.min(Number(quantity), Math.max(product.stock, 1)) }];
            }));
          }
        }
      } catch {
        setStorageMessage("Saved shopping data could not be loaded from this browser.");
      } finally {
        setHydrated(true);
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(
        CART_STORAGE_KEY,
        JSON.stringify(items.map(({ product, quantity }) => ({ productId: product.id, quantity }))),
      );
    } catch {
      window.setTimeout(
        () => setStorageMessage("Your bag is available for this visit but could not be saved in this browser."),
        0,
      );
    }
  }, [hydrated, items]);

  useEffect(() => {
    let active = true;
    let refreshTimer: number | undefined;
    const loadOrders = async () => {
      try {
        const response = await apiFetch("/api/v1/store/orders");
        const body = (await response.json()) as { orders: StoredOrder[] };
        if (active) setOrders((body.orders ?? []).map(normalizeOrder));
      } catch (error) {
        if (active) setStorageMessage(error instanceof Error ? error.message : "Order history could not be loaded.");
      }
    };
    void getSupabaseBrowserClient().auth.getSession().then(async ({ data }) => {
      if (!data.session) return;
      await loadOrders();
      refreshTimer = window.setInterval(() => void loadOrders(), 15000);
    });
    return () => {
      active = false;
      if (refreshTimer) window.clearInterval(refreshTimer);
    };
  }, []);

  const value = useMemo<CartContextValue>(() => {
    const itemCount = items.reduce((count, item) => count + item.quantity, 0);
    const subtotal = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
    const shipping = subtotal === 0 || subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE;
    const hasUnavailableItems = items.some((item) => {
      const stock = catalogStock[item.product.id] ?? 0;
      return item.quantity > stock;
    });

    return {
      items,
      orders,
      itemCount,
      subtotal,
      shipping,
      total: subtotal + shipping,
      storageMessage,
      hasUnavailableItems,
      availableStock(productId) {
        return Math.max(0, catalogStock[productId] ?? 0);
      },
      addItem(product, quantity = 1) {
        setItems((current) => {
          const availableStock = Math.max(0, catalogStock[product.id] ?? 0);
          const existing = current.find((item) => item.product.id === product.id);
          if (availableStock < 1) {
            return existing
              ? current
              : [...current, { product, quantity: Math.max(1, quantity) }];
          }
          const nextQuantity = Math.min(availableStock, (existing?.quantity ?? 0) + Math.max(1, quantity));
          if (nextQuantity < 1) return current;
          return existing
            ? current.map((item) => item.product.id === product.id ? { ...item, quantity: nextQuantity } : item)
            : [...current, { product, quantity: nextQuantity }];
        });
      },
      removeItem(productId) {
        setItems((current) => current.filter((item) => item.product.id !== productId));
      },
      setQuantity(productId, quantity) {
        const product = getProduct(productId);
        if (!product || !Number.isInteger(quantity) || quantity < 1) return;
        if ((catalogStock[productId] ?? 0) < 1) return;
        setItems((current) => current.map((item) =>
          item.product.id === productId
            ? {
                ...item,
                quantity: Math.min(
                  quantity,
                  Math.max(
                    0,
                    catalogStock[productId] ?? 0,
                  ),
                ),
              }
            : item,
        ));
      },
      buyNow(product, quantity) {
        const stock = Math.max(0, catalogStock[product.id] ?? 0);
        if (stock < 1 || !Number.isInteger(quantity) || quantity < 1) return;
        setItems([{ product, quantity: Math.min(quantity, stock) }]);
      },
      async placeOrder(customer, paymentMethod) {
        if (!customer || items.length === 0) return undefined;
        if (hasUnavailableItems) {
          throw new Error("One or more items are out of stock. Remove them or save them for later before ordering.");
        }
        const response = await apiFetch("/api/v1/store/checkout", {
          method: "POST",
          body: JSON.stringify({
            customer,
            items: items.map((item) => ({ productId: item.product.id, quantity: item.quantity })),
            paymentMethod,
          }),
        });
        const body = (await response.json()) as {
          order: StoredOrder;
          checkoutUrl: string | null;
        };
        const order = normalizeOrder(body.order);
        setOrders((current) => [order, ...current]);
        setItems([]);
        return { order, checkoutUrl: body.checkoutUrl ?? null };
      },
      async cancelOrder(orderId) {
        const response = await apiFetch(`/api/v1/store/orders/${encodeURIComponent(orderId)}/cancel`, {
          method: "POST",
        });
        const body = (await response.json()) as { order: StoredOrder };
        const cancelledOrder = normalizeOrder(body.order);
        setOrders((current) => current.map((order) => order.id === orderId ? cancelledOrder : order));
        return cancelledOrder;
      },
    };
  }, [catalogStock, items, orders, storageMessage]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}
